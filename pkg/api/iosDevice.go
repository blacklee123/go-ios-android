package api

import (
	"io"
	"net/http"
	"strconv"

	"github.com/danielpaulus/go-ios/ios/syslog"

	"github.com/blacklee123/go-ios-android/pkg/api/iosvo"
	"github.com/blacklee123/go-ios-android/pkg/utils"
	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/diagnostics"
	"github.com/danielpaulus/go-ios/ios/instruments"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func (s *Server) hListIOS(c *gin.Context) {
	devices := s.listIOS()
	c.JSON(http.StatusOK, devices)
}

func (s *Server) listIOS() []iosvo.Device {
	devices := make([]iosvo.Device, 0, len(s.iosDevices))
	for _, device := range s.iosDevices {

		allValues, err := ios.GetValues(device)
		s.logger.Info("allValues", zap.Any("allValues", allValues))
		if err != nil {
			continue
		}
		deviceVo := iosvo.Device{
			UdID:         device.Properties.SerialNumber,
			Name:         allValues.Value.DeviceName,
			Model:        "",
			Platform:     "ios",
			Size:         allValues.Value.SerialNumber,
			CPU:          allValues.Value.CPUArchitecture,
			Manufacturer: "APPLE",
			IsHm:         false,
			Version:      allValues.Value.ProductVersion,
		}
		if allValues.Value.ProductType != "" {
			deviceVo.Model = utils.GenerationMap[allValues.Value.ProductType]
		}

		conn, err := diagnostics.New(device)
		if err != nil {
			s.logger.Error("failed diagnostics service", zap.Error(err))
		}
		defer conn.Close()

		stats, err := conn.Battery()
		if err != nil {
			s.logger.Error("failed to get battery stats", zap.Error(err))
		}

		voltage := stats.Voltage
		temperature := stats.Temperature
		level := stats.CurrentCapacity
		deviceVo.Voltage = float64(voltage)
		deviceVo.Temperature = float64(temperature)
		deviceVo.Level = level

		devices = append(devices, deviceVo)
	}

	return devices
}

func (s *Server) hRetrieveIOS(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	allValues, err := ios.GetValues(device)
	if err != nil {
		s.logger.Error("failed to get device values", zap.String("udid", device.Properties.SerialNumber), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed getting device values",
		})
		return
	}

	c.JSON(http.StatusOK, iosvo.DeviceInfo{
		CPUArchitecture: allValues.Value.CPUArchitecture,
		DeviceName:      allValues.Value.DeviceName,
		DevicePlatform:  "ios",
		DeviceSerialNo:  device.Properties.SerialNumber,
		WdaPort:         s.iosForwards[device.Properties.SerialNumber][8100],
		Version:         allValues.Value.ProductVersion,
	})
}

func (s *Server) hScreenshot(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)

	screenshotService, err := instruments.NewScreenshotService(device)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}
	defer screenshotService.Close()

	imageBytes, err := screenshotService.TakeScreenshot()
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	c.Header("Content-Type", "image/png")
	c.Data(http.StatusOK, "application/octet-stream", imageBytes)
}

func (s *Server) hSyslog(c *gin.Context) {
	// We are streaming current time to clients in the interval 10 seconds
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	syslogConnection, err := syslog.New(device)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}
	c.Stream(func(w io.Writer) bool {
		m, _ := syslogConnection.ReadLogMessage()
		// s.logger.Info("syslog", zap.String("message", m), zap.String("udid", device.Properties.SerialNumber))
		// Stream message to client from message channel
		// w.Write([]byte(utils.MustMarshal(m)))
		c.SSEvent("message", m)
		return true
	})
}

func (s *Server) hListForward(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	c.JSON(http.StatusOK, s.iosForwards[device.Properties.SerialNumber])
}

func (s *Server) hRetrieveForward(c *gin.Context) {
	port, err := strconv.Atoi(c.Param("port"))
	if err != nil || port > 65535 || port < 0 {
		c.JSON(http.StatusBadRequest, GenericResponse{Error: "invalid port"})
		return
	}
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	forwaredPort, ok := s.iosForwards[device.Properties.SerialNumber][port]
	if ok {
		c.JSON(http.StatusOK, gin.H{
			"port": forwaredPort,
		})
	} else {
		hostPort, _, errs := s.createForward(device, 0, port)
		if errs != nil {
			c.JSON(http.StatusInternalServerError, GenericResponse{Error: errs.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"port": hostPort,
		})
	}
}

type ForwardPorts struct {
	Ports []int `json:"Ports" binding:"required"`
}

func (s *Server) hCreateForward(c *gin.Context) {
	var ports ForwardPorts
	// 将请求体绑定到结构体
	if err := c.ShouldBindJSON(&ports); err != nil {
		// 绑定失败时返回错误信息
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	for _, port := range ports.Ports {

		cl, _, err := s.createForward(device, 0, port)
		if err == nil {
			defer stopForwarding(cl)
		}
	}
	c.JSON(http.StatusOK, s.iosForwards[device.Properties.SerialNumber])

}

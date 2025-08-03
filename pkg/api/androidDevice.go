package api

import (
	"bytes"
	"fmt"
	"image/png"
	"net/http"
	"strconv"
	"strings"

	"github.com/blacklee123/go-adb/adb"
	"github.com/blacklee123/go-ios-android/pkg/api/iosvo"
	"github.com/gin-gonic/gin"
)

func (s *Server) hListAndroid(c *gin.Context) {
	devices := s.listAndroid()
	c.JSON(http.StatusOK, devices)
}

func (s *Server) listAndroid() []iosvo.Device {
	devices := make([]iosvo.Device, 0, len(s.androidDevice))

	for _, device := range s.androidDevice {
		deviceVo := iosvo.Device{
			UdID:         device.Serial(),
			Name:         device.GetProp("ro.product.name"),
			Model:        device.GetProp("ro.product.model"),
			Platform:     "android",
			Size:         device.GetScreenSize(),
			CPU:          device.GetProp("ro.product.cpu.abi"),
			Manufacturer: device.GetProp("ro.product.manufacturer"),
		}
		if strings.Contains(device.GetProp("ro.config.ringtone"), "Harmony") {
			deviceVo.IsHm = true
			deviceVo.Version = device.GetProp("hw_sc.build.platform.version")
		} else {
			deviceVo.IsHm = false
			deviceVo.Version = device.GetProp("ro.build.version.release")
		}
		batterInfo, err := device.Battery()
		voltage, _ := strconv.ParseFloat(batterInfo["voltage"], 64)
		temperature, _ := strconv.ParseFloat(batterInfo["temperature"], 64)
		level, _ := strconv.Atoi(batterInfo["level"])
		if err == nil {
			deviceVo.Voltage = voltage
			deviceVo.Temperature = temperature
			deviceVo.Level = level
		}

		devices = append(devices, deviceVo)
	}
	return devices
}

func (s *Server) hAndroidScreenshot(c *gin.Context) {
	device := c.MustGet(ANDROID_KEY).(adb.Device)
	quality := c.DefaultQuery("qulaity", "25")
	// 解析质量参数
	q, err := strconv.Atoi(quality)
	if err != nil || q < 1 || q > 100 {
		q = 25 // 无效值时使用默认值
	}

	img, err := device.Screenshot()
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	buf := new(bytes.Buffer)
	encoder := png.Encoder{
		CompressionLevel: png.DefaultCompression,
	}

	// 根据质量参数调整压缩级别
	if q < 30 {
		encoder.CompressionLevel = png.BestSpeed
	} else if q > 80 {
		encoder.CompressionLevel = png.BestCompression
	}

	if err := encoder.Encode(buf, img); err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: fmt.Sprintf("failed to encode PNG: %v", err),
		})
		return
	}
	imageBytes := buf.Bytes()

	c.Header("Content-Type", "image/png")
	c.Data(http.StatusOK, "application/octet-stream", imageBytes)
}

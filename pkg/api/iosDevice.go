package api

import (
	"net/http"

	"github.com/blacklee123/go-ios-android/pkg/api/iosvo"
	"github.com/danielpaulus/go-ios/ios"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func (s *Server) hListIOS(c *gin.Context) {
	deviceList, err := ios.ListDevices()
	if err != nil {
		s.logger.Error("failed to list devices", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed getting device list",
		})
		return // 必须return，否则会继续执行下面的代码
	}
	ret := make([]iosvo.DeviceInfo, 0, len(deviceList.DeviceList))
	for _, device := range deviceList.DeviceList {

		allValues, err := ios.GetValues(device)
		if err != nil {
			continue
		}
		ret = append(ret, iosvo.DeviceInfo{
			CPUArchitecture: allValues.Value.CPUArchitecture,
			DeviceName:      allValues.Value.DeviceName,
			DevicePlatform:  "ios",
			DeviceSerialNo:  device.Properties.SerialNumber,
			Port:            s.forwards[device.Properties.SerialNumber][8100],
			RelayOK:         true,
			Version:         allValues.Value.ProductVersion,
		})
	}

	c.JSON(http.StatusOK, ret)
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
		Port:            s.forwards[device.Properties.SerialNumber][8100],
		RelayOK:         true,
		Version:         allValues.Value.ProductVersion,
	})
}

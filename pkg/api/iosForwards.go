package api

import (
	"net/http"

	"github.com/blacklee123/go-ios-android/pkg/utils/validator"
	"github.com/danielpaulus/go-ios/ios"
	"github.com/gin-gonic/gin"
)

func (s *Server) hListForward(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	c.JSON(http.StatusOK, s.iosForwards[device.Properties.SerialNumber])
}

func (s *Server) hRetrieveForward(c *gin.Context) {
	portStr := c.Param("port")
	port, err := validator.Port(portStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, GenericResponse{Error: "invalid port"})
		return
	}
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)

	// 检查是否已存在转发
	if deviceForwards, exists := s.iosForwards[device.Properties.SerialNumber]; exists {
		if forwardedPort, ok := deviceForwards[port]; ok {
			c.JSON(http.StatusOK, gin.H{"port": forwardedPort})
			return
		}
	}

	// 创建新转发
	_, hostPort, err := s.createForward(device, 0, port)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"port": hostPort})
}

type ForwardPorts struct {
	Ports []int `json:"ports" binding:"required"`
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

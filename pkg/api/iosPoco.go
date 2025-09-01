package api

import (
	"encoding/json"
	"net/http"

	"github.com/blacklee123/go-ios-android/pkg/utils/poco"
	"github.com/blacklee123/go-ios-android/pkg/utils/validator"
	"github.com/danielpaulus/go-ios/ios"
	"github.com/gin-gonic/gin"
)

func (s *Server) hPocoDump(c *gin.Context) {
	portStr := c.Param("port")
	port, err := validator.Port(portStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, GenericResponse{Error: "invalid port"})
		return
	}
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)

	forwaredPort, ok := s.iosForwards[device.Properties.SerialNumber][port]

	if !ok {
		_, forwaredPort, err = s.createForward(device, 0, port)
		if err != nil {
			c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
			return
		}
	}
	pocoClient := poco.NewPocoClient(forwaredPort)
	dump, err := pocoClient.Dump()
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	// 提取result字段
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(dump), &result); err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: "Failed to parse dump result"})
		return
	}

	if resultData, exists := result["result"]; exists {
		c.JSON(http.StatusOK, resultData)
	} else {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: "No result field found in response"})
	}

}

package api

import (
	"github.com/danielpaulus/go-ios/ios"
	"github.com/gin-gonic/gin"
)

func (s *Server) hWda(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	proxy := s.wdaProxys[device.Properties.SerialNumber]

	// 获取路由参数中捕获的路径部分
	path := c.Param("path")

	// 更新请求路径
	if path == "" {
		// 处理直接访问 /wda 的情况
		c.Request.URL.Path = "/"
	} else {
		// 注意：path 参数包含前置的斜杠（如 "/status"）
		c.Request.URL.Path = path
	}

	// 清除编码后的路径，避免冲突
	c.Request.URL.RawPath = ""

	proxy.ServeHTTP(c.Writer, c.Request)
}

func (s *Server) hWdaVideo(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	proxy := s.wdaVideoProxys[device.Properties.SerialNumber]

	// 获取路由参数中捕获的路径部分
	path := c.Param("path")

	// 更新请求路径
	if path == "" {
		// 处理直接访问 /wda 的情况
		c.Request.URL.Path = "/"
	} else {
		// 注意：path 参数包含前置的斜杠（如 "/status"）
		c.Request.URL.Path = path
	}

	// 清除编码后的路径，避免冲突
	c.Request.URL.RawPath = ""

	proxy.ServeHTTP(c.Writer, c.Request)
}

package api

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/instruments"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func (s *Server) hListAttributes(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	deviceInfoService, err := instruments.NewDeviceInfoService(device)
	if err != nil {
		s.logger.Error("failed opening deviceInfoService for getting attributes")
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed opening deviceInfoService",
		})
		return
	}

	sysAttrs, err := deviceInfoService.SystemAttributes()
	if err != nil {
		s.logger.Error("failed getting system attributes")
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed getting system attributes",
		})
		return
	}

	procAttrs, err := deviceInfoService.ProcessAttributes()
	if err != nil {
		s.logger.Error("failed getting process attributes")
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed getting process attributes",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"system":  sysAttrs,
		"process": procAttrs,
	})
}

func (s *Server) hPerf(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	sysmon, err := instruments.NewSysmontapService2(device)
	if err != nil {
		s.logger.Error("failed creating systemMonitor")
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed creating systemMonitor",
		})
		return
	}
	defer sysmon.Close()

	// 配置性能选项
	options := instruments.PerfOptions{
		SysCPU:         true, // 启用系统CPU监控
		SysMem:         true, // 启用系统内存监控
		SysDisk:        true, // 启用系统磁盘监控
		SysNetwork:     true, // 启用系统网络监控
		Pid:            0,    // 可选：监控特定进程ID
		OutputInterval: 1000, // 输出间隔（毫秒）

		// 系统属性配置
		SystemAttributes: []string{
			"vmCompressorPageCount",
			"vmExtPageCount",
			"vmFreeCount",
			"vmIntPageCount",
			"vmPurgeableCount",
			"vmWireCount",
			"vmUsedCount",
			"__vmSwapUsage",
			"physMemSize",

			"diskBytesRead",
			"diskBytesWritten",
			"diskReadOps",
			"diskWriteOps",
			"netBytesIn",
			"netBytesOut",
			"netPacketsIn",
			"netPacketsOut",
		},

		// 进程属性配置
		ProcessAttributes: []string{
			"memVirtualSize",
			"cpuUsage",
			"ctxSwitch",
			"intWakeups",
			"physFootprint",
			"memResidentSize",
			"memAnon",
			"pid",
		},
	}

	// 启动性能监控
	sysData, err := sysmon.Start(options)
	if err != nil {
		s.logger.Error("failed to start performance monitoring")
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed to start performance monitoring",
		})
		return
	}
	c.Stream(func(w io.Writer) bool {
		select {
		case <-c.Request.Context().Done(): // 处理客户端断开
			s.logger.Info("client disconnected, stop streaming.")
			return false
		case jsonData, ok := <-sysData:
			if !ok {
				s.logger.Info("performance data channel closed.")
				return false
			}

			// 解析基本类型以确定数据类型
			var baseData instruments.PerfDataBase
			if err := json.Unmarshal(jsonData, &baseData); err != nil {
				s.logger.Error("failed to parse base data", zap.Error(err))
				return true
			}

			c.SSEvent(baseData.Type, string(jsonData))
			return true
		}
	})

}

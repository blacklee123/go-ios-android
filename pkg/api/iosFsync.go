package api

import (
	"net/http"
	"os"
	"path"
	"path/filepath"

	"github.com/blacklee123/go-ios-android/pkg/utils"
	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/afc"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func (s *Server) hListFiles(c *gin.Context) {
	containerBundleId := c.Param("bundleid")
	udid := c.Param("udid")
	path := c.Param("filepath")

	s.logger.Info("listFiles", zap.String("udid", udid), zap.String("path", path), zap.String("containerBundleId", containerBundleId))

	cleanPath := filepath.Clean(path)
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)

	var afcService *afc.Connection
	var err error
	if containerBundleId == "" {
		afcService, err = afc.New(device)
	} else {
		cleanPath = filepath.Join("Documents", cleanPath)
		afcService, err = afc.NewContainer(device, containerBundleId)
	}
	if err != nil {
		s.logger.Error("failed to open afc service", zap.String("udid", udid), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed opening afc service",
		})
		return
	}
	defer afcService.Close()

	files, err := afcService.ListFiles(cleanPath, "*")

	if err != nil {
		s.logger.Error("fsync: failed to list files", zap.String("path", cleanPath), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed getting fsync tree",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": files,
	})
}

func (s *Server) hPullFile(c *gin.Context) {
	containerBundleId := c.Param("bundleid")
	udid := c.Param("udid")
	_path := c.Param("filepath")

	s.logger.Info("pullFile", zap.String("udid", udid), zap.String("path", _path), zap.String("containerBundleId", containerBundleId))

	// 创建系统临时目录
	tmpDir, err := os.MkdirTemp("", "fsync-*")
	if err != nil {
		s.logger.Error("failed to create temp dir", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create temp directory"})
		return
	}
	defer os.RemoveAll(tmpDir)

	cleanPath := filepath.Clean(_path)
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)

	var afcService *afc.Connection
	if containerBundleId == "" {
		afcService, err = afc.New(device)
	} else {
		cleanPath = filepath.Join("Documents", cleanPath)
		afcService, err = afc.NewContainer(device, containerBundleId)
	}
	if err != nil {
		s.logger.Error("failed to open afc service", zap.String("udid", udid), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed opening afc service",
		})
		return
	}
	defer afcService.Close()

	localPath := filepath.Join(tmpDir, filepath.Base(cleanPath))

	if err := os.MkdirAll(filepath.Dir(localPath), 0700); err != nil {
		s.logger.Error("failed to create local directory", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create local directory"})
		return
	}

	// 从设备拉取文件/目录
	if err := afcService.Pull(cleanPath, localPath); err != nil {
		s.logger.Error("fsync pull failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fsync: pull failed"})
		return
	}

	// 从设备拉取文件/目录
	if err := afcService.Pull(cleanPath, localPath); err != nil {
		s.logger.Error("fsync pull failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fsync: pull failed"})
	}
	// 处理文件
	fileInfo, err := os.Stat(localPath)
	if err != nil {
		s.logger.Error("failed to stat local file", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to access local file"})
		return
	}

	if !fileInfo.IsDir() {
		c.Header("Content-Type", "application/octet-stream")
		c.Header("Content-Disposition", "attachment; filename=\""+filepath.Base(localPath)+"\"")
		c.File(localPath)
		return
	}
	zipPath := path.Join(tmpDir, filepath.Base(localPath)+".zip")
	if err = utils.ZipDir(localPath, zipPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "zip failed",
		})
		return
	}
	defer os.Remove(zipPath) // 结束后删除临时文件

	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", "attachment; filename=\""+filepath.Base(localPath)+".zip"+"\"")
	c.File(zipPath)
}

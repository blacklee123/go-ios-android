package api

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"

	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/installationproxy"
	"github.com/danielpaulus/go-ios/ios/instruments"
	"github.com/danielpaulus/go-ios/ios/springboard"
	"github.com/danielpaulus/go-ios/ios/zipconduit"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func (s *Server) hListApp(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	appType := c.Query("type") // all | system | user | filesharingapps
	if appType == "" {
		appType = "user"
	}
	response, err := s.listApp(device, appType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed getting process list",
		})
		return
	}
	ret := make([]map[string]interface{}, 0, len(response))
	for _, app := range response {
		ret = append(ret, map[string]interface{}{
			"CFBundleIdentifier":         app.CFBundleIdentifier(),
			"CFBundleName":               app.CFBundleName(),
			"CFBundleShortVersionString": app.CFBundleShortVersionString(),
		})
	}
	c.JSON(http.StatusOK, ret)
}

func (s *Server) hListAppWithIcon(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	appType := c.Query("type") // all | system | user | filesharingapps
	if appType == "" {
		appType = "user"
	}
	response, err := s.listApp(device, appType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed getting process list",
		})
		return
	}
	ret := make([]map[string]interface{}, 0, len(response))
	client, _ := springboard.NewClient(device)
	defer client.Close()
	for _, app := range response {
		icon, _ := client.GetIconPNGData(app.CFBundleIdentifier())
		ret = append(ret, map[string]interface{}{
			"CFBundleIdentifier":         app.CFBundleIdentifier(),
			"CFBundleName":               app.CFBundleName(),
			"CFBundleShortVersionString": app.CFBundleShortVersionString(),
			"CFBundleVersion":            app["CFBundleVersion"],
			"ExecutableName":             app["CFBundleExecutable"],
			"Icon":                       base64.StdEncoding.EncodeToString(icon),
		})
	}
	c.JSON(http.StatusOK, ret)
}

func (s *Server) listApp(device ios.DeviceEntry, appType string) ([]installationproxy.AppInfo, error) {
	svc, _ := installationproxy.New(device)
	var err error
	var response []installationproxy.AppInfo
	switch appType {
	case "all":
		response, err = svc.BrowseAllApps()
	case "system":
		response, err = svc.BrowseSystemApps()
	case "user":
		response, err = svc.BrowseUserApps()
	case "filesharingapps":
		response, err = svc.BrowseFileSharingApps()
	}
	return response, err
}

func (s *Server) hUninstallApp(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	bundleId := c.Param("bundleid")
	s.logger.Info("uninstallApp", zap.String("udid", device.Properties.SerialNumber), zap.String("bundleId", bundleId))

	if err := s._uninstallApp(device, bundleId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed uninstalling app",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "uninstalled " + bundleId + " from device " + device.Properties.SerialNumber,
	})
}

func (s *Server) hLaunchApp(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	bundleId := c.Param("bundleid")
	if bundleId == "" {
		c.JSON(http.StatusUnprocessableEntity, GenericResponse{Error: "bundleId is missing"})
		return
	}
	s.logger.Info("launchApp", zap.String("udid", device.Properties.SerialNumber), zap.String("bundleId", bundleId))

	pControl, err := instruments.NewProcessControl(device)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	_, err = pControl.LaunchApp(bundleId, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, GenericResponse{Message: bundleId + " launched successfully"})
}

func (s *Server) hKillApp(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	processName := ""
	bundleId := c.Param("bundleid")
	if bundleId == "" {
		c.JSON(http.StatusUnprocessableEntity, GenericResponse{Error: "bundleId is missing"})
		return
	}
	s.logger.Info("launchApp", zap.String("udid", device.Properties.SerialNumber), zap.String("bundleId", bundleId))

	pControl, err := instruments.NewProcessControl(device)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	svc, err := installationproxy.New(device)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	response, err := svc.BrowseAllApps()
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	for _, app := range response {
		if app.CFBundleIdentifier() == bundleId {
			processName = app.CFBundleExecutable()
			break
		}
	}

	if processName == "" {
		c.JSON(http.StatusNotFound, GenericResponse{Message: bundleId + " is not installed"})
		return
	}

	service, err := instruments.NewDeviceInfoService(device)
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}
	defer service.Close()

	processList, err := service.ProcessList()
	if err != nil {
		c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
		return
	}

	for _, p := range processList {
		if p.Name == processName {
			err = pControl.KillProcess(p.Pid)
			if err != nil {
				c.JSON(http.StatusInternalServerError, GenericResponse{Error: err.Error()})
				return
			}
			c.JSON(http.StatusOK, GenericResponse{Message: bundleId + " successfully killed"})
			return
		}
	}

	c.JSON(http.StatusOK, GenericResponse{Message: bundleId + " is not running"})
}

func (s *Server) hInstallApp(c *gin.Context) {
	udid := c.Param("udid")
	pkg_url := c.Query("pkg_url")
	s.logger.Info("installApp", zap.String("udid", udid), zap.String("pkg_url", pkg_url))
	tmpPath := path.Join(".tmp", udid, "apps")
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	var filename string
	var savePath string
	if pkg_url != "" {
		u, err := url.Parse(pkg_url)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		filename = path.Base(u.Path)
		savePath = filepath.Join(tmpPath, filename) // 保存到 uploads
		if !fileExists(savePath) {
			if err = downloadFile(pkg_url, savePath); err != nil {
				s.logger.Error("failed to download file", zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "下载文件失败"})
				return
			}
		}
	} else {
		file, err := c.FormFile("file")
		if err != nil {
			s.logger.Error("failed to get file from form", zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		filename = filepath.Base(file.Filename)
		savePath = filepath.Join(tmpPath, filename) // 保存到 uploads 目录
		if !fileExists(savePath) {
			if err := c.SaveUploadedFile(file, savePath); err != nil {
				s.logger.Error("failed to save uploaded file", zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
				return
			}
		}
	}
	s.logger.Info("installing app",
		zap.String("appPath", savePath),
		zap.String("device", device.Properties.SerialNumber))
	if err := _installApp(device, savePath); err != nil {
		s.logger.Error("failed to install app", zap.Error(err))

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed installing app",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "installed " + filename + " to device " + udid,
	})
}

func (s *Server) _uninstallApp(device ios.DeviceEntry, bundleId string) error {
	s.logger.Info("uninstalling",
		zap.String("appPath", bundleId),
		zap.String("device", device.Properties.SerialNumber))
	svc, err := installationproxy.New(device)
	if err != nil {
		s.logger.Error("failed connecting to installationproxy", zap.Error(err))
		return err
	}
	if err = svc.Uninstall(bundleId); err != nil {
		s.logger.Error("failed uninstalling", zap.Error(err))
		return err
	}
	return nil
}

func _installApp(device ios.DeviceEntry, path string) error {
	conn, err := zipconduit.New(device)
	if err != nil {
		return fmt.Errorf("failed connecting to zipconduit, dev image installed?: %w", err)
	}
	if err = conn.SendFile(path); err != nil {
		return fmt.Errorf("failed writing: %w", err)
	}
	return nil
}

type progressWriter struct {
	filename string // 文件名
	total    int64  // 总大小
	written  int64  // 已写入
}

func (pw *progressWriter) Write(p []byte) (int, error) {
	n := len(p)
	pw.written += int64(n)
	fmt.Printf("\r%s下载进度: %.2f%%", pw.filename, float64(pw.written)*100/float64(pw.total))
	return n, nil
}

func downloadFile(pkgURL string, dstPath string) error {
	os.MkdirAll(filepath.Dir(dstPath), os.ModePerm)
	resp, err := http.Get(pkgURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	out, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer out.Close()

	pw := &progressWriter{
		filename: filepath.Base(dstPath),
		total:    resp.ContentLength,
	}
	// TeeReader 会将读取到的数据同时写入 pw
	reader := io.TeeReader(resp.Body, pw)
	_, err = io.Copy(out, reader)
	fmt.Println("\n下载完成")
	return err
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil || os.IsExist(err)
}

func (s *Server) hListProcess(c *gin.Context) {
	device := c.MustGet(IOS_KEY).(ios.DeviceEntry)
	service, err := instruments.NewDeviceInfoService(device)
	if err != nil {
		s.logger.Error("failed opening deviceInfoService for getting process list")
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed opening deviceInfoService",
		})
		return
	}
	defer service.Close()
	processList, err := service.ProcessList()
	if err != nil {
		s.logger.Error("failed getting process list")
		c.JSON(http.StatusInternalServerError, GenericResponse{
			Error: "failed getting process list",
		})
	}
	c.JSON(http.StatusOK, processList)
}

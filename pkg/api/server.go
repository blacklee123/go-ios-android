package api

import (
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/blacklee123/go-ios-android/pkg/web"
	"github.com/danielpaulus/go-ios/ios"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Config struct {
	Host   string `mapstructure:"host"`
	Port   string `mapstructure:"port"`
	TmpDir string `mapstructure:"tmpdir"`
}

type Server struct {
	router   *gin.Engine
	logger   *zap.Logger
	config   *Config
	forwards map[string]map[int]int
	devices  map[string]ios.DeviceEntry
}

func NewServer(config *Config, logger *zap.Logger) (*Server, error) {
	logger.Info("confg", zap.String("confg", fmt.Sprintf("%v", config)))
	config.TmpDir = path.Join(config.TmpDir, ".tmp")
	os.MkdirAll(config.TmpDir, os.ModePerm)
	srv := &Server{
		router:   gin.Default(),
		logger:   logger,
		config:   config,
		forwards: make(map[string]map[int]int),
		devices:  make(map[string]ios.DeviceEntry),
	}
	return srv, nil
}

func (s *Server) registerHandlers() {
	distFS, err := fs.Sub(web.StaticFS, "dist")
	if err != nil {
		log.Fatal("failed to create sub filesystem from embed.FS: ", err)
	}
	subFs := http.FS(distFS)
	s.router.GET("/", func(c *gin.Context) {
		c.FileFromFS("", subFs)
	})

	s.router.GET("/assets/*filepath", func(c *gin.Context) {
		c.FileFromFS(c.Request.URL.Path, subFs)
	})

	api := s.router.Group("/api")
	api.GET("/ios", s.hListIOS)
	iosDevice := api.Group("/ios/:udid")
	iosDevice.Use(s.DeviceMiddleware())
	iosDevice.GET("", s.hRetrieveIOS)
	iosDevice.GET("/apps", s.hListApp)
	iosDevice.POST("/apps", s.hInstallApp)
	iosDevice.GET("/screenshot", s.hScreenshot)
	iosDevice.GET("fsync/list/*filepath", s.hListFiles)
	iosDevice.GET("fsync/pull/*filepath", s.hPullFile)

	iosApp := iosDevice.Group("/apps/:bundleid")
	iosApp.POST("/launch", s.hLaunchApp)
	iosApp.POST("/kill", s.hKillApp)
	iosApp.POST("/uninstall", s.hUninstallApp)
	iosApp.GET("/fsync/list/*filepath", s.hListFiles)
	iosApp.GET("/fsync/pull/*filepath", s.hPullFile)

}

func (s *Server) registerMiddlewares() {
	// s.router.Use(jwtMiddleware())
}

func (s *Server) ListenAndServe() *http.Server {
	s.registerMiddlewares()
	s.registerHandlers()
	srv := s.startServer()
	err := s.StartIosTunnel()
	if err != nil {
		s.logger.Fatal("iOS tunnel is not running, please use `sudo go-ios-android tunnel start` to start")
	}
	go s.StartIosListening()
	return srv
}

func (s *Server) startServer() *http.Server {
	// determine if the port is specified
	if s.config.Port == "0" {

		// move on immediately
		return nil
	}
	srv := &http.Server{
		Addr:         s.config.Host + ":" + s.config.Port,
		WriteTimeout: 30 * time.Minute,
		ReadTimeout:  30 * time.Minute,
		IdleTimeout:  2 * 30 * time.Second,
		Handler:      s.router,
	}

	// start the server in the background
	go func() {
		log.Printf("Starting HTTP Server. addr: %s", srv.Addr)
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatal("HTTP server crashed", err)
		}
	}()

	// return the server and routine
	return srv
}

func (s *Server) Clean() {
	os.RemoveAll(s.config.TmpDir)
}

package cmd

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/blacklee123/go-ios-android/pkg/api"
	"github.com/blacklee123/go-ios-android/pkg/version"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// serverCmd represents the serve command
var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "A brief description of your command",
	Long: `A longer description that spans multiple lines and likely contains examples
and usage of using your command. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.`,
	Run: func(cmd *cobra.Command, args []string) {
		// 获取命令行标志
		host, _ := cmd.Flags().GetString("host")
		port, _ := cmd.Flags().GetInt("port")
		tmpdir, _ := cmd.Flags().GetString("tmpdir")
		level, _ := cmd.Flags().GetString("level")

		// 配置 Viper
		viper.Set("host", host)
		viper.Set("port", port)
		viper.Set("tmpdir", tmpdir)
		viper.Set("level", level)
		hostname, _ := os.Hostname()
		viper.Set("hostname", hostname)
		viper.Set("version", version.VERSION)
		viper.Set("revision", version.REVISION)
		viper.AutomaticEnv()

		// 初始化日志
		logger, _ := initZap(viper.GetString("level"))
		defer logger.Sync()
		stdLog := zap.RedirectStdLog(logger)
		defer stdLog()

		// 解析配置
		var srvCfg api.Config
		if err := viper.Unmarshal(&srvCfg); err != nil {
			logger.Panic("config unmarshal failed", zap.Error(err))
		}

		// 创建并启动服务器
		srv, _ := api.NewServer(&srvCfg, logger)
		httpServer := srv.ListenAndServe()

		// 设置信号捕获
		ctx := context.Background()
		sc := make(chan os.Signal, 1)
		signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
		<-sc
		logger.Info("shutting down server",
			zap.String("version", version.VERSION),
			zap.String("revision", version.REVISION))

		// 关闭服务器
		httpServer.Shutdown(ctx)
	},
}

func init() {
	rootCmd.AddCommand(serverCmd)

	serverCmd.Flags().String("host", "0.0.0.0", "Host to bind service to")
	serverCmd.Flags().Int("port", 15037, "HTTP port to bind service to")
	serverCmd.Flags().String("tmpdir", ".", "Temporary directory to use")
	serverCmd.Flags().String("level", "info", "Log level (debug, info, warn, error)")
}

func initZap(logLevel string) (*zap.Logger, error) {
	level := zap.NewAtomicLevelAt(zapcore.InfoLevel)
	switch logLevel {
	case "debug":
		level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
	case "info":
		level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	case "warn":
		level = zap.NewAtomicLevelAt(zapcore.WarnLevel)
	case "error":
		level = zap.NewAtomicLevelAt(zapcore.ErrorLevel)
	case "fatal":
		level = zap.NewAtomicLevelAt(zapcore.FatalLevel)
	case "panic":
		level = zap.NewAtomicLevelAt(zapcore.PanicLevel)
	}

	zapEncoderConfig := zapcore.EncoderConfig{
		TimeKey:        "ts",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	zapConfig := zap.Config{
		Level:       level,
		Development: false,
		Sampling: &zap.SamplingConfig{
			Initial:    100,
			Thereafter: 100,
		},
		Encoding:         "json",
		EncoderConfig:    zapEncoderConfig,
		OutputPaths:      []string{"stderr"},
		ErrorOutputPaths: []string{"stderr"},
	}

	return zapConfig.Build()
}

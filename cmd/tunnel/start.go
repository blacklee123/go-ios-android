package tunnel

import (
	"context"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/tunnel"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Starts the tunnel service",
	Run: func(cmd *cobra.Command, args []string) {
		useUserspaceNetworking, _ := cmd.Flags().GetBool("userspace")
		pairRecordsPath, _ := cmd.Flags().GetString("pair-record-path")
		tunnelInfoPort, _ := cmd.Flags().GetInt("tunnel-info-port")
		if !useUserspaceNetworking {
			err := ios.CheckRoot()
			if err != nil {
				exitIfError("If --userspace is not set, we need sudo or an admin shell on Windows", err)
			}
		} else {
			log.Info("Using userspace networking")
		}
		if strings.ToLower(pairRecordsPath) == "default" {
			pairRecordsPath = "/var/db/lockdown/RemotePairing/user_501"
		}
		// 使用可取消的上下文
		ctx, cancel := context.WithCancel(cmd.Context())
		defer cancel()

		startTunnel(ctx, pairRecordsPath, tunnelInfoPort, useUserspaceNetworking)
	},
}

func initTunnelStart() {
	tunnelCmd.AddCommand(startCmd)
	startCmd.Flags().Bool("userspace", false, "Use userspace networking")
	startCmd.Flags().String("pair-record-path", ".", "Path to pair records")
	startCmd.Flags().Int("tunnel-info-port", ios.HttpApiPort(), "Port for tunnel info server")
}

func startTunnel(ctx context.Context, recordsPath string, tunnelInfoPort int, userspaceTUN bool) {
	pm, err := tunnel.NewPairRecordManager(recordsPath)
	exitIfError("could not create pair record manager", err)
	tm := tunnel.NewTunnelManager(pm, userspaceTUN)

	// 创建可取消的子上下文
	tunnelCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	// 监听中断信号
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(sigCh)

	// 启动隧道更新
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-tunnelCtx.Done():
				return
			case <-ticker.C:
				err := tm.UpdateTunnels(tunnelCtx)
				if err != nil {
					log.WithError(err).Warn("failed to update tunnels")
				}
			}
		}
	}()

	// 启动隧道信息服务器
	serverErr := make(chan error, 1)
	go func() {
		err := tunnel.ServeTunnelInfo(tm, tunnelInfoPort)
		if err != nil {
			serverErr <- err
		}
	}()
	log.Info("Tunnel server started at http://127.0.0.1:", tunnelInfoPort)

	// 等待中断信号或服务器错误
	select {
	case <-tunnelCtx.Done():
		log.Info("Shutting down due to context cancellation")
	case sig := <-sigCh:
		log.Infof("Shutting down due to signal: %s", sig)
	case err := <-serverErr:
		exitIfError("tunnel server failed", err)
	}
}

func exitIfError(msg string, err error) {
	if err != nil {
		log.WithFields(log.Fields{"err": err}).Fatalf(msg)
	}
}

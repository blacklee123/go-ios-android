package tunnel

import (
	"context"
	"strings"
	"time"

	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/tunnel"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "A brief description of your command",
	Long: `A longer description that spans multiple lines and likely contains examples
and usage of using your command. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.`,
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
		startTunnel(context.TODO(), pairRecordsPath, tunnelInfoPort, useUserspaceNetworking)

	},
}

func initTunnelStart() {
	tunnelCmd.AddCommand(startCmd)
	startCmd.Flags().Bool("userspace", false, "userspace")
	startCmd.Flags().String("pair-record-path", ".", "pair-record-path")
	startCmd.Flags().Int("tunnel-info-port", ios.HttpApiPort(), "tunnel-info-port")
}

func startTunnel(ctx context.Context, recordsPath string, tunnelInfoPort int, userspaceTUN bool) {
	pm, err := tunnel.NewPairRecordManager(recordsPath)
	exitIfError("could not creat pair record manager", err)
	tm := tunnel.NewTunnelManager(pm, userspaceTUN)

	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				err := tm.UpdateTunnels(ctx)
				if err != nil {
					log.WithError(err).Warn("failed to update tunnels")
				}
			}
		}
	}()

	go func() {
		err := tunnel.ServeTunnelInfo(tm, tunnelInfoPort)
		if err != nil {
			exitIfError("failed to start tunnel server", err)
		}
	}()
	log.Info("Tunnel server started at http://127.0.0.1:", tunnelInfoPort)
	<-ctx.Done()
}

func exitIfError(msg string, err error) {
	if err != nil {
		log.WithFields(log.Fields{"err": err}).Fatalf(msg)
	}
}

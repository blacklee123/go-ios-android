package tunnel

import "github.com/spf13/cobra"

var tunnelCmd *cobra.Command

func InitTunnel(cmd *cobra.Command) {
	tunnelCmd = cmd

	initTunnelStart()
}

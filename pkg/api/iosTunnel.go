package api

import (
	"errors"

	"github.com/danielpaulus/go-ios/ios/tunnel"
)

func (s *Server) StartIosTunnel() error {
	if tunnel.IsAgentRunning() {
		s.logger.Info("iOS tunnel is already running")
		return nil
	}
	return errors.New("iOS tunnel is not running")
}

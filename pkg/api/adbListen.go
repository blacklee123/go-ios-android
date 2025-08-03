package api

import (
	"time"

	"github.com/blacklee123/go-adb/adb"
	"go.uber.org/zap"
)

func (s *Server) StartAdbListening() {
	for {
		client, err := adb.NewClient()
		if err != nil {
			s.logger.Error("could not connect to adb server, will retry in 3 seconds...",
				zap.Error(err))
			time.Sleep(time.Second * 3)
			continue
		}
		events, _, err := client.TrackDevices()
		if err != nil {
			s.logger.Error("could not trick adb devices, will retry in 3 seconds...",
				zap.Error(err))
			time.Sleep(time.Second * 3)
			continue
		}

		for event := range events {
			if event.Present {
				s.logger.Info("设备连接", zap.String("serial", event.Serial), zap.String("status", event.Status))
				switch event.Status {
				case "device":
					device, err := client.GetDevice(event.Serial)
					if err != nil {
						s.logger.Error("failed to get device", zap.Error(err))
						continue
					}
					s.androidDevice[event.Serial] = device
				}

			} else {
				s.logger.Info("设备断开", zap.String("serial", event.Serial), zap.String("status", event.Status))
				delete(s.androidDevice, event.Serial)
			}
		}
	}
}

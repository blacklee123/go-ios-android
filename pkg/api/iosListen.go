package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/forward"
	"github.com/danielpaulus/go-ios/ios/testmanagerd"
	"go.uber.org/zap"
)

var (
	JSONdisabled = false
	prettyJSON   = false
)

func (s *Server) StartIosListening() {
	for {
		deviceConn, err := ios.NewDeviceConnection(ios.GetUsbmuxdSocket())
		if err != nil {
			s.logger.Error("could not connect to usbmuxd, will retry in 3 seconds...",
				zap.String("socket", ios.GetUsbmuxdSocket()),
				zap.Error(err))
			time.Sleep(time.Second * 3)
			continue
		}
		defer deviceConn.Close()
		muxConnection := ios.NewUsbMuxConnection(deviceConn)

		attachedReceiver, err := muxConnection.Listen()
		if err != nil {
			s.logger.Error("Failed issuing Listen command, will retry in 3 seconds", zap.Error(err))
			deviceConn.Close()
			time.Sleep(time.Second * 3)
			continue
		}
		for {
			msg, err := attachedReceiver()
			if err != nil {
				s.logger.Error("Stopped listening because of error", zap.Error(err))
				break
			}
			fmt.Println(convertToJSONString((msg)))
			if msg.MessageType == "Attached" {
				time.Sleep(time.Second * 3)
				device, _ := s.retrieveDevice(msg.Properties.SerialNumber)
				s.iosDevices[msg.Properties.SerialNumber] = device
				go s.runWdaCommand(device)
			} else if msg.MessageType == "Detached" {
				delete(s.iosDevices, msg.Properties.SerialNumber)
			}
		}
	}
}

func convertToJSONString(data interface{}) string {
	b, err := marshalJSON(data)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	return string(b)
}

func marshalJSON(data interface{}) ([]byte, error) {
	if prettyJSON {
		return json.MarshalIndent(data, "", "    ")
	} else {
		return json.Marshal(data)
	}
}

func (s *Server) runWdaCommand(device ios.DeviceEntry) {

	bundleID, testbundleID, xctestconfig := "com.facebook.WebDriverAgentRunner.QAQ.xctrunner", "com.facebook.WebDriverAgentRunner.QAQ.xctrunner", "WebDriverAgentRunner.xctest"
	writer := io.Discard

	errorChannel := make(chan error)
	defer close(errorChannel)
	ctx, stopWda := context.WithCancel(context.Background())
	go func() {
		_, err := testmanagerd.RunTestWithConfig(ctx, testmanagerd.TestConfig{
			BundleId:           bundleID,
			TestRunnerBundleId: testbundleID,
			XctestConfigName:   xctestconfig,
			Env:                make(map[string]interface{}),
			Args:               make([]string, 0),
			Device:             device,
			Listener:           testmanagerd.NewTestListener(writer, writer, os.TempDir()),
		})
		if err != nil {
			errorChannel <- err
		}
		stopWda()
	}()
	targetPort := 8100
	cl, err := s.createForward(device, 0, targetPort)
	if err == nil {
		defer stopForwarding(cl)
	}

	select {
	case err := <-errorChannel:
		s.logger.Error("Failed running WDA", zap.Error(err))
		stopWda()
	case <-ctx.Done():
		s.logger.Error("WDA process ended unexpectedly")
	}
	s.logger.Info("Done Closing")
}

func stopForwarding(cl *forward.ConnListener) {
	err := cl.Close()
	if err != nil {
		zap.L().Sugar().Error(err)
	}
}

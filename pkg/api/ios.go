package api

import (
	"github.com/blacklee123/go-ios-android/pkg/utils"

	"github.com/danielpaulus/go-ios/ios"
	"github.com/danielpaulus/go-ios/ios/forward"
	"github.com/danielpaulus/go-ios/ios/tunnel"
	"go.uber.org/zap"
)

func (s *Server) retrieveDevice(udid string) (ios.DeviceEntry, error) {
	device, err := ios.GetDevice(udid)
	if err != nil {
		s.logger.Error("failed to get device", zap.String("udid", udid), zap.Error(err))
		return ios.DeviceEntry{}, err
	}
	info, err := tunnel.TunnelInfoForDevice(device.Properties.SerialNumber, ios.HttpApiHost(), ios.HttpApiPort())
	if err == nil {
		device.UserspaceTUNPort = info.UserspaceTUNPort
		device.UserspaceTUN = info.UserspaceTUN
		return s.deviceWithRsdProvider(device, device.Properties.SerialNumber, info.Address, info.RsdPort)
	} else {
		s.logger.Warn("failed to get tunnel info", zap.String("udid", device.Properties.SerialNumber))
	}
	return device, nil
}

func (s *Server) deviceWithRsdProvider(device ios.DeviceEntry, udid string, address string, rsdPort int) (ios.DeviceEntry, error) {
	rsdService, err := ios.NewWithAddrPortDevice(address, rsdPort, device)
	if err != nil {
		s.logger.Error("could not connect to RSD", zap.Error(err))
		return device, err // 返回原始设备信息
	}
	defer rsdService.Close()
	rsdProvider, err := rsdService.Handshake()
	if err != nil {
		return device, err
	}
	device1, err := ios.GetDeviceWithAddress(udid, address, rsdProvider)
	if err != nil {
		return device, err
	}

	device1.UserspaceTUN = device.UserspaceTUN
	device1.UserspaceTUNPort = device.UserspaceTUNPort

	return device1, nil
}

func (s *Server) addForward(udid string, hostPort int, targetPort int) {
	if _, exists := s.iosForwards[udid]; !exists {
		s.iosForwards[udid] = make(map[int]int)
	}
	s.iosForwards[udid][targetPort] = hostPort

}

func (s *Server) createForward(device ios.DeviceEntry, hostPort int, phonePort int) (*forward.ConnListener, int, error) {
	// targetPort = 5001
	if hostPort == 0 {
		hostPort = utils.GiveAvialablePortFromSpecifyStart(phonePort)
	}

	cl, err := forward.Forward(device, uint16(hostPort), uint16(phonePort))
	if err != nil {
		s.logger.Error("failed to forward port",
			zap.String("udid", device.Properties.SerialNumber),
			zap.Uint16("hostPort", uint16(hostPort)),
			zap.Uint16("phonePort", uint16(phonePort)), zap.Error(err))
		return nil, hostPort, err
	}
	s.addForward(device.Properties.SerialNumber, hostPort, phonePort)
	return cl, hostPort, nil
}

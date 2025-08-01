package iosvo

type DeviceInfo struct {
	CPUArchitecture string `json:"cpu_architecture"`
	DeviceName      string `json:"device_name"`
	DevicePlatform  string `json:"device_platform"`
	DeviceSerialNo  string `json:"device_serialno"`
	Port            int    `json:"port"`
	RelayOK         bool   `json:"relay_ok"`
	Version         string `json:"version"`
}

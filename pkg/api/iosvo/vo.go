package iosvo

type DeviceInfo struct {
	CPUArchitecture string `json:"cpu_architecture"`
	DeviceName      string `json:"device_name"`
	DevicePlatform  string `json:"device_platform"`
	DeviceSerialNo  string `json:"device_serialno"`
	WdaPort         int    `json:"wda_port"`
	Version         string `json:"version"`
}

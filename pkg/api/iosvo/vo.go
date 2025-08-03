package iosvo

type DeviceInfo struct {
	CPUArchitecture string `json:"cpu_architecture"`
	DeviceName      string `json:"device_name"`
	DevicePlatform  string `json:"device_platform"`
	DeviceSerialNo  string `json:"device_serialno"`
	WdaPort         int    `json:"wda_port"`
	Version         string `json:"version"`
}

type Device struct {
	Temperature  float64 `json:"temperature"` // 温度可能含小数
	Voltage      float64 `json:"voltage"`     // 电压可能含小数
	Level        int     `json:"level"`
	CPU          string  `json:"cpu"`
	Manufacturer string  `json:"manufacturer"`
	Model        string  `json:"model"`
	Name         string  `json:"name"`
	Platform     string  `json:"platform"`
	IsHm         bool    `json:"isHm"`    // 是否鸿蒙系统
	Size         string  `json:"size"`    // 屏幕尺寸
	UdID         string  `json:"udId"`    // 唯一设备标识
	Version      string  `json:"version"` // 系统版本
}

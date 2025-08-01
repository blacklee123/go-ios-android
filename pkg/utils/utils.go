package utils

import (
	"fmt"
	"net"
)

// 判断端口是否被占用
func isPortInUse(port int, host string) bool {
	address := net.JoinHostPort(host, fmt.Sprintf("%d", port))
	ln, err := net.Listen("tcp", address)
	if err != nil {
		return true
	}
	ln.Close()
	return false
}

// 从指定端口开始，返回第一个可用端口
func GiveAvialablePortFromSpecifyStart(startPort int) int {
	host := "localhost"
	for isPortInUse(startPort, host) {
		startPort++
	}
	return startPort
}

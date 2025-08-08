package utils

import (
	"encoding/json"
	"fmt"
	"math/rand"
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
	startPort += rand.Intn(1000)
	for isPortInUse(startPort, host) {
		startPort += rand.Intn(1000)
	}
	return startPort
}

func MustMarshal(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return string(b)
}

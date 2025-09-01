package poco

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"sync"
	"time"
)

// PocoConnection 定义 Poco 连接接口
type PocoConnection interface {
	Connect()
	Connected() bool
	Disconnect()
	SendAndReceive(jsonObject map[string]interface{}) (string, error)
}

// SocketClientImpl 实现 PocoConnection 接口
type SocketClientImpl struct {
	port        int
	conn        net.Conn
	isConnected bool
	mutex       sync.Mutex
}

// NewSocketClient 创建新的 Socket 客户端
func NewSocketClient(port int) *SocketClientImpl {
	return &SocketClientImpl{
		port: port,
	}
}

// SendAndReceive 发送并接收数据
func (s *SocketClientImpl) SendAndReceive(jsonObject map[string]interface{}) (string, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if !s.isConnected {
		return "", fmt.Errorf("socket is not connected")
	}

	// 将 JSON 对象转换为字节数组
	data, err := json.Marshal(jsonObject)
	if err != nil {
		return "", err
	}

	// 创建头部（4字节长度）
	header := make([]byte, 4)
	binary.LittleEndian.PutUint32(header, uint32(len(data)))

	// 发送数据
	_, err = s.conn.Write(header)
	if err != nil {
		return "", err
	}
	_, err = s.conn.Write(data)
	if err != nil {
		return "", err
	}

	// 读取响应头部
	head := make([]byte, 4)
	_, err = io.ReadFull(s.conn, head)
	if err != nil {
		return "", err
	}

	// 解析响应长度
	headLen := binary.LittleEndian.Uint32(head)

	// 读取响应数据
	rData := make([]byte, headLen)
	_, err = io.ReadFull(s.conn, rData)
	if err != nil {
		return "", err
	}

	// 处理响应
	pocoResult := string(rData)
	subStartIndex := bytes.Index(rData, []byte(`"result"`))
	if subStartIndex == -1 {
		return "", fmt.Errorf("result field not found in response")
	}

	return "{" + pocoResult[subStartIndex:], nil
}

// Connect 连接到 Poco 服务器
func (s *SocketClientImpl) Connect() {
	maxAttempts := 20
	attempt := 0

	for attempt < maxAttempts {
		conn, err := net.Dial("tcp", fmt.Sprintf("localhost:%d", s.port))
		if err == nil {
			s.conn = conn
			s.isConnected = true
			// s.logger.Info("poco socket connected.")
			return
		}

		// s.logger.Info(fmt.Sprintf("Connection attempt %d failed: %v", attempt+1, err))
		time.Sleep(500 * time.Millisecond)
		attempt++
	}

	// s.logger.Info("poco socket connection failed after multiple attempts.")
}

func (s *SocketClientImpl) Connected() bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	return s.isConnected
}

// Disconnect 断开连接
func (s *SocketClientImpl) Disconnect() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.conn != nil {
		s.conn.Close()
		// s.logger.Info("poco socket closed.")
		s.isConnected = false
	}
}

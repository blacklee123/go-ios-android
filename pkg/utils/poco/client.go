package poco

import "github.com/google/uuid"

type PocoClient struct {
	conn PocoConnection
	port int
}

func NewPocoClient(port int) *PocoClient {
	return &PocoClient{
		conn: NewSocketClient(port),
		port: port,
	}
}

func (p *PocoClient) Dump() (string, error) {
	if !p.conn.Connected() {
		p.conn.Connect()
	}
	jsonObject := map[string]interface{}{
		"jsonrpc": "2.0",
		"params":  []interface{}{true},
		"id":      uuid.New().String(),
		"method":  "Dump",
	}
	return p.conn.SendAndReceive(jsonObject)
}

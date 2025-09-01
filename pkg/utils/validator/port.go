package validator

import "strconv"

func Port(portStr string) (int, error) {
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return 0, err
	}
	if port < 0 || port > 65535 {
		return 0, &strconv.NumError{Func: "Atoi", Num: portStr, Err: strconv.ErrRange}
	}
	return port, nil
}

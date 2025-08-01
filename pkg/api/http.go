package api

type GenericResponse struct {
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

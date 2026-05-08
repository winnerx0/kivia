package log

import "time"

type createLogRequest struct {
	Path string `json:"path" validate:"required"`

	Status int `json:"status" validate:"required"`

	IPAddress string `json:"ip_address,omitempty"`

	Timestamp time.Time `json:"timestamp" validate:"required"`

	Latency *int `json:"latency" validate:"required"`
}

type PaginatedLogResponse struct {
	Logs []LogResponse `json:"logs"`

	Page int `json:"page"`

	Items int `json:"items"`

	TotelItems int `json:"total_items"`
}

type LogResponse struct {
	Id        string    `json:"id"`
	Path      string    `json:"path"`
	Latency   string    `json:"latency"`
	Status    int       `json:"status"`
	IPAddress string    `json:"ip_address,omitempty"`
	Timestamp time.Time `json:"timestamp"`
	ApiKey    string    `json:"api_key"`
}

type LogChart struct {
	Date time.Time `json:"date"`
	Logs []LogBar  `json:"logs"`
}

type LogBar struct {
	Status int `json:"status"`
	Count  int `json:"count"`
}

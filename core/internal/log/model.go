package log

import "time"

type Log struct {
	
	Id string `json:"id"`
	
	Path string `json:"path"`
	
	Latency int `json:"latency"`
	
	Status int `json:"status"`
	
	Location string `json:"location,omitempty"`

	Timestamp time.Time `json:"timestamp"`
	
	ApiKey string `json:"api_key"`
	
}
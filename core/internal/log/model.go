package log

import "time"

type Log struct {
	
	Id string `json:"id"`
	
	Path string `json:"path"`
	
	Status int `json:"status"`
	
	Location string `json:"location,omitempty"`

	Timestamp time.Time `json:"timestamp"`
	
	Latency string `json:"latency"`
	
	ApiKey string `json:"api_key"`
	
}
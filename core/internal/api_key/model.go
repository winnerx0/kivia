package apikey

import "time"

type ApiKey struct {
	Id string `json:"id"`

	Name string `json:"name"`

	Key string `json:"key"`

	UserId string `json:"user_id,omitempty"`

	ProjectId string `json:"project_id"`

	Revoked bool `json:"revoked"`

	DeletedAt *time.Time `json:"deleted_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
}

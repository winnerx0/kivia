package apikey

type ApiKeyRepository interface {
	Save(apiKey ApiKey) error
	FindByProjectId(projectId string) (ApiKey, error)
	FindById(id string) (ApiKey, error)
	FindAllByUserIdAndProjectId(userId string, projectId string) ([]ApiKey, error)
	RevokeApiKey(id string) error
	DeleteApiKey(id string) error
	FindProjectIdByKey(apiKey string) (string, error)
	FindIdById(key string) (string, error)
}

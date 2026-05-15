package mocks

import (
	"github.com/stretchr/testify/mock"
	apikey "github.com/winnerx0/kivia/internal/api_key"
)

type MockApiKeyRepository struct {
	mock.Mock
}

func (m *MockApiKeyRepository) Save(apiKey apikey.ApiKey) error {
	args := m.Called(apiKey)

	return args.Error(0)
}

func (m *MockApiKeyRepository) FindById(id string) (apikey.ApiKey, error) {
	args := m.Called(id)

	return args.Get(0).(apikey.ApiKey), args.Error(1)
}

func (m *MockApiKeyRepository) FindByProjectId(projectId string) (apikey.ApiKey, error) {
	args := m.Called(projectId)
	return args.Get(0).(apikey.ApiKey), args.Error(1)
}

func (m *MockApiKeyRepository) FindAllByUserIdAndProjectId(userId string, projectId string) ([]apikey.ApiKey, error) {
	args := m.Called(userId, projectId)
	return args.Get(0).([]apikey.ApiKey), args.Error(1)
}

func (m *MockApiKeyRepository) RevokeApiKey(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockApiKeyRepository) DeleteApiKey(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockApiKeyRepository) FindProjectIdByKey(apiKey string) (string, error) {
	args := m.Called(apiKey)
	return args.String(0), args.Error(1)
}

func (m *MockApiKeyRepository) FindIdById(key string) (string, error) {
	args := m.Called(key)
	return args.String(0), args.Error(1)
}

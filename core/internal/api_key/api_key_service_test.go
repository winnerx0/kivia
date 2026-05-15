package apikey_test

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	apikey "github.com/winnerx0/kivia/internal/api_key"
	apikeymocks "github.com/winnerx0/kivia/internal/api_key/mocks"
	projectmocks "github.com/winnerx0/kivia/internal/project/mocks"
	"github.com/winnerx0/kivia/internal/utils"
)

func TestCreateApiKey_Success(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	projectRepo.On("ExistsById", mock.Anything).Return(true, nil)

	repo.On("Save", mock.Anything).Return(nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	key := &apikey.ApiKey{
		Id:   uuid.NewString(),
		Name: "test",
	}

	response, err := service.CreateApiKey(key)

	assert.NoError(t, err)
	assert.Equal(t, "API key created successfully", response.Message)
	assert.NotEmpty(t, response.ApiKey)
	repo.AssertExpectations(t)
}

func TestCreateApiKey_DuplicateName_ReturnsError(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	projectRepo.On("ExistsById", mock.Anything).Return(true, nil)

	repo.On("Save", mock.Anything).Return(utils.ErrDuplicateKey)

	service := apikey.NewApiKeyService(repo, projectRepo)

	key := &apikey.ApiKey{
		Id:   uuid.NewString(),
		Name: "test",
	}

	response, err := service.CreateApiKey(key)

	assert.Error(t, err)
	assert.Empty(t, response)
	assert.ErrorIs(t, err, utils.ErrDuplicateKey)
	repo.AssertExpectations(t)
}

func TestCreateApiKey_ProjectNotFound_ReturnsError(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	projectRepo.On("ExistsById", mock.Anything).Return(false, nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	key := &apikey.ApiKey{
		Id:   uuid.NewString(),
		Name: "test",
	}

	response, err := service.CreateApiKey(key)

	assert.Error(t, err)
	assert.Empty(t, response)
	assert.ErrorIs(t, err, utils.ErrProjectNotFound)
	repo.AssertNotCalled(t, "Save")
	repo.AssertExpectations(t)
}

func TestCreateApiKey_DBError_ReturnsError(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	projectRepo.On("ExistsById", mock.Anything).Return(true, nil)

	repo.On("Save", mock.Anything).Return(errors.New("DB Failure"))

	service := apikey.NewApiKeyService(repo, projectRepo)

	key := &apikey.ApiKey{
		Id:   uuid.NewString(),
		Name: "test",
	}

	response, err := service.CreateApiKey(key)

	assert.Error(t, err)
	assert.Empty(t, response)
	repo.AssertExpectations(t)
}

func TestGetApiKeyByProject_Success(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	projectRepo.On("ExistsById", "project-123").Return(true, nil)

	repo.On("FindAllByUserIdAndProjectId", "user-123", "project-123").Return([]apikey.ApiKey{
		{
			Id:   uuid.NewString(),
			Name: "test",
		},
	}, nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	apiKeys, err := service.GetAllApiKeysByProject("user-123", "project-123")

	assert.NoError(t, err)
	assert.NotZero(t, len(apiKeys))
	repo.AssertExpectations(t)
	projectRepo.AssertExpectations(t)
}

func TestGetApiKeyByProject_Fail_ErrSomethingWentWrong(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	projectRepo.On("ExistsById", "project-123").Return(false, errors.New("DB error"))

	service := apikey.NewApiKeyService(repo, projectRepo)

	apiKeys, err := service.GetAllApiKeysByProject("user-123", "project-123")

	assert.ErrorIs(t, err, utils.ErrSomethingWentWrong, "Something went wrong")
	assert.Zero(t, len(apiKeys))
	repo.AssertExpectations(t)
}

func TestGetApiKeyByProject_Fail_ErrProjectNotFound(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	projectRepo.On("ExistsById", "project-123").Return(false, nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	apiKeys, err := service.GetAllApiKeysByProject("user-123", "project-123")

	assert.ErrorIs(t, err, utils.ErrProjectNotFound, "Project not found")
	assert.Zero(t, len(apiKeys))
	repo.AssertExpectations(t)
}

func TestRevokeApiKey_Success(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{Id: "api-key-123", Revoked: false, UserId: "user-123"}, nil)

	repo.On("RevokeApiKey", "api-key-123").Return(nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.RevokeApiKey("api-key-123", "user-123")

	assert.NoError(t, err)
	repo.AssertExpectations(t)
}

func TestRevokeApiKey_Fail_ErrSomethingWentWrong(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{}, utils.ErrSomethingWentWrong)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.RevokeApiKey("api-key-123", "user-123")

	assert.ErrorIs(t, err, utils.ErrSomethingWentWrong, "Something went wrong")
	repo.AssertExpectations(t)
}

func TestRevokeApiKey_Fail_ErrApiKeyNotFound(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{}, pgx.ErrNoRows)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.RevokeApiKey("api-key-123", "user-123")

	assert.ErrorIs(t, err, utils.ErrApiKeyNotFound, "Api key not found")
	repo.AssertExpectations(t)
}

func TestRevokeApiKey_Fail_ErrUnauthorized(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{Id: "api-key-123", UserId: "user-123"}, nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.RevokeApiKey("api-key-123", "user-456")

	assert.ErrorIs(t, err, utils.ErrUnauthorized, "Unauthorized")
	repo.AssertExpectations(t)
}

func TestRevokeApiKey_Fail_ErrInvalidRovoke(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{Id: "api-key-123", UserId: "user-123", Revoked: true}, nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.RevokeApiKey("api-key-123", "user-123")

	assert.ErrorIs(t, err, utils.ErrInvalidRovoke, "API key already revoked")
	repo.AssertExpectations(t)
}

func TestDeleteApiKey_Success(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{Id: "api-key-123", UserId: "user-123"}, nil)
	repo.On("DeleteApiKey", "api-key-123").Return(nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.DeleteApiKey("api-key-123", "user-123")

	assert.NoError(t, err)
	repo.AssertExpectations(t)
}

func TestDeleteApiKey_Fail_ErrSomethingWentWrong(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{}, utils.ErrSomethingWentWrong)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.DeleteApiKey("api-key-123", "user-123")

	assert.ErrorIs(t, err, utils.ErrSomethingWentWrong, "Something went wrong")
	repo.AssertExpectations(t)
}

func TestDeleteApiKey_Fail_ErrApiKeyNotFound(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{}, pgx.ErrNoRows)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.DeleteApiKey("api-key-123", "user-123")

	assert.ErrorIs(t, err, utils.ErrApiKeyNotFound, "Api key not found")
	repo.AssertExpectations(t)
}

func TestDeleteApiKey_Fail_ErrUnauthorized(t *testing.T) {
	repo := new(apikeymocks.MockApiKeyRepository)
	projectRepo := new(projectmocks.MockProjectRepository)

	repo.On("FindById", "api-key-123").Return(apikey.ApiKey{Id: "api-key-123", UserId: "user-123"}, nil)

	service := apikey.NewApiKeyService(repo, projectRepo)

	err := service.DeleteApiKey("api-key-123", "user-456")

	assert.ErrorIs(t, err, utils.ErrUnauthorized, "Unauthorized")
	repo.AssertExpectations(t)
}

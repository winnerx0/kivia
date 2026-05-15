package apikey

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/winnerx0/kivia/internal/project"
	"github.com/winnerx0/kivia/internal/utils"
)

type apiKeyService struct {
	repo        ApiKeyRepository
	projectRepo project.ProjectRepository
}

func NewApiKeyService(repo ApiKeyRepository, projectRepo project.ProjectRepository) *apiKeyService {
	return &apiKeyService{
		repo:        repo,
		projectRepo: projectRepo,
	}
}

func (s apiKeyService) CreateApiKey(apiKey *ApiKey) (createApiKeyResponse, error) {

	projectExists, err := s.projectRepo.ExistsById(apiKey.ProjectId)

	if err != nil {
		return createApiKeyResponse{}, err
	}

	if !projectExists {
		return createApiKeyResponse{}, utils.ErrProjectNotFound
	}

	key, err := generateAPIKey()

	if err != nil {
		return createApiKeyResponse{}, err
	}

	hash := sha256.Sum256([]byte(key))

	apiKey.Key = hex.EncodeToString(hash[:])

	err = s.repo.Save(*apiKey)

	if err != nil {
		return createApiKeyResponse{}, err
	}

	return createApiKeyResponse{
		Message: "API key created successfully",
		ApiKey:  key,
	}, nil
}

func (s apiKeyService) GetAllApiKeysByProject(userId string, projectId string) ([]ApiKey, error) {

	projectExists, err := s.projectRepo.ExistsById(projectId)

	if err != nil {

		log.Println("Error: Error find project using id", err.Error())
		return nil, utils.ErrSomethingWentWrong
	}

	if !projectExists {
		return nil, utils.ErrProjectNotFound
	}

	return s.repo.FindAllByUserIdAndProjectId(userId, projectId)
}

func (s apiKeyService) RevokeApiKey(apiKeyId string, userId string) error {
	apiKey, err := s.repo.FindById(apiKeyId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return utils.ErrApiKeyNotFound
		}
		return err
	}

	if apiKey.UserId != userId {
		return utils.ErrUnauthorized
	}

	if apiKey.DeletedAt != nil {
		return utils.ErrApiKeyNotFound
	}

	if apiKey.Revoked {
		return utils.ErrInvalidRovoke
	}

	return s.repo.RevokeApiKey(apiKeyId)
}

func (s apiKeyService) DeleteApiKey(apiKeyId string, userId string) error {
	apiKey, err := s.repo.FindById(apiKeyId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return utils.ErrApiKeyNotFound
		}
		return err
	}

	if apiKey.UserId != userId {
		return utils.ErrUnauthorized
	}

	if apiKey.DeletedAt != nil {
		return utils.ErrApiKeyNotFound
	}

	return s.repo.DeleteApiKey(apiKeyId)
}

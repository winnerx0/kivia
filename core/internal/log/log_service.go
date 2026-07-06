package log

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	apikey "github.com/winnerx0/kivia/internal/api_key"
	"github.com/winnerx0/kivia/internal/project"
	"github.com/winnerx0/kivia/internal/sse"
	"github.com/winnerx0/kivia/internal/utils"
)

type Logservice struct {
	repo        *Repository
	apiKeyRepo  *apikey.Repository
	projectRepo *project.Repository
	eventServer *sse.EventServer
}

func NewLogService(repo *Repository, apiKeyRepo *apikey.Repository, projectRepo *project.Repository, eventServer *sse.EventServer) *Logservice {
	return &Logservice{
		repo:        repo,
		apiKeyRepo:  apiKeyRepo,
		projectRepo: projectRepo,
		eventServer: eventServer,
	}
}

func (s Logservice) CreateLog(createLogRequest createLogRequest, apiKey string) error {

	apiKeyHash := sha256.Sum256([]byte(apiKey))

	apiKeyHex := hex.EncodeToString(apiKeyHash[:])

	apiKeyId, revoked, err := s.apiKeyRepo.FindIdByKey(apiKeyHex)

	if err != nil {
		return err
	}

	if revoked {
		return utils.ErrInvalidApiKey
	}

	projectId, err := s.apiKeyRepo.FindProjectIdByKey(apiKeyHex)

	if err != nil {
		return err
	}

	latency := fmt.Sprintf("%d ms", *createLogRequest.Latency)

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/%s", "http://ip-api.com/json", createLogRequest.IPAddress), nil)

	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	type Location struct {
		Country string `json:"country"`
		City    string `json:"city"`
	}

	var location Location

	if err := json.NewDecoder(resp.Body).Decode(&location); err != nil {
		return err
	}

	log := Log{
		Id:        uuid.New().String(),
		Path:      createLogRequest.Path,
		Location:  location.City + ", " + location.Country,
		Status:    createLogRequest.Status,
		Timestamp: createLogRequest.Timestamp,
		Latency:   latency,
		ApiKey:    apiKeyId,
	}

	logBytes, err := json.Marshal(log)

	if err != nil {
		return err
	}

	s.eventServer.BroadcastToProject(projectId, logBytes)

	return s.repo.Save(log)
}

func (s Logservice) GetLogsByProjectId(projectId string, startDate *string, endDate *string, statusCode *string, apiKeyType *string, page string, limit string) (PaginatedLogResponse, error) {

	p, err := strconv.Atoi(page)

	if err != nil {
		return PaginatedLogResponse{}, err
	}

	l, err := strconv.Atoi(limit)

	if err != nil {
		return PaginatedLogResponse{}, err
	}

	var statusCodePtr *int
	if statusCode != nil {
		sc, err := strconv.Atoi(*statusCode)
		if err != nil {
			return PaginatedLogResponse{}, err
		}
		statusCodePtr = &sc
	}

	logs, err := s.repo.GetLogsByProjectId(projectId, startDate, endDate, statusCodePtr, apiKeyType, p-1, l)

	total := s.repo.GetLogCountByProjectId(projectId)

	return PaginatedLogResponse{
		Logs:       logs,
		Page:       p,
		Items:      len(logs),
		TotelItems: total,
	}, nil
}

func (s Logservice) GetLogsForChart(projectId string, startDate *string, endDate *string) ([]LogChart, error) {

	projectExists, err := s.projectRepo.ExistsById(projectId)

	if !projectExists {
		return []LogChart{}, utils.ErrProjectNotFound
	}

	logs, err := s.repo.GetLogsForChart(projectId, startDate, endDate)

	if err != nil {
		return []LogChart{}, err
	}

	return logs, nil

}

package log

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"strconv"

	logger "log"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
	apikey "github.com/winnerx0/kivia/internal/api_key"
	"github.com/winnerx0/kivia/internal/project"
	"github.com/winnerx0/kivia/internal/rabbitmq"
	"github.com/winnerx0/kivia/internal/sse"
	"github.com/winnerx0/kivia/internal/utils"
)

type Logservice struct {
	repo           *Repository
	apiKeyRepo     *apikey.Repository
	projectRepo    *project.Repository
	rabbitMQClient *rabbitmq.RabbitMQClient
	eventServer    *sse.EventServer
}

func NewLogService(repo *Repository, apiKeyRepo *apikey.Repository, projectRepo *project.Repository, rabbitMQClient *rabbitmq.RabbitMQClient, eventServer *sse.EventServer) *Logservice {
	return &Logservice{
		repo:           repo,
		apiKeyRepo:     apiKeyRepo,
		projectRepo:    projectRepo,
		rabbitMQClient: rabbitMQClient,
		eventServer:    eventServer,
	}
}

func (s Logservice) CreateLog(createLogRequest createLogRequest, apiKey string) error {

	apiKeyHash := sha256.Sum256([]byte(apiKey))

	apiKeyHex := hex.EncodeToString(apiKeyHash[:])

	apiKeyId, err := s.apiKeyRepo.FindIdById(apiKeyHex)

	if err != nil {
		return err
	}

	projectId, err := s.apiKeyRepo.FindProjectIdByKey(apiKeyHex)

	if err != nil {
		return err
	}

	latency := fmt.Sprintf("%d ms", createLogRequest.Latency)

	log := Log{
		Id:        uuid.New().String(),
		Path:      createLogRequest.Path,
		IPAddress: createLogRequest.IPAddress,
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

	err = s.rabbitMQClient.Channel.Publish("", "log_queue", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         logBytes,
	})

	if err != nil {
		return err
	}

	return nil
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

func (s Logservice) LogConsumer(ctx context.Context) error {

	msgs, err := s.rabbitMQClient.ConsumeRabbitMQQueue("log_queue")
	if err != nil {
		return err
	}

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case d, ok := <-msgs:

				log.Println("received log")
				if !ok {
					return
				}

				var log Log
				if err := json.Unmarshal(d.Body, &log); err != nil {
					logger.Println("Invalid log format:", err)
					continue
				}

				if err := s.repo.Save(log); err != nil {
					logger.Println("Failed to save log:", err)
				}
			}
		}
	}()

	return nil

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

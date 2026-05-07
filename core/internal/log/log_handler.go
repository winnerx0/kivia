package log

import (
	"errors"

	"github.com/gofiber/fiber/v3"
	"github.com/winnerx0/kivia/internal/utils"
	"github.com/winnerx0/kivia/internal/validator"
)

type loghandler struct {
	service Logservice
}

func NewLogHandler(service Logservice) *loghandler {
	return &loghandler{
		service: service,
	}
}

func (h loghandler) CreateLog(c fiber.Ctx) error {

	apiKey := c.Get("X-kivia-api-key")

	var createLogRequest createLogRequest

	if err := c.Bind().JSON(&createLogRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	if err := validator.Get().Struct(createLogRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": validator.FirstError(err)})
	}

	if err := h.service.CreateLog(createLogRequest, apiKey); err != nil {

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"message": "Log sent to queue"})
}

func (h loghandler) GetLogsByProjectId(c fiber.Ctx) error {

	projectId := c.Params("projectId")

	var startPtr, endPtr, apiKeyTypePtr, statusCodePtr *string

	statusCode := c.Query("statusCode")
	if statusCode != "" {
		statusCodePtr = &statusCode
	}

	apiKeyType := c.Query("type")

	startDate := c.Query("startDate")

	page := c.Query("page", "1")

	limit := c.Query("limit", "10")

	if startDate != "" {
		startPtr = &startDate
	}

	endDate := c.Query("endDate")

	if endDate != "" {
		endPtr = &endDate
	}

	if apiKeyType != "" {
		apiKeyTypePtr = &apiKeyType
	}

	response, err := h.service.GetLogsByProjectId(projectId, startPtr, endPtr, statusCodePtr, apiKeyTypePtr, page, limit)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(response)
}

func (h loghandler) GetLogsForChart(c fiber.Ctx) error {

	projectId := c.Params("projectId")

	var startPtr *string

	var endPtr *string

	startDate := c.Query("startDate")

	if startDate != "" {
		startPtr = &startDate
	}

	endDate := c.Query("endDate")

	if endDate != "" {
		endPtr = &endDate
	}

	response, err := h.service.GetLogsForChart(projectId, startPtr, endPtr)

	if err != nil {
		if errors.Is(err, utils.ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(response)
}

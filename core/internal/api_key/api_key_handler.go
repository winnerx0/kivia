package apikey

import (
	"errors"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/winnerx0/kivia/internal/utils"
	"github.com/winnerx0/kivia/internal/validator"
)

type apiKeyHandler struct {
	service apiKeyService
}

func NewApiKeyHandler(service apiKeyService) *apiKeyHandler {
	return &apiKeyHandler{
		service: service,
	}
}

func (h apiKeyHandler) CreateApiKey(c fiber.Ctx) error {

	var apiKeyRequest createApiKeyRequest

	if err := c.Bind().JSON(&apiKeyRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	if err := validator.Get().Struct(apiKeyRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": validator.FirstError(err)})
	}

	apiKey := &ApiKey{
		Name:      apiKeyRequest.Name,
		ProjectId: apiKeyRequest.ProjectId,
		UserId:    c.Value("userId").(string),
	}

	response, err := h.service.CreateApiKey(apiKey)

	if err != nil {
		if errors.Is(err, utils.ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}

		if errors.Is(err, utils.ErrDuplicateKey) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

func (h apiKeyHandler) GetAllApiKeys(c fiber.Ctx) error {

	userId := c.Value("userId").(string)

	projectId := c.Params("projectId")

	err := uuid.Validate(projectId)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	apiKeys, err := h.service.GetAllApiKeysByProject(userId, projectId)

	if err != nil {

		if errors.Is(err, utils.ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(apiKeys)
}

func (h apiKeyHandler) RevokeApiKey(c fiber.Ctx) error {

	apiKeyId := c.Params("id")

	userId := c.Value("userId").(string)

	err := h.service.RevokeApiKey(apiKeyId, userId)

	if err != nil {

		if errors.Is(err, utils.ErrApiKeyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if errors.Is(err, utils.ErrUnauthorized) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
		}
		if errors.Is(err, utils.ErrInvalidRovoke) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "API key revoked successfully"})
}

func (h apiKeyHandler) DeleteApiKey(c fiber.Ctx) error {

	apiKeyId := c.Params("id")

	userId := c.Value("userId").(string)

	err := h.service.DeleteApiKey(apiKeyId, userId)

	if err != nil {

		if errors.Is(err, utils.ErrApiKeyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if errors.Is(err, utils.ErrUnauthorized) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "API key deleted successfully"})
}

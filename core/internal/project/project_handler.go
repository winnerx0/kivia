package project

import (
	"errors"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/winnerx0/kivia/internal/utils"
	"github.com/winnerx0/kivia/internal/validator"
)

type projecthandler struct {
	service projectservice
}

func NewProjectHandler(service projectservice) *projecthandler {
	return &projecthandler{
		service: service,
	}
}

func (h projecthandler) CreateProject(c fiber.Ctx) error {

	var projectRequest createProjectRequest

	if err := c.Bind().JSON(&projectRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	if err := validator.Get().Struct(projectRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": validator.FirstError(err)})
	}

	project := &Project{
		Id:      uuid.New().String(),
		Name:    projectRequest.Name,
		UserId:  c.Value("userId").(string),
		ApiKeys: []string{},
	}

	if err := h.service.CreateProject(project); err != nil {
		if errors.Is(err, utils.ErrDuplicateProjectName) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Project created successfully"})
}

func (h projecthandler) GetAllProjects(c fiber.Ctx) error {

	userId := c.Value("userId").(string)

	projects, err := h.service.GetAllProjectsByUser(userId)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(projects)
}

func (h projecthandler) DeleteProject(c fiber.Ctx) error {

	userId := c.Value("userId").(string)

	projectId := c.Params("projectId")

	err := h.service.DeleteProject(c, projectId, userId)

	if err != nil {

		if errors.Is(err, utils.ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		} else if errors.Is(err, utils.ErrProjectAccessDenied) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

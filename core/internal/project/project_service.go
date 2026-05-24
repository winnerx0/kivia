package project

import (
	"context"

	"github.com/winnerx0/kivia/internal/utils"
)

type projectservice struct {
	repo *Repository
}

func NewProjectService(repo *Repository) *projectservice {
	return &projectservice{
		repo: repo,
	}
}

func (s projectservice) CreateProject(project *Project) error {

	err := s.repo.Save(*project)

	if err != nil {
		return err
	}

	return nil
}

func (s projectservice) GetAllProjectsByUser(userId string) ([]ProjectResponse, error) {

	return s.repo.FindAllByUserId(userId)
}

func (s projectservice) DeleteProject(ctx context.Context, projectId, userId string) error {

	project, err := s.repo.FindById(projectId)

	if err != nil {
		return err
	}

	if project == nil {
		return utils.ErrProjectNotFound
	}

	if project.UserId != userId {
		return utils.ErrProjectAccessDenied
	}

	return s.repo.Delete(ctx, projectId)
}

package project

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{
		db: db,
	}
}

func (r Repository) Save(project Project) error {

	query := `
	INSERT INTO projects (id, name, api_keys, user_id) VALUES ($1, $2, $3, $4)
	`
	var pgErr *pgconn.PgError

	_, err := r.db.Exec(context.Background(), query, project.Id, project.Name, project.ApiKeys, project.UserId)

	if ok := errors.As(err, &pgErr); ok {
		if pgErr.Code == "23505" {
			return errors.New("DUPLICATE_PROJECT_NAME")
		}
	}

	return err
}

func (r Repository) FindById(id string) (*Project, error) {

	var project Project

	query := `
	SELECT id, name, api_keys, user_id, created_at FROM projects WHERE id = $1
	`

	row := r.db.QueryRow(context.Background(), query, id)

	err := row.Scan(&project.Id, &project.Name, &project.ApiKeys, &project.UserId, &project.CreatedAt)

	return &project, err
}

func (r Repository) ExistsById(id string) (bool, error) {

	var exists bool

	query := `
	SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1)
	`

	row := r.db.QueryRow(context.Background(), query, id)

	err := row.Scan(&exists)

	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}

	return exists, err
}

func (r Repository) FindProjectIdByApiKey(apiKey string) (string, error) {

	var projectId string

	query := `
	SELECT projects.id FROM projects JOIN api_keys ON api_keys.project_id = projects.id WHERE api_keys.key = $1 AND api_keys.revoked = false AND api_keys.deleted_at IS NULL
	`

	row := r.db.QueryRow(context.Background(), query, apiKey)

	err := row.Scan(&projectId)

	return projectId, err
}

func (r Repository) FindAllByUserId(userId string) ([]ProjectResponse, error) {

	projects := []ProjectResponse{}

	query := `
	SELECT projects.id, projects.name, COUNT(api_keys.id), projects.user_id, projects.created_at 
	FROM projects
	LEFT JOIN api_keys ON api_keys.project_id = projects.id AND api_keys.deleted_at IS NULL
	WHERE projects.user_id = $1
	GROUP BY projects.id
	`

	rows, err := r.db.Query(context.Background(), query, userId)

	if err != nil {
		return []ProjectResponse{}, err
	}

	defer rows.Close()

	for rows.Next() {
		var project ProjectResponse
		err := rows.Scan(&project.Id, &project.Name, &project.ApiKeys, &project.UserId, &project.CreatedAt)
		if err != nil {
			return []ProjectResponse{}, err
		}
		projects = append(projects, project)
	}

	return projects, nil
}

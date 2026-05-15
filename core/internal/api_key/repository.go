package apikey

import (
	"context"
	"errors"
	_ "log"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/winnerx0/kivia/internal/utils"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{
		db: db,
	}
}

func (r *Repository) Save(apiKey ApiKey) error {

	query := `
		INSERT INTO api_keys (name, key, user_id, project_id, revoked) VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.Exec(context.Background(), query, apiKey.Name, apiKey.Key, apiKey.UserId, apiKey.ProjectId, apiKey.Revoked)

	var pgErr *pgconn.PgError

	if errors.As(err, &pgErr) {
		if pgErr.Code == "23505" {
			return utils.ErrDuplicateKey
		}
	}

	return err
}

func (r *Repository) FindByProjectId(projectId string) (ApiKey, error) {

	var apiKey ApiKey

	query := `
		SELECT id, name, key, user_id, project_Id, revoked, deleted_at, created_at FROM api_keys WHERE revoked = false AND deleted_at IS NULL AND project_Id = $1
	`

	row := r.db.QueryRow(context.Background(), query, projectId)

	err := row.Scan(&apiKey.Id, &apiKey.Name, &apiKey.Key, &apiKey.UserId, &apiKey.ProjectId, &apiKey.Revoked, &apiKey.DeletedAt, &apiKey.CreatedAt)

	return apiKey, err
}

func (r *Repository) FindById(id string) (ApiKey, error) {

	var apiKey ApiKey

	query := `
		SELECT id, name, key, user_id, project_id, revoked, deleted_at, created_at FROM api_keys WHERE id = $1
	`

	row := r.db.QueryRow(context.Background(), query, id)

	err := row.Scan(&apiKey.Id, &apiKey.Name, &apiKey.Key, &apiKey.UserId, &apiKey.ProjectId, &apiKey.Revoked, &apiKey.DeletedAt, &apiKey.CreatedAt)

	return apiKey, err
}

func (r *Repository) FindAllByUserIdAndProjectId(userId string, projectId string) ([]ApiKey, error) {

	apiKeys := make([]ApiKey, 0)

	query := `
		SELECT id, name, key, revoked, project_id, created_at FROM api_keys WHERE user_id = $1 AND project_id = $2 AND deleted_at IS NULL
	`

	rows, err := r.db.Query(context.Background(), query, userId, projectId)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var apiKey ApiKey

		err := rows.Scan(&apiKey.Id, &apiKey.Name, &apiKey.Key, &apiKey.Revoked, &apiKey.ProjectId, &apiKey.CreatedAt)

		if err != nil {
			return nil, err
		}

		apiKeys = append(apiKeys, apiKey)
	}

	return apiKeys, err
}

func (r *Repository) RevokeApiKey(id string) error {

	query := `
		UPDATE api_keys SET revoked = true WHERE id = $1 AND deleted_at IS NULL;
	`
	_, err := r.db.Exec(context.Background(), query, id)

	return err
}

func (r *Repository) DeleteApiKey(id string) error {

	query := `
		UPDATE api_keys SET revoked = true, deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL;
	`
	_, err := r.db.Exec(context.Background(), query, id)

	return err
}

func (r *Repository) FindProjectIdByKey(apiKey string) (string, error) {

	var projectId string

	query := `
	SELECT project_id FROM api_keys WHERE key = $1 AND revoked = false AND deleted_at IS NULL
	`

	row := r.db.QueryRow(context.Background(), query, apiKey)

	err := row.Scan(&projectId)

	return projectId, err
}

func (r *Repository) FindIdById(key string) (string, error) {

	var id string

	query := `
	SELECT id FROM api_keys WHERE key = $1 AND revoked = false AND deleted_at IS NULL
	`

	row := r.db.QueryRow(context.Background(), query, key)

	err := row.Scan(&id)

	return id, err
}

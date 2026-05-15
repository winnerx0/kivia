DROP INDEX IF EXISTS unique_api_key_name_active;

ALTER TABLE api_keys ADD CONSTRAINT unique_api_key_name UNIQUE (name, project_id);

ALTER TABLE api_keys DROP COLUMN IF EXISTS deleted_at;

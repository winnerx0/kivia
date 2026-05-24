ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS unique_api_key_name;

CREATE UNIQUE INDEX IF NOT EXISTS unique_api_key_name_active
ON api_keys (name, project_id)
WHERE deleted_at IS NULL;

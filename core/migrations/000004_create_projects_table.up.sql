CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(15) NOT NULL CHECK (LENGTH(name) > 3),
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_project_name_per_user UNIQUE (name, user_id)
); 
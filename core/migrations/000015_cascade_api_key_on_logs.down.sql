ALTER TABLE logs DROP CONSTRAINT logs_api_key_id_fkey;
ALTER TABLE logs ADD CONSTRAINT logs_api_key_id_fkey
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id);

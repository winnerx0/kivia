package utils

import "errors"

var (

	// api key related errors
	ErrUnauthorized = errors.New("Unauthorized")
	ErrDuplicateKey = errors.New("API Key name already exists for the project")
	ErrApiKeyNotFound = errors.New("API key not found")
	ErrInvalidApiKey = errors.New("Invalid API key")
	ErrInvalidRovoke = errors.New("API key already revoked")

	// project related errors
	ErrProjectNotFound = errors.New("Project not found")
	ErrProjectAccessDenied = errors.New("Project access denied")
	ErrDuplicateProjectName = errors.New("Duplicate project name")
	
	ErrSomethingWentWrong = errors.New("Something went wrong")
	
	ErrEmailExistsWithDifferentProvider = errors.New("Email exists with different provider")
)
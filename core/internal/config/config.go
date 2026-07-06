package config

import (
	"os"
	
)

type Config struct {
	DBUrl string

	Port string

	JwtAccessTokenSecret string

	JwtRefreshTokenSecret string

	BrevoApiKey string
	SenderEmail string
	SenderName  string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	GoogleFrontendURL  string
	KiviaApiKey        string
}

func Load() *Config {

	return &Config{
		DBUrl:                 getEnv("DATABASE_URL", ""),
		Port:                  getEnv("PORT", ""),
		JwtAccessTokenSecret:  getEnv("JWT_ACCESS_TOKEN_SECRET", ""),
		JwtRefreshTokenSecret: getEnv("JWT_REFRESH_TOKEN_SECRET", ""),
		BrevoApiKey:           getEnv("BREVO_API_KEY", ""),
		SenderEmail:           getEnv("SENDER_EMAIL", ""),
		SenderName:            getEnv("SENDER_NAME", ""),
		GoogleClientID:        getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:    getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:     getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/auth/google/callback"),
		GoogleFrontendURL:     getEnv("GOOGLE_FRONTEND_URL", "http://localhost:3000"),
		KiviaApiKey:          getEnv("KIVIA_API_KEY", ""),
	}

}

func getEnv(key string, defaultValue string) (value string) {

	if value = os.Getenv(key); value == "" {
		return defaultValue
	}

	return value

}

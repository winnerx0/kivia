package api

import (
	"context"
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	apikey "github.com/winnerx0/kivia/internal/api_key"
	"github.com/winnerx0/kivia/internal/auth"
	"github.com/winnerx0/kivia/internal/config"
	"github.com/winnerx0/kivia/internal/database"
	"github.com/winnerx0/kivia/internal/email"
	emailverification "github.com/winnerx0/kivia/internal/email_verification"
	"github.com/winnerx0/kivia/internal/log"
	"github.com/winnerx0/kivia/internal/middleware"
	"github.com/winnerx0/kivia/internal/project"
	refreshtoken "github.com/winnerx0/kivia/internal/refresh_token"
	"github.com/winnerx0/kivia/internal/sse"
	"github.com/winnerx0/kivia/internal/user"
)

type Server struct {
	app *fiber.App

	config config.Config
}

func NewServer(cfg config.Config) *Server {

	app := fiber.New(fiber.Config{
		AppName:        "Kivia",
		ReadBufferSize: 8192, // 8MB
	})

	logger := slog.Default()

	server := sse.NewSSEServer(context.Background(), logger)

	server.SrvWg.Add(1)
	go server.Run()

	db := database.Connect(cfg.DBUrl)

	projectRepository := project.NewRepository(db)

	projectService := project.NewProjectService(projectRepository)

	projectHandler := project.NewProjectHandler(*projectService)

	apiKeyRepository := apikey.NewRepository(db)

	apiService := apikey.NewApiKeyService(apiKeyRepository, projectRepository)

	apiKeyMiddlware := middleware.NewApiKeyMiddleware(apiKeyRepository)

	logRepository := log.NewRepository(db)

	logService := log.NewLogService(logRepository, apiKeyRepository, projectRepository, server)

	logHandler := log.NewLogHandler(*logService)

	refreshTokenRepository := refreshtoken.NewRepository(db)

	userRepository := user.NewRepository(db)

	emailVerificationRepository := emailverification.NewRepository(db)

	emailService := email.NewEmailService(cfg.BrevoApiKey, cfg.SenderEmail, cfg.SenderName)

	authService := auth.NewAuthService(userRepository, refreshTokenRepository, emailVerificationRepository, emailService, cfg)

	jwtMiddleware := middleware.NewJwtMiddleware(*userRepository, cfg)

	apiKeyHandler := apikey.NewApiKeyHandler(*apiService)

	userService := user.NewUserService(*userRepository)

	userHandler := user.NewUserHandler(*userService)

	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"https://localhost:3000", "https://kivia-observe.vercel.app"},
		AllowHeaders: []string{"Authorization", "Content-Type", "Accept", "X-Kivia-Api-Key"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowCredentials: false,
	}))

	app.Get("/health", func(c fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	api := app.Group("/api")

	v1 := api.Group("/v1")

	// auth routes
	authRouter := app.Group("/auth")

	authhandler := auth.NewAuthHandler(*authService)

	authRouter.Post("/register", authhandler.Register)

	authRouter.Post("/login", authhandler.Login)

	authRouter.All("/validate", authhandler.ValidateToken)

	authRouter.Post("/refresh", authhandler.Refresh)

	authRouter.Get("/google", authhandler.GoogleRedirect)

	authRouter.Get("/google/callback", authhandler.GoogleCallback)

	authRouter.Post("/verify-otp", authhandler.VerifyOTP)

	authRouter.Post("/resend-otp", authhandler.ResendOTP)

	// project routes
	projectRouter := v1.Group("/projects", jwtMiddleware.JwtMiddleware)

	projectRouter.Post("/create", projectHandler.CreateProject)

	projectRouter.Get("/all", projectHandler.GetAllProjects)

	projectRouter.Delete("/:projectId", projectHandler.DeleteProject)

	// api key routes
	apiKeyRouter := v1.Group("/api-keys", jwtMiddleware.JwtMiddleware)

	apiKeyRouter.Post("/create", apiKeyHandler.CreateApiKey)

	apiKeyRouter.Get("/all/:projectId", apiKeyHandler.GetAllApiKeys)

	apiKeyRouter.Patch("/revoke/:id", apiKeyHandler.RevokeApiKey)

	apiKeyRouter.Delete("/:id", apiKeyHandler.DeleteApiKey)

	// log routes
	logRouter := v1.Group("/logs")

	logRouter.Post("/create", apiKeyMiddlware.ApiKeyMiddleware, logHandler.CreateLog)

	logRouter.Get("/all/:projectId", jwtMiddleware.JwtMiddleware, logHandler.GetLogsByProjectId)

	logRouter.Get("/stream/:projectId", jwtMiddleware.JwtMiddleware, server.HandleConnection)

	logRouter.Get("/chart/:projectId", jwtMiddleware.JwtMiddleware, logHandler.GetLogsForChart)

	// user routes
	userRouter := v1.Group("/users", jwtMiddleware.JwtMiddleware)

	userRouter.Get("/me", userHandler.GetCurrentUser)

	userRouter.Delete("/me", userHandler.DeleteUser)

	userRouter.Put("/me", userHandler.UpdateUser)

	return &Server{app: app, config: cfg}
}

func (s *Server) Start() error {

	return s.app.Listen(":" + s.config.Port)
}

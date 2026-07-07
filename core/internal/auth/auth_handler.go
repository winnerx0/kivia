package auth

import (
	"log"
	"net/url"

	"github.com/gofiber/fiber/v3"
)

type authhandler struct {
	service authservice
}

func NewAuthHandler(service authservice) *authhandler {
	return &authhandler{
		service: service,
	}
}

func (h authhandler) Register(c fiber.Ctx) error {

	var userRequest createUserRequest

	if err := c.Bind().JSON(&userRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	response, err := h.service.Register(userRequest)

	if err != nil {
		if err.Error() == "ALREADY_EXISTS" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "User with email already exists"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

func (h authhandler) Login(c fiber.Ctx) error {

	var loginRequest LoginRequest

	if err := c.Bind().JSON(&loginRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	 response, err := h.service.Login(loginRequest);

	if err != nil {
		if err.Error() == "NOT_EXISTS" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid credentials"})
		}
		if err.Error() == "NOT_VERIFIED" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "NOT_VERIFIED", "email": loginRequest.Email})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

func (h authhandler) Refresh(c fiber.Ctx) error {

	var refreshRequest RefreshRequest

	if err := c.Bind().JSON(&refreshRequest); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	response, err := h.service.RefreshToken(refreshRequest.RefreshToken)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

func (h authhandler) VerifyOTP(c fiber.Ctx) error {
	var req VerifyOTPRequest

	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.VerifyOTP(req); err != nil {
		switch err.Error() {
		case "OTP_EXPIRED":
			return c.Status(fiber.StatusGone).JSON(fiber.Map{"error": "Verification code has expired. Please request a new one."})
		case "TOO_MANY_ATTEMPTS":
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": "Too many attempts. Please request a new code."})
		case "INVALID_OTP":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid verification code"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Email verified successfully"})
}

func (h authhandler) ResendOTP(c fiber.Ctx) error {
	var req ResendOTPRequest

	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.ResendOTP(req); err != nil {
		switch err.Error() {
		case "RESEND_TOO_SOON":
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": "Please wait before requesting a new code"})
		case "ALREADY_VERIFIED":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is already verified"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Verification code sent"})
}

func (h authhandler) GoogleRedirect(c fiber.Ctx) error {
	cfg := h.service.config

	params := url.Values{
		"client_id":     {cfg.GoogleClientID},
		"redirect_uri":  {cfg.GoogleRedirectURL},
		"response_type": {"code"},
		"scope":         {"openid email profile"},
		"access_type":   {"offline"},
		"prompt":        {"consent"},
	}

	return c.Redirect().To("https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode())
}

func (h authhandler) GoogleCallback(c fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Redirect().To(h.service.config.GoogleFrontendURL + "/login?error=missing_code")
	}

	response, err := h.service.GoogleLogin(code)
	if err != nil {
		log.Printf("Google login error: %v", err)
		errMsg := "auth_failed"
		if err.Error() == "EMAIL_EXISTS_WITH_DIFFERENT_PROVIDER" {
			errMsg = "email_exists"
		}
		return c.Redirect().To(h.service.config.GoogleFrontendURL + "/login?error=" + errMsg)
	}

	params := url.Values{
		"access_token":  {response.AccessToken},
		"refresh_token": {response.RefreshToken},
	}

	return c.Redirect().To(h.service.config.GoogleFrontendURL + "/auth/google/callback?" + params.Encode())
}

func (h authhandler) ValidateToken(c fiber.Ctx) error {

	authHeader := c.Get(fiber.HeaderAuthorization)

	
	if authHeader == "" || authHeader[:7] != "Bearer " {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing or invalid Authorization header"})
	}

	authToken := authHeader[7:]

	response, err := h.service.Validate(authToken)

	log.Printf("ValidateToken response: %+v, error: %v", response, err)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON("OK")
}
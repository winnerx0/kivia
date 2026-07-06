package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/winnerx0/kivia/internal/config"
	emailservice "github.com/winnerx0/kivia/internal/email"
	emailverification "github.com/winnerx0/kivia/internal/email_verification"
	refreshtoken "github.com/winnerx0/kivia/internal/refresh_token"
	"github.com/winnerx0/kivia/internal/user"
	"github.com/winnerx0/kivia/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

type authservice struct {
	userrepo              *user.Repository
	refreshTokenRepo      *refreshtoken.Repository
	emailVerificationRepo *emailverification.Repository
	emailService          *emailservice.EmailService
	config                config.Config
}

func NewAuthService(userrepo *user.Repository, refreshTokenRepo *refreshtoken.Repository, emailVerificationRepo *emailverification.Repository, emailService *emailservice.EmailService, config config.Config) *authservice {
	return &authservice{
		userrepo:              userrepo,
		refreshTokenRepo:      refreshTokenRepo,
		emailVerificationRepo: emailVerificationRepo,
		emailService:          emailService,
		config:                config,
	}
}

type CustomClaims struct {
	role string

	jwt.RegisteredClaims
}

type ValidateResponse struct {
	UserId string `json:"user_id"`
	Role   string `json:"role"`
}

func (s authservice) Register(createUserRequest createUserRequest) (*RegisterResponse, error) {

	if exists := s.userrepo.ExistsByEmail(createUserRequest.Email); exists {
		return nil, errors.New("ALREADY_EXISTS")
	}

	passwordBytes, err := bcrypt.GenerateFromPassword([]byte(createUserRequest.Password), 10)

	if err != nil {
		return nil, err
	}

	newUser := user.User{
		Id:       uuid.NewString(),
		Email:    createUserRequest.Email,
		Password: string(passwordBytes),
		Name:     createUserRequest.Name,
		Provider: "local",
		Verified: false,
		JoinedAt: time.Now(),
	}

	if err := s.userrepo.Save(newUser); err != nil {
		return nil, err
	}

	if err := s.sendOTP(newUser.Id, createUserRequest.Email); err != nil {
		return nil, err
	}

	return &RegisterResponse{
		Email:   createUserRequest.Email,
		Message: "Verification code sent to your email",
	}, nil
}

func (s authservice) generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(999999))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func (s authservice) sendOTP(userId, email string) error {
	otp, err := s.generateOTP()
	if err != nil {
		return err
	}

	hash := sha256.Sum256([]byte(otp))

	// Delete any existing verification records for this user
	s.emailVerificationRepo.DeleteByUserId(userId)

	ev := emailverification.EmailVerification{
		Id:        uuid.NewString(),
		Email:     email,
		OtpHash:   hex.EncodeToString(hash[:]),
		Attempts:  0,
		ExpiresAt: time.Now().Add(10 * time.Minute),
		CreatedAt: time.Now(),
		UserId:    userId,
	}

	log.Printf("Saving email verification for user %s", userId)
	
	if err := s.emailVerificationRepo.Save(ev); err != nil {
		return err
	}
	
	log.Printf("Email verification saved for user %s", userId)

	emailMsg := emailservice.Email{
		To:      email,
		Subject: "Verify your Kivia account",
		Text:    fmt.Sprintf("Your verification code is: %s", otp),
		Html:    fmt.Sprintf("<h2>Your verification code</h2><p>Use the following code to verify your account:</p><h1 style=\"letter-spacing: 8px; font-size: 36px;\">%s</h1><p>This code expires in 10 minutes.</p>", otp),
	}

	// ponytail: fire-and-forget, same semantics as the old auto-ack queue
	go func() {
		if err := s.emailService.Send(emailMsg); err != nil {
			log.Printf("failed to send OTP email: %v", err)
		}
	}()

	return nil
}

func (s authservice) VerifyOTP(req VerifyOTPRequest) error {
	u := s.userrepo.FindByEmail(req.Email)
	if u.Id == "" {
		return errors.New("NOT_EXISTS")
	}

	ev := s.emailVerificationRepo.FindByEmail(req.Email)
	if ev.Id == "" {
		return errors.New("OTP_EXPIRED")
	}

	if ev.ExpiresAt.Before(time.Now()) {
		return errors.New("OTP_EXPIRED")
	}

	if ev.Attempts >= 5 {
		return errors.New("TOO_MANY_ATTEMPTS")
	}

	hash := sha256.Sum256([]byte(req.OTP))
	if hex.EncodeToString(hash[:]) != ev.OtpHash {
		s.emailVerificationRepo.IncrementAttempts(ev.Id)
		return errors.New("INVALID_OTP")
	}

	if err := s.userrepo.SetVerified(u.Id); err != nil {
		return err
	}

	s.emailVerificationRepo.DeleteByUserId(u.Id)
	return nil
}

func (s authservice) ResendOTP(req ResendOTPRequest) error {
	u := s.userrepo.FindByEmail(req.Email)
	if u.Id == "" {
		return errors.New("NOT_EXISTS")
	}

	if u.Verified {
		return errors.New("ALREADY_VERIFIED")
	}

	ev := s.emailVerificationRepo.FindByEmail(req.Email)
	if ev.Id != "" && time.Since(ev.CreatedAt) < 60*time.Second {
		return errors.New("RESEND_TOO_SOON")
	}

	return s.sendOTP(u.Id, req.Email)
}

func (s authservice) Login(loginRequest LoginRequest) (*AuthResponse, error) {

	user := s.userrepo.FindByEmail(loginRequest.Email)

	if user.Id == "" {
		return nil, errors.New("NOT_EXISTS")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginRequest.Password))

	if err != nil {
		return nil, err
	}

	if !user.Verified && user.Provider == "local" {
		return nil, errors.New("NOT_VERIFIED")
	}

	refreshTokenExpiresAt := time.Now().Add(time.Hour * 24 * 30)

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.Id,
		"exp": refreshTokenExpiresAt.Unix(),
	})
	refreshTokenString, err := refreshToken.SignedString([]byte(s.config.JwtRefreshTokenSecret))

	if err != nil {
		return nil, err
	}

	accessTokenExpiresAt := time.Now().Add(time.Minute * 15)

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   user.Id,
		"exp":   accessTokenExpiresAt.Unix(),
		"roles": []string{"USER"},
	})

	accessTokenString, err := accessToken.SignedString([]byte(s.config.JwtAccessTokenSecret))

	if err != nil {
		return nil, err
	}

	hash := sha256.Sum256([]byte(refreshTokenString))

	err = s.refreshTokenRepo.Save(refreshtoken.RefreshToken{
		Id:        uuid.NewString(),
		Token:     hex.EncodeToString(hash[:]),
		ExpiresAt: refreshTokenExpiresAt,
		UserId:    user.Id,
	})

	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
	}, nil
}

func (s authservice) RefreshToken(refreshTokenString string) (*AuthResponse, error) {

	refreshToken, err := jwt.Parse(refreshTokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("Unexpected signing method")
		}
		return []byte(s.config.JwtRefreshTokenSecret), nil
	})

	if err != nil || !refreshToken.Valid {
		return nil, errors.New("Invalid refresh token")
	}

	claims, ok := refreshToken.Claims.(jwt.MapClaims)

	if !ok || claims["sub"] == nil {
		return nil, errors.New("Invalid refresh token claims")
	}

	userId := claims["sub"].(string)

	sha := sha256.Sum256([]byte(refreshTokenString))
	
	storedRefreshToken := s.refreshTokenRepo.FindByToken(hex.EncodeToString(sha[:]))
	
	if storedRefreshToken.Token == "" {
		return nil, errors.New("Invalid refresh token")
	}
	
	if storedRefreshToken.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("Invalid or expired refresh token")
	}

	accessTokenExpiresAt := time.Now().Add(time.Minute * 15)

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   userId,
		"exp":   accessTokenExpiresAt.Unix(),
		"roles": []string{"USER"},
	})

	accessTokenString, err := accessToken.SignedString([]byte(s.config.JwtAccessTokenSecret))

	refreshTokenExpiresAt := time.Now().Add(time.Hour * 24 * 30)

	newRefreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userId,
		"exp": refreshTokenExpiresAt.Unix(),
	})

	newRefreshTokenString, err := newRefreshToken.SignedString([]byte(s.config.JwtRefreshTokenSecret))

	if err != nil {
		return nil, err
	}

	hash := sha256.Sum256([]byte(newRefreshTokenString))

	err = s.refreshTokenRepo.Save(refreshtoken.RefreshToken{
		Id:        uuid.NewString(),
		Token:     hex.EncodeToString(hash[:]),
		ExpiresAt: refreshTokenExpiresAt,
		UserId:    userId,
	})

	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessTokenString,
		RefreshToken: newRefreshTokenString,
	}, nil
}

func (s authservice) generateTokens(userId string) (*AuthResponse, error) {
	refreshTokenExpiresAt := time.Now().Add(time.Hour * 24 * 30)

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userId,
		"exp": refreshTokenExpiresAt.Unix(),
	})
	refreshTokenString, err := refreshToken.SignedString([]byte(s.config.JwtRefreshTokenSecret))
	if err != nil {
		return nil, err
	}

	accessTokenExpiresAt := time.Now().Add(time.Minute * 15)

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   userId,
		"exp":   accessTokenExpiresAt.Unix(),
		"roles": []string{"USER"},
	})
	accessTokenString, err := accessToken.SignedString([]byte(s.config.JwtAccessTokenSecret))
	if err != nil {
		return nil, err
	}

	hash := sha256.Sum256([]byte(refreshTokenString))

	err = s.refreshTokenRepo.Save(refreshtoken.RefreshToken{
		Id:        uuid.NewString(),
		Token:     hex.EncodeToString(hash[:]),
		ExpiresAt: refreshTokenExpiresAt,
		UserId:    userId,
	})
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
	}, nil
}

func (s authservice) GoogleLogin(code string) (*AuthResponse, error) {
	// Exchange auth code for tokens
	data := url.Values{
		"code":          {code},
		"client_id":     {s.config.GoogleClientID},
		"client_secret": {s.config.GoogleClientSecret},
		"redirect_uri":  {s.config.GoogleRedirectURL},
		"grant_type":    {"authorization_code"},
	}

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("google token exchange failed: %s", string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}

	// Get user info from Google
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	userResp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer userResp.Body.Close()

	var googleUser GoogleUserInfo
	if err := json.NewDecoder(userResp.Body).Decode(&googleUser); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	// Find or create user
	existingUser := s.userrepo.FindByEmail(googleUser.Email)

	if existingUser.Id != "" {
		if existingUser.Provider != "google" {
			return nil, utils.ErrEmailExistsWithDifferentProvider
		}
		return s.generateTokens(existingUser.Id)
	}

	newUser := user.User{
		Id:             uuid.NewString(),
		Email:          googleUser.Email,
		Name:           googleUser.Name,
		ProfilePicture: googleUser.Picture,
		Provider:       "google",
		Verified:       true,
		JoinedAt:       time.Now(),
	}

	if err := s.userrepo.Save(newUser); err != nil {
		return nil, err
	}

	return s.generateTokens(newUser.Id)
}

func (s authservice) Validate(authToken string) (ValidateResponse, error) {

	var claims = &CustomClaims{}

	token, err := jwt.ParseWithClaims(authToken, claims, func(t *jwt.Token) (any, error) {

		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return ValidateResponse{}, errors.New("Unexpected signing method")
		}

		return []byte(s.config.JwtAccessTokenSecret), nil
	})

	if err != nil || !token.Valid {

		return ValidateResponse{}, errors.New("Invalid Token")
	}

	user := s.userrepo.FindById(claims.Subject)

	if user.Id == "" {
		return ValidateResponse{}, errors.New("User not found")
	}

	return ValidateResponse{
		UserId: user.Id,
		Role:   user.Role,
	}, nil
}

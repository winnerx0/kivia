package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Email struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Html    string `json:"html"`
	Text    string `json:"text"`
}

type EmailService struct {
	brevoApiKey string
	senderEmail string
	senderName  string
}

func NewEmailService(brevoApiKey string, senderEmail string, senderName string) *EmailService {
	return &EmailService{brevoApiKey: brevoApiKey, senderEmail: senderEmail, senderName: senderName}
}

func (s *EmailService) Send(email Email) error {

	data, err := json.Marshal(map[string]any{
		"sender": struct {
			Email string `json:"email"`
			Name  string `json:"name"`
		}{
			Email: s.senderEmail,
			Name:  s.senderName,
		},
		"to": []struct {
			Email string `json:"email"`
		}{
			{Email: email.To},
		},
		"subject":     email.Subject,
		"htmlContent": email.Html,
		"textContent": email.Text,
	})

	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.brevo.com/v3/smtp/email", bytes.NewReader(data))

	if err != nil {
		return err
	}

	req.Header.Set("api-key", s.brevoApiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("failed to send email: %s", resp.Status)
	}

	return nil
}

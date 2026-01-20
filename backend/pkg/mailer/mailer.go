package mailer

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"
)

// Mailer abstracts sending email notifications.
type Mailer interface {
	Send(to, subject, body string) error
}

// Config holds SMTP configuration.
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

// New returns an SMTP-backed Mailer when configuration is complete,
// otherwise it falls back to a no-op mailer (useful for local dev without SMTP).
func New(cfg Config) Mailer {
	if cfg.Host == "" || cfg.Port == 0 || cfg.Username == "" || cfg.Password == "" || cfg.From == "" {
		return &noopMailer{}
	}
	return &smtpMailer{cfg: cfg}
}

type smtpMailer struct {
	cfg Config
}

func (m *smtpMailer) Send(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", m.cfg.Host, m.cfg.Port)
	auth := smtp.PlainAuth("", m.cfg.Username, m.cfg.Password, m.cfg.Host)

	msg := buildMessage(m.cfg.From, to, subject, body)
	log.Printf("mailer: sending \"%s\" to %s", subject, to)
	return smtp.SendMail(addr, auth, m.cfg.From, []string{to}, []byte(msg))
}

type noopMailer struct{}

func (n *noopMailer) Send(string, string, string) error {
	return nil
}

func buildMessage(from, to, subject, body string) string {
	headers := []string{
		fmt.Sprintf("From: %s", from),
		fmt.Sprintf("To: %s", to),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=\"UTF-8\"",
		"",
	}
	return strings.Join(headers, "\r\n") + body
}

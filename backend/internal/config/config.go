package config

import (
	"log"
	"os"
	"strconv"
	"time"
)

// Config stores runtime configuration values loaded from environment variables.
type Config struct {
	AppName            string
	ServerPort         string
	DBDSN              string
	JWTSecret          string
	AccessTokenTTL     time.Duration
	RefreshTokenTTL    time.Duration
	UploadDir          string
	FrontendURL        string
	SeedMasterEmail    string
	SeedMasterPassword string
	SMTPHost           string
	SMTPPort           int
	SMTPUsername       string
	SMTPPassword       string
	SMTPFrom           string
}

// Load reads environment variables and returns a Config with safe defaults.
func Load() *Config {
	return &Config{
		AppName:            getEnv("APP_NAME", "Service Report"),
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		DBDSN:              getEnv("DB_DSN", "root:@tcp(127.0.0.1:3306)/service_reports?parseTime=true&loc=Local"),
		JWTSecret:          getEnv("JWT_SECRET", "CHANGE_ME"),
		AccessTokenTTL:     getDuration("JWT_ACCESS_TTL", 15*time.Minute),
		RefreshTokenTTL:    getDuration("JWT_REFRESH_TTL", 24*time.Hour),
		UploadDir:          getEnv("UPLOAD_DIR", "./uploads"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
		SeedMasterEmail:    getEnv("SEED_MASTER_EMAIL", "master@corp.com"),
		SeedMasterPassword: getEnv("SEED_MASTER_PASSWORD", "ChangeMe123!"),
		SMTPHost:           getEnv("SMTP_HOST", ""),
		SMTPPort:           getInt("SMTP_PORT", 587),
		SMTPUsername:       getEnv("SMTP_USERNAME", ""),
		SMTPPassword:       getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:           getEnv("SMTP_FROM", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		i, err := strconv.Atoi(value)
		if err != nil {
			log.Printf("invalid int for %s, using fallback: %v", key, err)
			return fallback
		}
		return i
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		d, err := time.ParseDuration(value)
		if err != nil {
			log.Printf("invalid duration for %s, using fallback: %v", key, err)
			return fallback
		}
		return d
	}
	return fallback
}

func getBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		b, err := strconv.ParseBool(value)
		if err != nil {
			log.Printf("invalid bool for %s, using fallback: %v", key, err)
			return fallback
		}
		return b
	}
	return fallback
}

package main

import (
	"log"

	"github.com/joho/godotenv"

	"github.com/company/internal-service-report/internal/config"
	"github.com/company/internal-service-report/internal/database"
	"github.com/company/internal-service-report/internal/server"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	db, err := database.Connect(cfg.DBDSN)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	if err := database.Seed(db, cfg); err != nil {
		log.Fatalf("failed to seed data: %v", err)
	}

	app := server.New(db, cfg)

	if err := app.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("server exited: %v", err)
	}
}

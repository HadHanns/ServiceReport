package server

import (
    "net/http"
    "time"

    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"

    "github.com/company/internal-service-report/internal/config"
    "github.com/company/internal-service-report/internal/domain/auth"
    "github.com/company/internal-service-report/internal/domain/report"
    "github.com/company/internal-service-report/internal/domain/user"
    "github.com/company/internal-service-report/internal/middleware"
    "github.com/company/internal-service-report/pkg/bcrypt"
    "github.com/company/internal-service-report/pkg/jwt"
)

// New configures Gin server with all routes and dependencies.
func New(db *gorm.DB, cfg *config.Config) *gin.Engine {
    r := gin.New()
    r.Use(gin.Logger(), gin.Recovery())

    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{cfg.FrontendURL},
        AllowMethods:     []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))

    hasher := bcrypt.New(12)
    jwtSvc := jwt.New(cfg.JWTSecret, cfg.AccessTokenTTL)

    authSvc := auth.NewService(db, hasher)
    authHandler := auth.NewHandler(authSvc, jwtSvc)

    userSvc := user.NewService(db, hasher)
    userHandler := user.NewHandler(userSvc)

    reportSvc := report.NewService(db)
    reportHandler := report.NewHandler(reportSvc)

    api := r.Group("/api/v1")

    api.POST("/auth/login", authHandler.Login)
    api.POST("/auth/logout", authHandler.Logout)
    api.POST("/auth/forgot-password", authHandler.ForgotPassword)

    protected := api.Group("")
    protected.Use(middleware.Auth(jwtSvc))

    protected.GET("/auth/me", authHandler.Me)
    protected.POST("/auth/change-password", authHandler.ChangePassword)

    master := protected.Group("")
    master.Use(middleware.RoleGuard(user.RoleMasterAdmin))
    master.POST("/admins", userHandler.CreateAdmin)
    master.GET("/admins", userHandler.ListAdmins)
    master.PATCH("/admins/:id/reset-password", userHandler.ResetAdminPassword)

    admin := protected.Group("")
    admin.Use(middleware.RoleGuard(user.RoleAdmin))
    admin.POST("/teknisi", userHandler.CreateTeknisi)
    admin.GET("/teknisi", userHandler.ListTeknisi)
    admin.PATCH("/teknisi/:id/reset-password", userHandler.ResetTeknisiPassword)
    admin.POST("/reports", reportHandler.Create)
    admin.PATCH("/reports/:id/assign", reportHandler.Assign)

    reportsView := protected.Group("/reports")
    reportsView.Use(middleware.RoleGuard(user.RoleMasterAdmin, user.RoleAdmin))
    reportsView.GET("", reportHandler.List)

    teknisi := protected.Group("/teknisi")
    teknisi.Use(middleware.RoleGuard(user.RoleTeknisi))
    teknisi.GET("/reports", reportHandler.ListAssigned)
    teknisi.PATCH("/reports/:id/progress", reportHandler.UpdateProgress)

    r.GET("/healthz", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now()})
    })

    return r
}

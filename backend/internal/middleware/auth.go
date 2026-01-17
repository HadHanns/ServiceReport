package middleware

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/company/internal-service-report/pkg/jwt"
)

// Auth ensures request has a valid JWT stored in httpOnly cookie.
func Auth(jwtSvc *jwt.Service) gin.HandlerFunc {
    return func(c *gin.Context) {
        token, err := c.Cookie("access_token")
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        claims, err := jwtSvc.Verify(token)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        c.Set("userID", claims.UserID)
        c.Set("role", claims.Role)
        c.Next()
    }
}

// RoleGuard restricts handler to allowed roles.
func RoleGuard(roles ...string) gin.HandlerFunc {
    allowed := make(map[string]struct{}, len(roles))
    for _, r := range roles {
        allowed[r] = struct{}{}
    }
    return func(c *gin.Context) {
        role, ok := c.Get("role")
        if !ok {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
        if _, ok := allowed[role.(string)]; !ok {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
        c.Next()
    }
}

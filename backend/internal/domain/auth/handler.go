package auth

import (
	"errors"
	"net/http"

	"github.com/company/internal-service-report/pkg/jwt"
	"github.com/company/internal-service-report/pkg/response"
	"github.com/gin-gonic/gin"
)

type CookieConfig struct {
	Domain   string
	Path     string
	Secure   bool
	SameSite http.SameSite
}

type Handler struct {
	svc        *Service
	jwtSvc     *jwt.Service
	cookieConf CookieConfig
}

func NewHandler(svc *Service, jwtSvc *jwt.Service, cookieConf CookieConfig) *Handler {
	return &Handler{svc: svc, jwtSvc: jwtSvc, cookieConf: cookieConf}
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}
	user, err := h.svc.ValidateUser(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	token, err := h.jwtSvc.Generate(user.ID, user.Role.Name)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	h.setAuthCookie(c.Writer, token, int(h.jwtSvc.TTL().Seconds()))
	response.OK(c, gin.H{"user": gin.H{"id": user.ID, "name": user.FullName, "role": user.Role.Name}})
}

func (h *Handler) Logout(c *gin.Context) {
	h.clearAuthCookie(c.Writer)
	response.NoContent(c)
}

// Me returns authenticated user profile.
func (h *Handler) Me(c *gin.Context) {
	userID := c.GetUint64("userID")
	user, err := h.svc.GetUser(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	response.OK(c, gin.H{
		"id":    user.ID,
		"name":  user.FullName,
		"email": user.Email,
		"role":  user.Role.Name,
	})
}

// ChangePassword allows authenticated user to update password.
func (h *Handler) ChangePassword(c *gin.Context) {
	userID := c.GetUint64("userID")
	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}
	if req.NewPassword != req.ConfirmPassword {
		response.BadRequest(c, errors.New("password confirmation mismatch"))
		return
	}
	if err := h.svc.ChangePassword(c.Request.Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}
	response.NoContent(c)
}

// ForgotPassword returns temp password for the given email.
func (h *Handler) ForgotPassword(c *gin.Context) {
	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}
	temp, err := h.svc.ForgotPassword(c.Request.Context(), req.Email)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}
	response.OK(c, gin.H{"temporary_password": temp})
}

func (h *Handler) setAuthCookie(w http.ResponseWriter, value string, maxAge int) {
	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    value,
		Path:     h.cookieConf.Path,
		Domain:   h.cookieConf.Domain,
		HttpOnly: true,
		Secure:   h.cookieConf.Secure,
		SameSite: h.cookieConf.SameSite,
		MaxAge:   maxAge,
	}
	http.SetCookie(w, cookie)
}

func (h *Handler) clearAuthCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     h.cookieConf.Path,
		Domain:   h.cookieConf.Domain,
		HttpOnly: true,
		Secure:   h.cookieConf.Secure,
		SameSite: h.cookieConf.SameSite,
		MaxAge:   -1,
	}
	http.SetCookie(w, cookie)
}

package user

import (
    "github.com/gin-gonic/gin"

    "github.com/company/internal-service-report/pkg/response"
)

// Handler wires HTTP handlers for user operations.
type Handler struct {
    svc *Service
}

func NewHandler(svc *Service) *Handler {
    return &Handler{svc: svc}
}

func (h *Handler) CreateAdmin(c *gin.Context) {
    creatorID := c.GetUint64("userID")
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err)
        return
    }
    user, err := h.svc.CreateAdmin(c.Request.Context(), creatorID, req)
    if err != nil {
        response.InternalError(c, err)
        return
    }
    response.Created(c, gin.H{"id": user.ID, "email": user.Email})
}

func (h *Handler) ListAdmins(c *gin.Context) {
    admins, err := h.svc.ListAdmins(c.Request.Context())
    if err != nil {
        response.InternalError(c, err)
        return
    }
    response.OK(c, admins)
}

func (h *Handler) CreateTeknisi(c *gin.Context) {
    creatorID := c.GetUint64("userID")
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err)
        return
    }
    user, err := h.svc.CreateTeknisi(c.Request.Context(), creatorID, req)
    if err != nil {
        response.InternalError(c, err)
        return
    }
    response.Created(c, gin.H{"id": user.ID, "email": user.Email})
}

func (h *Handler) ListTeknisi(c *gin.Context) {
    creatorID := c.GetUint64("userID")
    teknisi, err := h.svc.ListTeknisi(c.Request.Context(), creatorID)
    if err != nil {
        response.InternalError(c, err)
        return
    }
    response.OK(c, teknisi)
}

func (h *Handler) ResetAdminPassword(c *gin.Context) {
    h.resetPassword(c)
}

func (h *Handler) ResetTeknisiPassword(c *gin.Context) {
    h.resetPassword(c)
}

func (h *Handler) resetPassword(c *gin.Context) {
    requester := c.GetUint64("userID")
    var req ResetPasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err)
        return
    }
    var path struct {
        ID uint64 `uri:"id" binding:"required"`
    }
    if err := c.ShouldBindUri(&path); err != nil {
        response.BadRequest(c, err)
        return
    }
    if err := h.svc.ResetPassword(c.Request.Context(), path.ID, req.NewPassword, requester); err != nil {
        response.InternalError(c, err)
        return
    }
    response.NoContent(c)
}

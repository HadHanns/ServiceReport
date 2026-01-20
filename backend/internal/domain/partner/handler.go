package partner

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/company/internal-service-report/pkg/response"
)

// Handler exposes partner location endpoints.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(c *gin.Context) {
	partners, err := h.svc.List(c.Request.Context())
	if err != nil {
		response.InternalError(c, err)
		return
	}
	response.OK(c, partners)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreatePartnerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}
	partner, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	response.Created(c, partner)
}

func (h *Handler) Delete(c *gin.Context) {
	var uri struct {
		ID uint64 `uri:"id" binding:"required"`
	}
	if err := c.ShouldBindUri(&uri); err != nil {
		response.BadRequest(c, err)
		return
	}
	if err := h.svc.Delete(c.Request.Context(), uri.ID); err != nil {
		if errors.Is(err, ErrPartnerNotFound) {
			response.NotFound(c, "partner not found")
			return
		}
		response.InternalError(c, err)
		return
	}
	response.NoContent(c)
}

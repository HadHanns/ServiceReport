package auth

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/company/internal-service-report/internal/domain/user"
	"github.com/company/internal-service-report/pkg/bcrypt"
	"github.com/company/internal-service-report/pkg/mailer"
	"gorm.io/gorm"
)

// Service handles authentication logic.
type Service struct {
	db     *gorm.DB
	hasher *bcrypt.Hasher
	mailer mailer.Mailer
}

func NewService(db *gorm.DB, hasher *bcrypt.Hasher, mailSvc mailer.Mailer) *Service {
	return &Service{db: db, hasher: hasher, mailer: mailSvc}
}

var ErrInvalidCredentials = errors.New("invalid credentials")

// ValidateUser checks email + password and returns user record on success.
func (s *Service) ValidateUser(ctx context.Context, email, password string) (*user.User, error) {
	var u user.User
	if err := s.db.WithContext(ctx).Preload("Role").Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if err := s.hasher.Compare(u.PasswordHash, password); err != nil {
		return nil, ErrInvalidCredentials
	}

	s.touchLastSeen(ctx, &u)
	return &u, nil
}

// GetUser returns user detail by ID.
func (s *Service) GetUser(ctx context.Context, id uint64) (*user.User, error) {
	var u user.User
	if err := s.db.WithContext(ctx).Preload("Role").First(&u, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	return &u, nil
}

// ChangePassword allows authenticated user to update their password.
func (s *Service) ChangePassword(ctx context.Context, id uint64, currentPassword, newPassword string) error {
	var u user.User
	if err := s.db.WithContext(ctx).First(&u, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidCredentials
		}
		return err
	}
	if err := s.hasher.Compare(u.PasswordHash, currentPassword); err != nil {
		return ErrInvalidCredentials
	}
	hash, err := s.hasher.Hash(newPassword)
	if err != nil {
		return err
	}
	return s.db.WithContext(ctx).Model(&user.User{}).Where("id = ?", id).Update("password_hash", hash).Error
}

// ForgotPassword resets password and returns temporary credential.
func (s *Service) ForgotPassword(ctx context.Context, email string) (string, error) {
	var u user.User
	if err := s.db.WithContext(ctx).Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrInvalidCredentials
		}
		return "", err
	}
	temp, err := generateTempPassword(12)
	if err != nil {
		return "", err
	}
	hash, err := s.hasher.Hash(temp)
	if err != nil {
		return "", err
	}
	if err := s.db.WithContext(ctx).Model(&user.User{}).Where("id = ?", u.ID).Update("password_hash", hash).Error; err != nil {
		return "", err
	}

	if s.mailer != nil {
		body := fmt.Sprintf(
			"Hello %s,\n\nA temporary password has been generated for your account.\n\nTemporary password: %s\n\nPlease sign in and change it immediately.\n",
			u.FullName, temp,
		)
		if err := s.mailer.Send(u.Email, "Temporary Password", body); err != nil {
			return "", err
		}
	}

	return temp, nil
}

func (s *Service) touchLastSeen(ctx context.Context, u *user.User) {
	now := time.Now()
	if err := s.db.WithContext(ctx).Model(&user.User{}).Where("id = ?", u.ID).Update("last_login_at", now).Error; err == nil {
		u.LastLoginAt = &now
	}
}

// TouchLastSeen updates the last_login_at field to mark user as active.
func (s *Service) TouchLastSeen(ctx context.Context, u *user.User) {
	s.touchLastSeen(ctx, u)
}

func generateTempPassword(length int) (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$%"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	var sb strings.Builder
	for _, v := range b {
		sb.WriteByte(charset[int(v)%len(charset)])
	}
	return sb.String(), nil
}

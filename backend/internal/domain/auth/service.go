package auth

import (
    "context"
    "crypto/rand"
    "errors"
    "strings"

    "github.com/company/internal-service-report/internal/domain/user"
    "github.com/company/internal-service-report/pkg/bcrypt"
    "gorm.io/gorm"
)

// Service handles authentication logic.
type Service struct {
    db     *gorm.DB
    hasher *bcrypt.Hasher
}

func NewService(db *gorm.DB, hasher *bcrypt.Hasher) *Service {
    return &Service{db: db, hasher: hasher}
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
    return temp, nil
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

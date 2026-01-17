package user

import (
    "context"
    "errors"

    "github.com/company/internal-service-report/pkg/bcrypt"
    "gorm.io/gorm"
)

var (
    ErrForbidden       = errors.New("forbidden")
    ErrNotFound        = errors.New("user not found")
    ErrInvalidRoleFlow = errors.New("role hierarchy violation")
)

// Service provides business operations for users.
type Service struct {
    db     *gorm.DB
    hasher *bcrypt.Hasher
}

func NewService(db *gorm.DB, hasher *bcrypt.Hasher) *Service {
    return &Service{db: db, hasher: hasher}
}

func (s *Service) GetByID(ctx context.Context, id uint64) (*User, error) {
    var u User
    if err := s.db.WithContext(ctx).Preload("Role").First(&u, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, ErrNotFound
        }
        return nil, err
    }
    return &u, nil
}

func (s *Service) CreateAdmin(ctx context.Context, creatorID uint64, req CreateUserRequest) (*User, error) {
    creator, err := s.GetByID(ctx, creatorID)
    if err != nil {
        return nil, err
    }
    if creator.RoleID != RoleMasterAdminID {
        return nil, ErrForbidden
    }
    return s.create(ctx, creatorID, req, RoleAdminID)
}

func (s *Service) CreateTeknisi(ctx context.Context, creatorID uint64, req CreateUserRequest) (*User, error) {
    creator, err := s.GetByID(ctx, creatorID)
    if err != nil {
        return nil, err
    }
    if creator.RoleID != RoleAdminID {
        return nil, ErrForbidden
    }
    return s.create(ctx, creatorID, req, RoleTeknisiID)
}

func (s *Service) ResetPassword(ctx context.Context, targetID uint64, newPassword string, requesterID uint64) error {
    requester, err := s.GetByID(ctx, requesterID)
    if err != nil {
        return err
    }
    target, err := s.GetByID(ctx, targetID)
    if err != nil {
        return err
    }
    if requester.RoleID == RoleAdminID && target.RoleID != RoleTeknisiID {
        return ErrInvalidRoleFlow
    }
    if requester.RoleID == RoleMasterAdminID && target.RoleID != RoleAdminID {
        return ErrInvalidRoleFlow
    }
    hash, err := s.hasher.Hash(newPassword)
    if err != nil {
        return err
    }
    return s.db.WithContext(ctx).Model(&User{}).Where("id = ?", targetID).Update("password_hash", hash).Error
}

func (s *Service) ListByRole(ctx context.Context, roleID uint8) ([]User, error) {
    var users []User
    if err := s.db.WithContext(ctx).Where("role_id = ?", roleID).Order("created_at DESC").Find(&users).Error; err != nil {
        return nil, err
    }
    return users, nil
}

func (s *Service) ListAdmins(ctx context.Context) ([]User, error) {
    return s.ListByRole(ctx, RoleAdminID)
}

func (s *Service) ListTeknisi(ctx context.Context, creatorID uint64) ([]User, error) {
    query := s.db.WithContext(ctx).Where("role_id = ?", RoleTeknisiID).Where("parent_id = ?", creatorID).Order("created_at DESC")
    var users []User
    if err := query.Find(&users).Error; err != nil {
        return nil, err
    }
    return users, nil
}

func (s *Service) create(ctx context.Context, parentID uint64, req CreateUserRequest, roleID uint8) (*User, error) {
    hash, err := s.hasher.Hash(req.Password)
    if err != nil {
        return nil, err
    }
    user := &User{
        RoleID:       roleID,
        ParentID:     &parentID,
        FullName:     req.FullName,
        Email:        req.Email,
        PasswordHash: hash,
    }
    if err := s.db.WithContext(ctx).Create(user).Error; err != nil {
        return nil, err
    }
    return user, nil
}

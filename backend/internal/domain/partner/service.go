package partner

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var ErrPartnerNotFound = errors.New("partner not found")

// Service encapsulates business logic for partner locations.
type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) List(ctx context.Context) ([]PartnerLocation, error) {
	var partners []PartnerLocation
	if err := s.db.WithContext(ctx).
		Order("province_name ASC").
		Order("hospital_name ASC").
		Find(&partners).Error; err != nil {
		return nil, err
	}
	return partners, nil
}

func (s *Service) Create(ctx context.Context, req CreatePartnerRequest) (*PartnerLocation, error) {
	partner := &PartnerLocation{
		ProvinceCode:     req.ProvinceCode,
		ProvinceName:     req.ProvinceName,
		HospitalName:     req.HospitalName,
		Address:          req.Address,
		MaintenanceCount: req.MaintenanceCount,
	}
	if err := s.db.WithContext(ctx).Create(partner).Error; err != nil {
		return nil, err
	}
	return partner, nil
}

func (s *Service) Delete(ctx context.Context, id uint64) error {
	result := s.db.WithContext(ctx).Delete(&PartnerLocation{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrPartnerNotFound
	}
	return nil
}

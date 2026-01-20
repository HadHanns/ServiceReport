package partner

import "time"

// PartnerLocation stores a partner hospital entry tied to a province.
type PartnerLocation struct {
	ID               uint64    `gorm:"primaryKey" json:"id"`
	ProvinceCode     string    `gorm:"size:10;index" json:"province_code"`
	ProvinceName     string    `gorm:"size:120" json:"province_name"`
	HospitalName     string    `gorm:"size:150" json:"hospital_name"`
	Address          string    `gorm:"size:255" json:"address"`
	MaintenanceCount int       `gorm:"default:0" json:"maintenance_count"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

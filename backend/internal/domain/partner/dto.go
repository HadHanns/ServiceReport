package partner

// CreatePartnerRequest describes payload to create a partner location entry.
type CreatePartnerRequest struct {
	ProvinceCode     string `json:"province_code" binding:"required"`
	ProvinceName     string `json:"province_name" binding:"required"`
	HospitalName     string `json:"hospital_name" binding:"required"`
	Address          string `json:"address" binding:"required"`
	MaintenanceCount int    `json:"maintenance_count" binding:"required,min=0"`
}

package report

// CustomerInfo holds customer detail section.
type CustomerInfo struct {
    Name    string `json:"name" binding:"required"`
    Address string `json:"address" binding:"required"`
    Contact string `json:"contact" binding:"required"`
}

// DeviceInfo holds device detail section.
type DeviceInfo struct {
    Name        string `json:"name" binding:"required"`
    Serial      string `json:"serial" binding:"required"`
    Location    string `json:"location" binding:"required"`
}

// CreateReportRequest payload for admin when creating new report.
type CreateReportRequest struct {
    Customer CustomerInfo `json:"customer" binding:"required,dive"`
    Device   DeviceInfo   `json:"device" binding:"required,dive"`
    Complaint string      `json:"complaint" binding:"required"`
}

// AssignRequest assigns technician to report.
type AssignRequest struct {
    TeknisiID uint64 `json:"teknisi_id" binding:"required"`
}

// ProgressRequest used by technician to update job status.
type ProgressRequest struct {
    Status      string `json:"status" binding:"required,oneof=progress done"`
    JobSummary  string `json:"job_summary" binding:"required"`
    ActionTaken string `json:"action_taken" binding:"required"`
}

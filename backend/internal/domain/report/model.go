package report

import "time"

// ServiceReport stores lifecycle for each maintenance job.
type ServiceReport struct {
    ID             uint64    `gorm:"primaryKey"`
    DispatchNo     string    `gorm:"uniqueIndex;size:32"`
    AdminID        uint64    `gorm:"index"`
    TeknisiID      *uint64   `gorm:"index"`
    CustomerName   string    `gorm:"size:120"`
    CustomerAddress string   `gorm:"size:255"`
    CustomerContact string   `gorm:"size:120"`
    DeviceName     string    `gorm:"size:100"`
    SerialNumber   string    `gorm:"size:100"`
    DeviceLocation string    `gorm:"size:120"`
    Complaint      string    `gorm:"type:text"`
    ActionTaken    string    `gorm:"type:text"`
    Status         string    `gorm:"type:enum('open','progress','done');default:'open'"`
    OpenedAt       time.Time `gorm:"autoCreateTime"`
    UpdatedAt      time.Time `gorm:"autoUpdateTime"`
    CompletedAt    *time.Time
    Photos         []ReportPhoto `gorm:"foreignKey:ReportID;constraint:OnDelete:CASCADE"`
    StatusLogs     []StatusLog   `gorm:"foreignKey:ReportID;constraint:OnDelete:CASCADE"`
}

// ReportPhoto stores uploaded media.
type ReportPhoto struct {
    ID        uint64    `gorm:"primaryKey"`
    ReportID  uint64    `gorm:"index"`
    Type      string    `gorm:"type:enum('before','after','other');default:'other'"`
    FilePath  string    `gorm:"size:255"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
}

// StatusLog tracks transitions.
type StatusLog struct {
    ID        uint64    `gorm:"primaryKey"`
    ReportID  uint64    `gorm:"index"`
    ChangedBy uint64
    From      string    `gorm:"size:32"`
    To        string    `gorm:"size:32"`
    Note      string    `gorm:"type:text"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
}

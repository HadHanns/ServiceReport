package user

// CreateUserRequest holds payload for creating new accounts.
type CreateUserRequest struct {
    FullName string `json:"full_name" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}

// ResetPasswordRequest for resetting credentials.
type ResetPasswordRequest struct {
    NewPassword string `json:"new_password" binding:"required,min=8"`
}

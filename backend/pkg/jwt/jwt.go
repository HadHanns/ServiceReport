package jwt

import (
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

// Claims represents JWT payload.
type Claims struct {
    UserID uint64 `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// Service issues and validates JWT tokens.
type Service struct {
    secret []byte
    ttl    time.Duration
}

func New(secret string, ttl time.Duration) *Service {
    return &Service{secret: []byte(secret), ttl: ttl}
}

func (s *Service) TTL() time.Duration {
    return s.ttl
}

func (s *Service) Generate(userID uint64, role string) (string, error) {
    claims := &Claims{
        UserID: userID,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.ttl)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(s.secret)
}

func (s *Service) Verify(token string) (*Claims, error) {
    parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return s.secret, nil
    })
    if err != nil {
        return nil, err
    }
    claims, ok := parsed.Claims.(*Claims)
    if !ok || !parsed.Valid {
        return nil, errors.New("invalid token")
    }
    return claims, nil
}

package bcrypt

import "golang.org/x/crypto/bcrypt"

// Hasher provides helpers to hash and verify passwords.
type Hasher struct {
    cost int
}

func New(cost int) *Hasher {
    if cost == 0 {
        cost = bcrypt.DefaultCost
    }
    return &Hasher{cost: cost}
}

func (h *Hasher) Hash(plain string) (string, error) {
    hashed, err := bcrypt.GenerateFromPassword([]byte(plain), h.cost)
    if err != nil {
        return "", err
    }
    return string(hashed), nil
}

func (h *Hasher) Compare(hash, plain string) error {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}

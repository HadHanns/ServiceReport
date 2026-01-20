package passwordutil

import (
	"crypto/rand"
)

const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$%"

// GenerateTempPassword returns a random password with the given length using a restricted charset.
func GenerateTempPassword(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	result := make([]byte, length)
	for i, v := range b {
		result[i] = charset[int(v)%len(charset)]
	}
	return string(result), nil
}

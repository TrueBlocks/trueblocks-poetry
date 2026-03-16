package validator

import (
	"fmt"
	"strings"

	"github.com/TrueBlocks/trueblocks-poetry/v2/internal/db"
)

// ValidateID checks if an ID is positive
func ValidateID(id int) error {
	if id <= 0 {
		return fmt.Errorf("invalid ID: %d (must be positive)", id)
	}
	return nil
}

// ValidateLinkType checks if the link type is valid
func ValidateLinkType(linkType string) error {
	if strings.TrimSpace(linkType) == "" {
		return fmt.Errorf("link type cannot be empty")
	}
	return nil
}

// ValidateEntity checks if an entity has required fields
func ValidateEntity(entity db.Entity) error {
	if strings.TrimSpace(entity.PrimaryLabel) == "" {
		return fmt.Errorf("entity primary label cannot be empty")
	}
	if strings.TrimSpace(entity.TypeSlug) == "" {
		return fmt.Errorf("entity type slug cannot be empty")
	}
	// Length checks could be added here, e.g. max 255 chars for PrimaryLabel
	if len(entity.PrimaryLabel) > 255 {
		return fmt.Errorf("entity primary label too long (max 255 characters)")
	}
	return nil
}

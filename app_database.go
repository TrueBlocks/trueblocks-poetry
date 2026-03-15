package main

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/TrueBlocks/trueblocks-poetry/backend/database"
	"github.com/TrueBlocks/trueblocks-poetry/backend/services"
	"github.com/TrueBlocks/trueblocks-poetry/pkg/constants"
)

// CheckpointDatabase flushes WAL to main database file
func (a *App) CheckpointDatabase() error {
	// slog.Info("[App] Checkpointing database WAL")
	return a.db.Checkpoint()
}

// CleanOrphanedLinks removes links pointing to non-existent items
func (a *App) CleanOrphanedLinks() (int, error) {
	// slog.Info("[App] Cleaning orphaned links")
	return a.db.CleanOrphanedLinks()
}

// GetStats returns statistics about the database
func (a *App) GetStats() (map[string]int, error) {
	return a.db.GetStats()
}

// GetDatabaseFileSize returns the size of the database file in bytes
func (a *App) GetDatabaseFileSize() (int64, error) {
	dbPath, err := constants.GetDatabasePath()
	if err != nil {
		return 0, fmt.Errorf("failed to get database path: %w", err)
	}

	fileInfo, err := os.Stat(dbPath)
	if err != nil {
		return 0, fmt.Errorf("failed to get file info: %w", err)
	}

	return fileInfo.Size(), nil
}

// GetAllRelationships gets all relationships for export
func (a *App) GetAllRelationships() ([]database.Relationship, error) {
	return a.entityService.GetAllRelationships()
}

// GetEgoGraph gets the ego graph for a given node
func (a *App) GetEgoGraph(centerNodeID int, depth int) (*services.GraphData, error) {
	return a.entityService.GetEgoGraph(centerNodeID)
}

// GetAllGraphData gets the full graph
func (a *App) GetAllGraphData() (*services.GraphData, error) {
	return a.entityService.GetAllGraphData()
}

// GetEnvVars returns all environment variables from .env file
func (a *App) GetEnvVars() map[string]string {
	envVars := make(map[string]string)

	// Try to read from current directory first, then fallback to ~/.poetry-app
	cwd, err := os.Getwd()
	if err != nil {
		slog.Error("Failed to get working directory", "error", err)
		return envVars
	}

	envPath := cwd + "/.env"
	data, err := os.ReadFile(envPath)
	if err != nil {
		// Try fallback location
		fallbackPath, err := constants.GetEnvPath()
		if err == nil {
			data, err = os.ReadFile(fallbackPath)
			if err != nil {
				slog.Info("No .env file found", "path1", envPath, "path2", fallbackPath)
				return envVars
			}
			// envPath = fallbackPath
		} else {
			slog.Info("No .env file found", "path", envPath)
			return envVars
		}
	}

	// Sensitive key patterns to filter out
	sensitivePatterns := []string{
		"KEY", "SECRET", "TOKEN", "PASSWORD", "PASS", "AUTH", "CREDENTIAL",
	}

	// Parse .env file
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		// Split on first = sign
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])

			// Check if key contains sensitive patterns
			keyUpper := strings.ToUpper(key)
			isSensitive := false
			for _, pattern := range sensitivePatterns {
				if strings.Contains(keyUpper, pattern) {
					isSensitive = true
					break
				}
			}

			// Only include non-sensitive values, mask sensitive ones
			if isSensitive {
				if value != "" {
					envVars[key] = "***REDACTED***"
				}
			} else {
				// Remove quotes if present
				value = strings.Trim(value, "\"'")
				envVars[key] = value
			}
		}
	}

	return envVars
}

// SaveEnvVar saves an environment variable to the .env file
func (a *App) SaveEnvVar(key, value string) error {
	// Determine .env path (prioritize ~/.local/share/trueblocks/poetry/.env)
	envPath, err := constants.GetEnvPath()
	if err != nil {
		return fmt.Errorf("failed to get env path: %w", err)
	}

	// Read existing file
	content := ""
	if data, err := os.ReadFile(envPath); err == nil {
		content = string(data)
	}

	// Normalize content
	content = strings.TrimSpace(content)

	var lines []string
	if content != "" {
		lines = strings.Split(content, "\n")
	}

	found := false
	var newLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, key+"=") {
			newLines = append(newLines, fmt.Sprintf("%s=%s", key, value))
			found = true
		} else {
			newLines = append(newLines, line)
		}
	}

	if !found {
		newLines = append(newLines, fmt.Sprintf("%s=%s", key, value))
	}

	// Write back to file
	output := strings.Join(newLines, "\n") + "\n"
	// Ensure directory exists
	dir := filepath.Dir(envPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	if err := os.WriteFile(envPath, []byte(output), 0600); err != nil {
		return fmt.Errorf("failed to write .env file: %w", err)
	}

	// Update in-memory environment variable so changes take effect immediately
	if err := os.Setenv(key, value); err != nil {
		slog.Warn("Failed to update in-memory environment variable", "error", err)
	}

	return nil
}

// HasEnvFile checks if the .env file exists
func (a *App) HasEnvFile() bool {
	envPath, err := constants.GetEnvPath()
	if err != nil {
		return false
	}
	_, err = os.Stat(envPath)
	return err == nil
}

// SkipAiSetup creates the .env file with a marker if it doesn't exist
func (a *App) SkipAiSetup() error {
	envPath, err := constants.GetEnvPath()
	if err != nil {
		return fmt.Errorf("failed to get env path: %w", err)
	}

	// Check if file already exists
	if _, err := os.Stat(envPath); err == nil {
		return nil
	}

	// Ensure directory exists
	dir := filepath.Dir(envPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Create file with a comment
	content := "# AI Setup Skipped\n"
	if err := os.WriteFile(envPath, []byte(content), 0600); err != nil {
		return fmt.Errorf("failed to write .env file: %w", err)
	}

	return nil
}

// GetEnvLocation returns the path to the .env file being used
func (a *App) GetEnvLocation() string {
	cwd, err := os.Getwd()
	if err != nil {
		return "Unknown (failed to get working directory)"
	}

	envPath := cwd + "/.env"
	if _, err := os.Stat(envPath); err == nil {
		return envPath
	}

	// Check fallback location
	fallbackPath, err := constants.GetEnvPath()
	if err == nil {
		if _, err := os.Stat(fallbackPath); err == nil {
			return fallbackPath
		}
	}

	return "No .env file found"
}

package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/TrueBlocks/trueblocks-poetry/backend/components"
	"github.com/TrueBlocks/trueblocks-poetry/backend/database"
	"github.com/TrueBlocks/trueblocks-poetry/backend/services"
	"github.com/TrueBlocks/trueblocks-poetry/backend/settings"
	"github.com/TrueBlocks/trueblocks-poetry/pkg/parser"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx           context.Context
	db            *database.DB
	settings      *settings.Manager
	adhoc         *components.AdHocQueryComponent
	ttsService    *services.TTSService
	imageService  *services.ImageService
	entityService *services.EntityService
}

// TTSResult is the return type for SpeakWord
// Deprecated: Use services.TTSResult instead
type TTSResult = services.TTSResult

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Set window position from saved settings
	// Settings are initialized in main.go
	if a.settings != nil {
		savedSettings := a.settings.Get()
		runtime.WindowSetPosition(ctx, savedSettings.Window.X, savedSettings.Window.Y)
		slog.Info("Set window position", "x", savedSettings.Window.X, "y", savedSettings.Window.Y)
	}

	// Show window after positioning
	runtime.WindowShow(ctx)

	// Sync file flags on startup (runMigration4 already does this once)
	if err := a.db.SyncFileFlags(); err != nil {
		slog.Warn("Failed to sync file flags", "error", err)
	}
}

// Capabilities defines what features are available based on configuration
type Capabilities struct {
	HasTTS    bool `json:"hasTts"`
	HasImages bool `json:"hasImages"`
	HasAI     bool `json:"hasAi"`
}

// GetCapabilities returns the available features of the application
func (a *App) GetCapabilities() *Capabilities {
	return &Capabilities{
		HasTTS:    os.Getenv("OPENAI_API_KEY") != "",
		HasImages: true, // Always available
		HasAI:     os.Getenv("OPENAI_API_KEY") != "",
	}
}

// RunAdHocQuery executes a raw SQL query
func (a *App) RunAdHocQuery(query string) ([]map[string]interface{}, error) {
	return a.adhoc.RunAdHocQuery(query)
}

// GetConstants returns shared constants to the frontend
func (a *App) GetConstants() map[string]string {
	return map[string]string{
		"ReferenceTagPattern": parser.ReferenceTagPattern,
		"GenericTagPattern":   parser.GenericTagPattern,
	}
}

// GetReferencePattern returns the regex pattern for reference tags
func (a *App) GetReferencePattern() string {
	return parser.GetReferencePattern()
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Close database connection and checkpoint WAL
	if a.db != nil {
		if err := a.db.Close(); err != nil {
			slog.Error("Failed to close database during shutdown", "error", err)
		}
	}
}

// SaveEntityImage saves an image for an entity to the cache
func (a *App) SaveEntityImage(entityId int, imageData string) error {
	return a.imageService.SaveEntityImage(entityId, imageData)
}

// GetEntityImage retrieves an image for an entity from the cache
func (a *App) GetEntityImage(entityId int) (string, error) {
	return a.imageService.GetEntityImage(entityId)
}

// DeleteEntityImage removes an image for an entity from the cache
func (a *App) DeleteEntityImage(entityId int) error {
	return a.imageService.DeleteEntityImage(entityId)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

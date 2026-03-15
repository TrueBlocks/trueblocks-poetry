package main

import (
	"embed"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/TrueBlocks/trueblocks-poetry/backend/components"
	"github.com/TrueBlocks/trueblocks-poetry/backend/database"
	"github.com/TrueBlocks/trueblocks-poetry/backend/seeding"
	"github.com/TrueBlocks/trueblocks-poetry/backend/services"
	"github.com/TrueBlocks/trueblocks-poetry/backend/settings"
	"github.com/TrueBlocks/trueblocks-poetry/pkg/constants"
	applogger "github.com/TrueBlocks/trueblocks-poetry/pkg/logger"

	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Initialize logger
	if err := applogger.InitLogger(); err != nil {
		println("Failed to initialize logger:", err.Error())
	}

	// Load .env file from current working directory, or fallback to ~/.poetry-app
	cwd, _ := os.Getwd()
	envPath := cwd + "/.env"

	// Try loading from current directory first
	if err := godotenv.Load(envPath); err != nil {
		slog.Info("No .env at path, trying fallback location...", "path", envPath)
		// If not found in current directory, try config folder
		fallbackPath, err := constants.GetEnvPath()
		if err != nil {
			slog.Error("Could not determine config directory", "error", err)
		} else {
			slog.Info("Checking for .env at", "path", fallbackPath)

			// Check if file exists
			if _, err := os.Stat(fallbackPath); err == nil {
				slog.Info("File exists, attempting to load...", "path", fallbackPath)
				if err := godotenv.Load(fallbackPath); err != nil {
					slog.Error("ERROR loading .env", "path", fallbackPath, "error", err)
				} else {
					slog.Info("Successfully loaded .env file", "path", fallbackPath)
				}
			} else {
				slog.Info("No .env file found (this is okay if not needed)", "path1", envPath, "path2", fallbackPath)
			}
		}
	} else {
		slog.Info("Loaded .env file", "path", envPath)
	}

	// Initialize settings
	settingsMgr, err := settings.NewManager()
	if err != nil {
		slog.Error("Failed to initialize settings", "error", err)
		os.Exit(1)
	}

	// Determine database path from constants
	dbPath, err := constants.GetDatabasePath()
	if err != nil {
		slog.Error("Failed to get database path", "error", err)
		os.Exit(1)
	}

	slog.Info("Database path", "path", dbPath)

	// Ensure data is seeded before opening database
	if err := seeding.EnsureDataSeeded(filepath.Dir(dbPath)); err != nil {
		slog.Warn("Failed to seed data", "error", err)
	}

	// Initialize database
	db, err := database.NewDB(dbPath)
	if err != nil {
		slog.Error("Failed to initialize database", "error", err)
		os.Exit(1)
	}

	// Initialize services
	adhoc := components.NewAdHocQueryComponent(db)
	ttsService := services.NewTTSService(db)
	imageService := services.NewImageService(db)
	entityService := services.NewEntityService(db)

	// Create an instance of the app structure
	app := NewApp()
	app.db = db
	app.settings = settingsMgr
	app.adhoc = adhoc
	app.ttsService = ttsService
	app.imageService = imageService
	app.entityService = entityService

	// Load settings to get window position
	savedSettings := settingsMgr.Get()

	// Use defaults if values are zero
	width := savedSettings.Window.Width
	if width <= 0 {
		width = 1024
	}
	height := savedSettings.Window.Height
	if height <= 0 {
		height = 768
	}

	// Create application with options
	err = wails.Run(&options.App{
		Width:       width,
		Height:      height,
		StartHidden: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
			entityService,
			ttsService,
			imageService,
		},
		LogLevel: logger.DEBUG,
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

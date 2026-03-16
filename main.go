package main

import (
	"embed"
	"log"

	appkit "github.com/TrueBlocks/trueblocks-art/packages/appkit/v2"
	"github.com/TrueBlocks/trueblocks-poetry/v2/app"
	"github.com/wailsapp/wails/v2/pkg/options"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	application := app.NewApp()

	err := appkit.Run(appkit.AppConfig{
		Title:            "Poetry",
		Assets:           assets,
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        application.Startup,
		OnShutdown:       application.Shutdown,
		GetWindowGeometry: application.GetWindowGeometry,
		Bind: []interface{}{
			application,
			application.EntityService(),
			application.TTSService(),
			application.ImageService(),
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}

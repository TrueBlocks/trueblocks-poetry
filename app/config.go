package app

import (
	"github.com/TrueBlocks/trueblocks-poetry/v2/internal/config"
)

func (a *App) GetAppConfigContent() (string, error) {
	return config.GetConfigContent()
}

func (a *App) SaveAppConfigContent(content string) error {
	return config.SaveConfig(content)
}

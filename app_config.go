package main

import (
	"github.com/TrueBlocks/trueblocks-poetry/backend/config"
)

// GetAppConfigContent returns the raw JSON content of the config file
func (a *App) GetAppConfigContent() (string, error) {
	return config.GetConfigContent()
}

// SaveAppConfigContent saves the raw JSON content to the config file
func (a *App) SaveAppConfigContent(content string) error {
	return config.SaveConfig(content)
}

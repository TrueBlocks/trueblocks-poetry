package app

import "github.com/TrueBlocks/trueblocks-poetry/v2/internal/services"

func (a *App) SpeakWord(text string, itemType string, itemWord string, itemID int) services.TTSResult {
	return a.ttsService.SpeakWord(text, itemType, itemWord, itemID)
}

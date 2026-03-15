package main

import "github.com/TrueBlocks/trueblocks-poetry/backend/services"

// SpeakWord uses OpenAI's text-to-speech API to pronounce text
func (a *App) SpeakWord(text string, itemType string, itemWord string, itemID int) services.TTSResult {
	return a.ttsService.SpeakWord(text, itemType, itemWord, itemID)
}

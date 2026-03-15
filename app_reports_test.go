package main

import (
	"testing"

	"github.com/TrueBlocks/trueblocks-poetry/backend/database"
)

func TestStripPossessive(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Shakespeare's", "Shakespeare"},
		{"Burns'", "Burns"},
		{"Keats's", "Keats"},
		{"Wordsworth", "Wordsworth"},
		{"Browning’s", "Browning"}, // Curly quote
		{"Yeats’", "Yeats"},        // Curly quote (trailing)
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := database.StripPossessive(tt.input)
			if got != tt.expected {
				t.Errorf("StripPossessive(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

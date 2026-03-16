package app

import (
	"testing"

	"github.com/TrueBlocks/trueblocks-poetry/v2/internal/db"
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
		{"Browning\u2019s", "Browning"},
		{"Yeats\u2019", "Yeats"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := db.StripPossessive(tt.input)
			if got != tt.expected {
				t.Errorf("StripPossessive(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

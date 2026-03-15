package database

import (
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestStripPossessiveRegularApostrophe(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Shakespeare's", "Shakespeare"},
		{"Keats's", "Keats"},
		{"Burns'", "Burns"},
		{"James'", "James"},
		{"Dickens", "Dickens"},
		{"", ""},
	}

	for _, tt := range tests {
		result := StripPossessive(tt.input)
		if result != tt.expected {
			t.Errorf("StripPossessive(%q) = %q; want %q", tt.input, result, tt.expected)
		}
	}
}

func TestStripPossessiveCurlyApostrophe(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Shakespeare\u2019s", "Shakespeare"},
		{"Keats\u2019s", "Keats"},
		{"Burns\u2019", "Burns"},
		{"James\u2019", "James"},
	}

	for _, tt := range tests {
		result := StripPossessive(tt.input)
		if result != tt.expected {
			t.Errorf("StripPossessive(%q) = %q; want %q", tt.input, result, tt.expected)
		}
	}
}

-- Poetry Database Schema
-- SQLite database for literary reference system (Generic Entity Architecture)

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Entities table (generic storage for all types)
CREATE TABLE entities (
    id INTEGER PRIMARY KEY,
    type_slug TEXT NOT NULL, -- 'reference', 'writer', 'title', 'cliche', 'name', 'term'
    primary_label TEXT NOT NULL, -- word, name, phrase, term
    secondary_label TEXT, -- optional
    description TEXT, -- definition, description
    attributes JSON, -- flexible storage for type-specific fields (derivation, appendicies, source, gender, etc.)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relationships table (generic links between entities)
CREATE TABLE relationships (
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    label TEXT NOT NULL, -- 'related', 'author_of', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- User preferences/settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search table
CREATE VIRTUAL TABLE entities_fts USING fts5(
    primary_label,
    secondary_label,
    description,
    attributes,
    content=entities,
    content_rowid=id
);

-- Triggers to keep FTS table in sync with entities
CREATE TRIGGER entities_ai AFTER INSERT ON entities BEGIN
    INSERT INTO entities_fts(rowid, primary_label, secondary_label, description, attributes)
    VALUES (new.id, new.primary_label, new.secondary_label, new.description, new.attributes);
END;

CREATE TRIGGER entities_ad AFTER DELETE ON entities BEGIN
    DELETE FROM entities_fts WHERE rowid = old.id;
END;

CREATE TRIGGER entities_au AFTER UPDATE ON entities BEGIN
    UPDATE entities_fts SET
        primary_label = new.primary_label,
        secondary_label = new.secondary_label,
        description = new.description,
        attributes = new.attributes
    WHERE rowid = new.id;
END;

-- Indexes for performance
CREATE INDEX idx_entities_type ON entities(type_slug);
CREATE INDEX idx_entities_label ON entities(primary_label COLLATE NOCASE);
CREATE INDEX idx_entities_updated ON entities(updated_at DESC);

-- Relationship indexes
CREATE INDEX idx_relationships_source ON relationships(source_id, created_at DESC);
CREATE INDEX idx_relationships_target ON relationships(target_id, created_at DESC);
CREATE INDEX idx_relationships_label ON relationships(label);

-- JSON extraction indexes (SQLite 3.38+)
-- These speed up queries on specific JSON fields
CREATE INDEX idx_entities_source ON entities(json_extract(attributes, '$.source'));
CREATE INDEX idx_entities_has_image ON entities(json_extract(attributes, '$.has_image'));
CREATE INDEX idx_entities_has_tts ON entities(json_extract(attributes, '$.has_tts'));

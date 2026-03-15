package services

import "github.com/TrueBlocks/trueblocks-poetry/backend/database"

// UnlinkedReferenceDetail represents a single unlinked reference within an entity
type UnlinkedReferenceDetail struct {
	Ref    string `json:"ref"`
	Reason string `json:"reason"`
}

// UnlinkedReferenceResult represents an entity with unlinked references
type UnlinkedReferenceResult struct {
	ID           int                       `json:"id"`
	PrimaryLabel string                    `json:"primaryLabel"`
	TypeSlug     string                    `json:"typeSlug"`
	UnlinkedRefs []UnlinkedReferenceDetail `json:"unlinkedRefs"`
	RefCount     int                       `json:"refCount"`
}

// DuplicateEntityDetail represents a simplified entity structure for duplicate reports
type DuplicateEntityDetail struct {
	ID           int    `json:"id"`
	PrimaryLabel string `json:"primaryLabel"`
	TypeSlug     string `json:"typeSlug"`
}

// DuplicateEntityResult represents a group of duplicate entities
type DuplicateEntityResult struct {
	StrippedLabel string                  `json:"strippedLabel"`
	Original      DuplicateEntityDetail   `json:"original"`
	Duplicates    []DuplicateEntityDetail `json:"duplicates"`
	Count         int                     `json:"count"`
}

// DanglingRelationshipResult represents a relationship that points to a non-existent entity
type DanglingRelationshipResult struct {
	RelationshipID int    `json:"relationshipId"`
	SourceID       int    `json:"sourceId"`
	TargetID       int    `json:"targetId"`
	Label          string `json:"label"`
	SourceLabel    string `json:"sourceLabel"`
	SourceType     string `json:"sourceType"`
	MissingSide    string `json:"missingSide"` // "source" or "target"
}

// SelfReferenceResult represents an entity that references itself
type SelfReferenceResult struct {
	ID           int    `json:"id"`
	PrimaryLabel string `json:"primaryLabel"`
	TypeSlug     string `json:"typeSlug"`
	Tag          string `json:"tag"`
}

// OrphanedEntityResult represents an entity with no relationships
type OrphanedEntityResult struct {
	ID           int    `json:"id"`
	PrimaryLabel string `json:"primaryLabel"`
	TypeSlug     string `json:"typeSlug"`
}

// MissingReferenceDetail represents a missing reference with its relationship ID
type MissingReferenceDetail struct {
	Label          string `json:"label"`
	RelationshipID int    `json:"relationshipId"`
}

// LinkedEntityNotInDescriptionResult represents an entity that has relationships not present in its description
type LinkedEntityNotInDescriptionResult struct {
	ID                int                      `json:"id"`
	PrimaryLabel      string                   `json:"primaryLabel"`
	TypeSlug          string                   `json:"typeSlug"`
	MissingReferences []MissingReferenceDetail `json:"missingReferences"`
}

// EntityWithoutDescriptionResult represents an entity missing a description
type EntityWithoutDescriptionResult struct {
	ID                      int    `json:"id"`
	PrimaryLabel            string `json:"primaryLabel"`
	TypeSlug                string `json:"typeSlug"`
	HasMissingData          bool   `json:"hasMissingData"`
	SingleIncomingLinkID    int    `json:"singleIncomingLinkId,omitempty"`
	SingleIncomingLinkLabel string `json:"singleIncomingLinkLabel,omitempty"`
}

// EntityWithUnknownTypeResult represents an entity with a non-standard type
type EntityWithUnknownTypeResult struct {
	ID                      int    `json:"id"`
	PrimaryLabel            string `json:"primaryLabel"`
	TypeSlug                string `json:"typeSlug"`
	IncomingLinkCount       int    `json:"incomingLinkCount"`
	SingleIncomingLinkID    int    `json:"singleIncomingLinkId,omitempty"`
	SingleIncomingLinkLabel string `json:"singleIncomingLinkLabel,omitempty"`
}

// UnknownTagResult represents an entity containing unknown tags
type UnknownTagResult struct {
	ID           int      `json:"id"`
	PrimaryLabel string   `json:"primaryLabel"`
	TypeSlug     string   `json:"typeSlug"`
	UnknownTags  []string `json:"unknownTags"`
	TagCount     int      `json:"tagCount"`
}

// RelationshipDetail represents a relationship with details about the related entity
type RelationshipDetail struct {
	ID               int    `json:"id"`
	SourceID         int    `json:"sourceId"`
	TargetID         int    `json:"targetId"`
	Label            string `json:"label"`
	OtherEntityID    int    `json:"otherEntityId"`
	OtherEntityLabel string `json:"otherEntityLabel"`
	OtherEntityType  string `json:"otherEntityType"`
}

// GraphData represents the nodes and edges for a graph visualization
type GraphData struct {
	Nodes []database.Entity       `json:"nodes"`
	Edges []database.Relationship `json:"edges"`
}

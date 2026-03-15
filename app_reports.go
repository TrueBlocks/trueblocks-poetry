package main

import (
	"fmt"
	"sort"
	"strings"

	"github.com/TrueBlocks/trueblocks-poetry/backend/database"
	"github.com/TrueBlocks/trueblocks-poetry/backend/services"
	"github.com/TrueBlocks/trueblocks-poetry/pkg/parser"
)

func (a *App) GetUnlinkedReferences() ([]services.UnlinkedReferenceResult, error) {
	// Get all entities
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, fmt.Errorf("failed to get entities: %w", err)
	}

	// Get all relationships
	allRelationships, err := a.entityService.GetAllRelationships()
	if err != nil {
		return nil, fmt.Errorf("failed to get relationships: %w", err)
	}

	// Create a map of entity labels for quick lookup
	entitiesByLabel := make(map[string]*database.Entity)
	for i := range allEntities {
		entitiesByLabel[strings.ToLower(allEntities[i].PrimaryLabel)] = &allEntities[i]
	}

	// Create a map of relationships for quick lookup
	relationshipsMap := make(map[int]map[int]bool) // sourceId -> map[targetId]bool
	for _, rel := range allRelationships {
		if relationshipsMap[rel.SourceID] == nil {
			relationshipsMap[rel.SourceID] = make(map[int]bool)
		}
		relationshipsMap[rel.SourceID][rel.TargetID] = true
	}

	// Analyze each entity for unlinked references
	var results []services.UnlinkedReferenceResult

	for i := range allEntities {
		entity := &allEntities[i]
		if entity.Description == nil || *entity.Description == "" {
			continue
		}

		// Find all {word:}, {writer:}, {title:} references in description
		unlinkedRefs := []services.UnlinkedReferenceDetail{}

		// Use centralized parser
		refs := parser.ParseReferences(*entity.Description)
		for _, ref := range refs {
			refType := ref.Type
			refWord := ref.Value

			// Strip possessive 's or s' from writer references
			matchWord := refWord
			if refType == "writer" {
				lowerWord := strings.ToLower(refWord)
				if strings.HasSuffix(lowerWord, "'s") {
					matchWord = refWord[:len(refWord)-2]
				} else if strings.HasSuffix(lowerWord, "s'") {
					matchWord = refWord[:len(refWord)-1]
				}
			}

			// Check if this reference exists in entities
			matchedEntity := entitiesByLabel[strings.ToLower(matchWord)]
			if matchedEntity == nil {
				// Entity doesn't exist
				unlinkedRefs = append(unlinkedRefs, services.UnlinkedReferenceDetail{
					Ref:    refWord,
					Reason: "missing",
				})
			} else {
				// Entity exists, check if it's linked
				if relationshipsMap[entity.ID] == nil || !relationshipsMap[entity.ID][matchedEntity.ID] {
					unlinkedRefs = append(unlinkedRefs, services.UnlinkedReferenceDetail{
						Ref:    refWord,
						Reason: "unlinked",
					})
				}
			}
		}

		if len(unlinkedRefs) > 0 {
			results = append(results, services.UnlinkedReferenceResult{
				ID:           entity.ID,
				PrimaryLabel: entity.PrimaryLabel,
				TypeSlug:     entity.TypeSlug,
				UnlinkedRefs: unlinkedRefs,
				RefCount:     len(unlinkedRefs),
			})
		}
	}

	return results, nil
}

// GetAllSources returns all sources
func (a *App) GetAllSources() ([]database.Source, error) {
	return a.db.GetAllSources()
}

// GetDuplicateEntities returns a report of entities with duplicate stripped labels
func (a *App) GetDuplicateEntities() ([]services.DuplicateEntityResult, error) {
	// Get all entities
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, fmt.Errorf("failed to get entities: %w", err)
	}

	// Group entities by stripped label (case-insensitive)
	groups := make(map[string][]database.Entity)
	for _, entity := range allEntities {
		stripped := strings.ToLower(database.StripPossessive(entity.PrimaryLabel))
		groups[stripped] = append(groups[stripped], entity)
	}

	// Find groups with more than one entity
	var results []services.DuplicateEntityResult
	for strippedLabel, entities := range groups {
		if len(entities) > 1 {
			// Sort entities by ID to have consistent ordering
			sort.Slice(entities, func(i, j int) bool {
				return entities[i].ID < entities[j].ID
			})

			// First entity is the "original", rest are duplicates
			original := entities[0]
			duplicates := entities[1:]

			duplicateInfo := []services.DuplicateEntityDetail{}
			for _, dup := range duplicates {
				duplicateInfo = append(duplicateInfo, services.DuplicateEntityDetail{
					ID:           dup.ID,
					PrimaryLabel: dup.PrimaryLabel,
					TypeSlug:     dup.TypeSlug,
				})
			}

			results = append(results, services.DuplicateEntityResult{
				StrippedLabel: strippedLabel,
				Original: services.DuplicateEntityDetail{
					ID:           original.ID,
					PrimaryLabel: original.PrimaryLabel,
					TypeSlug:     original.TypeSlug,
				},
				Duplicates: duplicateInfo,
				Count:      len(duplicates),
			})
		}
	}

	return results, nil
}

// MergeDuplicateEntities merges duplicate entities into an original entity
func (a *App) MergeDuplicateEntities(originalID int, duplicateIDs []int) error {
	for _, dupID := range duplicateIDs {
		// Move links pointing to duplicate -> original
		if err := a.db.UpdateLinksDestination(dupID, originalID); err != nil {
			return fmt.Errorf("failed to update link destinations for %d: %w", dupID, err)
		}
		// Move links originating from duplicate -> original
		if err := a.db.UpdateLinksSource(dupID, originalID); err != nil {
			return fmt.Errorf("failed to update link sources for %d: %w", dupID, err)
		}
		// Delete the duplicate entity
		if err := a.db.DeleteEntity(dupID); err != nil {
			return fmt.Errorf("failed to delete duplicate entity %d: %w", dupID, err)
		}
	}
	return nil
}

func (a *App) GetSelfReferentialEntities() ([]services.SelfReferenceResult, error) {
	// Get all entities
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, fmt.Errorf("failed to get entities: %w", err)
	}

	var results []services.SelfReferenceResult

	for _, entity := range allEntities {
		if entity.Description == nil || *entity.Description == "" {
			continue
		}

		// Determine tag prefix
		var prefix string
		switch entity.TypeSlug {
		case "title":
			prefix = "title"
		case "writer":
			prefix = "writer"
		case "reference":
			prefix = "word"
		default:
			continue
		}

		// Construct regex pattern: \{prefix:\s*word\}
		re, err := parser.GetSpecificReferenceRegex(prefix, entity.PrimaryLabel)
		if err != nil {
			continue
		}

		// Check description
		if re.MatchString(*entity.Description) {
			results = append(results, services.SelfReferenceResult{
				ID:           entity.ID,
				PrimaryLabel: entity.PrimaryLabel,
				TypeSlug:     entity.TypeSlug,
				Tag:          fmt.Sprintf("{%s: %s}", prefix, entity.PrimaryLabel),
			})
		}
	}
	return results, nil
}

// GetOrphanedEntities returns entities with no incoming or outgoing relationships
func (a *App) GetOrphanedEntities() ([]services.OrphanedEntityResult, error) {
	// Get all entities
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, fmt.Errorf("failed to get entities: %w", err)
	}

	// Get all relationships
	allRelationships, err := a.entityService.GetAllRelationships()
	if err != nil {
		return nil, fmt.Errorf("failed to get relationships: %w", err)
	}

	// Create a set of entity IDs that have relationships
	connectedEntities := make(map[int]bool)
	for _, rel := range allRelationships {
		connectedEntities[rel.SourceID] = true
		connectedEntities[rel.TargetID] = true
	}

	// Find entities without any relationships
	var results []services.OrphanedEntityResult
	for _, entity := range allEntities {
		if !connectedEntities[entity.ID] {
			results = append(results, services.OrphanedEntityResult{
				ID:           entity.ID,
				PrimaryLabel: entity.PrimaryLabel,
				TypeSlug:     entity.TypeSlug,
			})
		}
	}

	return results, nil
}

// GetLinkedEntitiesNotInDescription returns entities that have relationships but those linked entities aren't referenced in the description
func (a *App) GetLinkedEntitiesNotInDescription() ([]services.LinkedEntityNotInDescriptionResult, error) {
	// Get all entities
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, fmt.Errorf("failed to get entities: %w", err)
	}

	// Get all relationships
	allRelationships, err := a.entityService.GetAllRelationships()
	if err != nil {
		return nil, fmt.Errorf("failed to get relationships: %w", err)
	}

	// Build map of entity ID -> list of linked entity labels with relationship IDs
	type linkInfo struct {
		Label string
		RelID int
	}
	linkedLabels := make(map[int][]linkInfo)
	entitiesByID := make(map[int]database.Entity)
	for _, e := range allEntities {
		entitiesByID[e.ID] = e
	}

	for _, rel := range allRelationships {
		if target, ok := entitiesByID[rel.TargetID]; ok {
			linkedLabels[rel.SourceID] = append(linkedLabels[rel.SourceID], linkInfo{target.PrimaryLabel, rel.ID})
		}
	}

	var results []services.LinkedEntityNotInDescriptionResult

	for _, entity := range allEntities {
		if entity.Description == nil || *entity.Description == "" {
			continue
		}

		labels, hasLinks := linkedLabels[entity.ID]
		if !hasLinks {
			continue
		}

		description := strings.ToLower(*entity.Description)

		// Also check derivation and appendicies
		if val, ok := entity.Attributes["derivation"]; ok {
			if str, ok := val.(string); ok {
				description += " " + strings.ToLower(str)
			}
		}
		if val, ok := entity.Attributes["appendicies"]; ok {
			if str, ok := val.(string); ok {
				description += " " + strings.ToLower(str)
			}
		}

		// Replace 's} with } etc (simplified for now)
		description = strings.ReplaceAll(description, "'s}", "}")
		description = strings.ReplaceAll(description, "s'}", "s}")
		description = strings.ReplaceAll(description, "’s}", "}")
		description = strings.ReplaceAll(description, "s’}", "s}")

		var missingReferences []services.MissingReferenceDetail
		for _, info := range labels {
			normalizedLabel := strings.ToLower(database.StripPossessive(info.Label))
			if !strings.Contains(description, normalizedLabel+"}") {
				missingReferences = append(missingReferences, services.MissingReferenceDetail{
					Label:          info.Label,
					RelationshipID: info.RelID,
				})
			}
		}

		if len(missingReferences) > 0 {
			results = append(results, services.LinkedEntityNotInDescriptionResult{
				ID:                entity.ID,
				PrimaryLabel:      entity.PrimaryLabel,
				TypeSlug:          entity.TypeSlug,
				MissingReferences: missingReferences,
			})
		}
	}

	return results, nil
}

// GetEntitiesWithoutDescriptions returns entities that have no description
func (a *App) GetEntitiesWithoutDescriptions() ([]services.EntityWithoutDescriptionResult, error) {
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, err
	}

	var results []services.EntityWithoutDescriptionResult
	for _, entity := range allEntities {
		if entity.Description == nil || *entity.Description == "" {
			results = append(results, services.EntityWithoutDescriptionResult{
				ID:             entity.ID,
				PrimaryLabel:   entity.PrimaryLabel,
				TypeSlug:       entity.TypeSlug,
				HasMissingData: true,
			})
		}
	}
	return results, nil
}

// GetEntitiesWithUnknownTypes returns entities whose type is not Writer, Title, or Reference
func (a *App) GetEntitiesWithUnknownTypes() ([]services.EntityWithUnknownTypeResult, error) {
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, err
	}

	var results []services.EntityWithUnknownTypeResult
	knownTypes := map[string]bool{"writer": true, "title": true, "reference": true}

	for _, entity := range allEntities {
		if !knownTypes[strings.ToLower(entity.TypeSlug)] {
			results = append(results, services.EntityWithUnknownTypeResult{
				ID:           entity.ID,
				PrimaryLabel: entity.PrimaryLabel,
				TypeSlug:     entity.TypeSlug,
			})
		}
	}
	return results, nil
}

// GetUnknownTags returns entities with tags other than {word:, {writer:, or {title:
func (a *App) GetUnknownTags() ([]services.UnknownTagResult, error) {
	allEntities, err := a.entityService.GetAllEntities()
	if err != nil {
		return nil, err
	}

	var results []services.UnknownTagResult
	for _, entity := range allEntities {
		if entity.Description == nil {
			continue
		}

		refs := parser.ParseReferences(*entity.Description)
		var unknownTags []string
		for _, ref := range refs {
			if ref.Type != "word" && ref.Type != "writer" && ref.Type != "title" {
				unknownTags = append(unknownTags, ref.Original)
			}
		}

		if len(unknownTags) > 0 {
			results = append(results, services.UnknownTagResult{
				ID:           entity.ID,
				PrimaryLabel: entity.PrimaryLabel,
				TypeSlug:     entity.TypeSlug,
				UnknownTags:  unknownTags,
				TagCount:     len(unknownTags),
			})
		}
	}
	return results, nil
}

// GetDanglingRelationships returns relationships that point to non-existent entities
func (a *App) GetDanglingRelationships() ([]services.DanglingRelationshipResult, error) {
	allRelationships, err := a.entityService.GetAllRelationships()
	if err != nil {
		return nil, err
	}

	var results []services.DanglingRelationshipResult
	for _, rel := range allRelationships {
		source, err := a.entityService.GetEntity(rel.SourceID)
		if err != nil {
			// Source missing
			results = append(results, services.DanglingRelationshipResult{
				RelationshipID: rel.ID,
				SourceID:       rel.SourceID,
				TargetID:       rel.TargetID,
				Label:          rel.Label,
				MissingSide:    "source",
			})
			continue
		}

		_, err = a.entityService.GetEntity(rel.TargetID)
		if err != nil {
			// Target missing
			results = append(results, services.DanglingRelationshipResult{
				RelationshipID: rel.ID,
				SourceID:       rel.SourceID,
				TargetID:       rel.TargetID,
				Label:          rel.Label,
				SourceLabel:    source.PrimaryLabel,
				SourceType:     source.TypeSlug,
				MissingSide:    "target",
			})
		}
	}
	return results, nil
}

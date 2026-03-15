package main

import (
	"github.com/TrueBlocks/trueblocks-poetry/backend/config"
	"github.com/TrueBlocks/trueblocks-poetry/backend/database"
	"github.com/TrueBlocks/trueblocks-poetry/backend/services"
)

// GetAppConfig returns the application configuration
func (a *App) GetAppConfig() (*config.AppConfig, error) {
	return config.LoadConfig()
}

// GetEntity retrieves a single entity by ID
func (a *App) GetEntity(id int) (*database.Entity, error) {
	return a.entityService.GetEntity(id)
}

// SearchEntities searches for entities
func (a *App) SearchEntities(query string, typeSlug string) ([]database.Entity, error) {
	return a.entityService.SearchEntities(query, typeSlug)
}

// GetRelationships returns relationships for an entity
func (a *App) GetRelationships(entityID int) ([]database.Relationship, error) {
	return a.entityService.GetRelationships(entityID)
}

// GetRelationshipsWithDetails returns relationships with details for an entity
func (a *App) GetRelationshipsWithDetails(entityID int) ([]services.RelationshipDetail, error) {
	return a.entityService.GetRelationshipsWithDetails(entityID)
}

// ToggleEntityMark toggles the mark field for an entity
func (a *App) ToggleEntityMark(entityID int, marked bool) error {
	return a.db.ToggleEntityMark(entityID, marked)
}

// CreateRelationship creates a new relationship
func (a *App) CreateRelationship(sourceID, targetID int, label string) error {
	return a.entityService.CreateRelationship(sourceID, targetID, label)
}

// DeleteRelationship deletes a relationship
func (a *App) DeleteRelationship(id int) error {
	return a.entityService.DeleteRelationship(id)
}

// CreateEntity creates a new entity
func (a *App) CreateEntity(e database.Entity) (int, error) {
	return a.entityService.CreateEntity(e)
}

// UpdateEntity updates an existing entity
func (a *App) UpdateEntity(e database.Entity) error {
	return a.entityService.UpdateEntity(e)
}

// DeleteEntity deletes an entity
func (a *App) DeleteEntity(id int) error {
	return a.entityService.DeleteEntity(id)
}

// GetRandomEntity returns a random entity
func (a *App) GetRandomEntity() (*database.Entity, error) {
	return a.entityService.GetRandomEntity()
}

// GetExtendedStats returns statistics about the database
func (a *App) GetExtendedStats() (*database.DashboardStats, error) {
	return a.entityService.GetExtendedStats()
}

// GetTopHubs returns the entities with the most relationships
func (a *App) GetTopHubs(limit int) ([]database.Entity, error) {
	return a.entityService.GetTopHubs(limit)
}

// GetMarkedEntities returns entities that have a mark attribute
func (a *App) GetMarkedEntities() ([]database.Entity, error) {
	return a.entityService.GetMarkedEntities()
}

// GetNavigationHistory returns recently updated entities
func (a *App) GetNavigationHistory() ([]database.Entity, error) {
	ids := a.settings.GetNavigationHistory()
	var entities []database.Entity
	for _, id := range ids {
		e, err := a.entityService.GetEntity(id)
		if err == nil {
			entities = append(entities, *e)
		}
	}
	return entities, nil
}

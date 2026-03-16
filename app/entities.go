package app

import (
	"github.com/TrueBlocks/trueblocks-poetry/v2/internal/config"
	"github.com/TrueBlocks/trueblocks-poetry/v2/internal/db"
	"github.com/TrueBlocks/trueblocks-poetry/v2/internal/services"
)

func (a *App) GetAppConfig() (*config.AppConfig, error) {
	return config.LoadConfig()
}

func (a *App) GetEntity(id int) (*db.Entity, error) {
	return a.entityService.GetEntity(id)
}

func (a *App) SearchEntities(query string, typeSlug string) ([]db.Entity, error) {
	return a.entityService.SearchEntities(query, typeSlug)
}

func (a *App) GetRelationships(entityID int) ([]db.Relationship, error) {
	return a.entityService.GetRelationships(entityID)
}

func (a *App) GetRelationshipsWithDetails(entityID int) ([]services.RelationshipDetail, error) {
	return a.entityService.GetRelationshipsWithDetails(entityID)
}

func (a *App) ToggleEntityMark(entityID int, marked bool) error {
	return a.db.ToggleEntityMark(entityID, marked)
}

func (a *App) CreateRelationship(sourceID, targetID int, label string) error {
	return a.entityService.CreateRelationship(sourceID, targetID, label)
}

func (a *App) DeleteRelationship(id int) error {
	return a.entityService.DeleteRelationship(id)
}

func (a *App) CreateEntity(e db.Entity) (int, error) {
	return a.entityService.CreateEntity(e)
}

func (a *App) UpdateEntity(e db.Entity) error {
	return a.entityService.UpdateEntity(e)
}

func (a *App) DeleteEntity(id int) error {
	return a.entityService.DeleteEntity(id)
}

func (a *App) GetRandomEntity() (*db.Entity, error) {
	return a.entityService.GetRandomEntity()
}

func (a *App) GetExtendedStats() (*db.DashboardStats, error) {
	return a.entityService.GetExtendedStats()
}

func (a *App) GetTopHubs(limit int) ([]db.Entity, error) {
	return a.entityService.GetTopHubs(limit)
}

func (a *App) GetMarkedEntities() ([]db.Entity, error) {
	return a.entityService.GetMarkedEntities()
}

func (a *App) GetNavigationHistory() ([]db.Entity, error) {
	ids := a.settings.GetNavigationHistory()
	var entities []db.Entity
	for _, id := range ids {
		e, err := a.entityService.GetEntity(id)
		if err == nil {
			entities = append(entities, *e)
		}
	}
	return entities, nil
}

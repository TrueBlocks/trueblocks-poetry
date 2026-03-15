# Migration Plan: Generic Entity Architecture

This document tracks the migration from the domain-specific schema (`items`, `names`, `cliches`) to the generic Entity-Relationship schema (`entities`, `relationships`).

**Status:** ✅ COMPLETE

## Phase 1: Database Schema & Migration ✅ COMPLETE

The goal of this phase is to establish the new schema and migrate all existing data without data loss.

- [x] **Create New Schema SQL**
    - [x] Define `entities` table (id, type_slug, primary_label, secondary_label, description, attributes JSON)
    - [x] Define `relationships` table (id, source_id, target_id, label)
    - [x] Define `entities_fts` virtual table (FTS5)
    - [x] Define indexes for performance (JSON extraction indexes)
- [x] **Develop Migration Logic (Go)**
    - [x] Create `cmd/migrate_data/main.go` tool
    - [x] **Migrate Items:** Map `items` -> `entities` (type='reference')
        - `word` -> `primary_label`
        - `definition` -> `description`
        - `derivation` -> `attributes.derivation`
        - `appendicies` -> `attributes.appendicies`
        - `source` -> `attributes.source`
    - [x] **Migrate Names:** Map `names` -> `entities` (type='person' or 'character')
        - `name` -> `primary_label`
        - `gender` -> `attributes.gender`
        - `description` -> `description`
        - `notes` -> `attributes.notes`
    - [x] **Migrate Cliches:** Map `cliches` -> `entities` (type='cliche')
        - `phrase` -> `primary_label`
        - `definition` -> `description`
    - [x] **Migrate Literary Terms:** Map `literary_terms` -> `entities` (type='term')
    - [x] **Migrate Links:** Map `links` -> `relationships`
        - `link_type` -> `label`
- [x] **Verification**
    - [x] Verify row counts match (Old vs New) - Items:3243, Names:864, Cliches:552, Terms:321 = Entities:4980 ✓
    - [x] Verify JSON attribute integrity (Spot check)
    - [x] Verify FTS index population

## Phase 2: Backend Architecture ✅ COMPLETE

The goal is to build the generic service layer that replaces specific services.

- [x] **Configuration**
    - [x] Define `app_config.json` structure
    - [x] Create `backend/config` package to load and serve the config
- [x] **Entity Service**
    - [x] Create `backend/services/entity_service.go`
    - [x] Implement `GetEntity(id)`
    - [x] Implement `SearchEntities(query, type_slug)`
    - [x] Implement `GetRelationships(id)`
- [x] **Refactor Existing Services**
    - [x] **Audit:** `backend/services/items.go` (Marked for deprecation, kept for backward compatibility)
    - [x] **Update:** `backend/services/images.go` (Updated to use Entity IDs)
    - [x] **Update:** `backend/services/tts.go` (Updated to use Entity IDs)

## Phase 3: SQL Query Migration ✅ COMPLETE

We must rewrite all specific SQL queries to use the generic `entities` table.

- [x] `backend/database/queries/all_items.sql` -> `all_entities.sql`
- [x] `backend/database/queries/all_names.sql` -> (Handled by `all_entities.sql` with filter)
- [x] `backend/database/queries/all_cliches.sql` -> (Handled by `all_entities.sql` with filter)
- [x] `backend/database/queries/all_links.sql` -> `all_relationships.sql`
- [x] `backend/database/queries/writers.sql` -> `entities_by_type.sql` (type='writer')
- [x] `backend/database/queries/poems_for_writer.sql` -> `relationships_by_source.sql`
- [x] `backend/database/queries/dangling_links.sql` -> `dangling_relationships.sql`
- [x] `backend/database/queries/orphans.sql` -> `orphan_entities.sql`
- [x] `backend/database/queries/self_ref_items.sql` -> `self_ref_entities.sql`
- [x] `backend/database/queries/linked_items_not_in_definition.sql` -> `linked_entity_missing_in_desc.sql`
- [x] **Dashboard Queries:**
    - [x] `cited_count.sql`
    - [x] `quotes_count.sql`
    - [x] `stubs_count.sql`
    - [x] `titles_count.sql`
    - [x] `words_count.sql`
    - [x] `writers_count.sql`

## Phase 4: Frontend Refactoring ✅ COMPLETE

The goal is to make the UI data-driven based on `app_config.json`.

- [x] **Type Definitions**
    - [x] Create `frontend/src/types/Entity.ts`
    - [x] Define Discriminated Unions (`Poet`, `Poem`, `Reference`, etc.)
- [x] **Generic Components**
    - [x] Create `GenericEntityList.tsx` (Columns defined by config)
    - [x] Create `GenericEntityDetail.tsx` (Fields defined by config)
    - [x] Create `GenericRelationshipList.tsx`
- [x] **View Migration**
    - [x] Update `App.tsx` routing to use generic routes (e.g., `/entity/:type`)
    - [x] Replace `ItemsView` with Generic View (Available at `/entities/reference`)
    - [x] Replace `NamesView` with Generic View (Available at `/entities/name`)
    - [x] Replace `ClichesView` with Generic View (Available at `/entities/cliche`)
- [x] **Dashboard**
    - [x] Update Dashboard to fetch generic stats

## Phase 5: Cleanup ✅ COMPLETE

Once the new system is stable and verified.

- [x] **Database Cleanup**
    - [x] Update `schema.sql` to use `entities` and `relationships` as primary tables.
    - [x] Remove `scripts/import_data.py` and legacy CSVs.
    - [x] Drop table `items` (in running DB)
    - [x] Drop table `names` (in running DB)
    - [x] Drop table `cliches` (in running DB)
    - [x] Drop table `literary_terms` (in running DB)
    - [x] Drop table `links` (in running DB)
    - [x] Drop old FTS tables (in running DB)
- [x] **Code Cleanup**
    - [x] Delete `backend/services/items.go`
    - [x] Delete old SQL files
    - [x] Remove old TypeScript interfaces

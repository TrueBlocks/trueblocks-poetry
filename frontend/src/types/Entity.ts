export interface BaseEntity {
  id: number;
  typeSlug: string;
  primaryLabel: string;
  secondaryLabel?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceEntity extends BaseEntity {
  typeSlug: "reference";
  attributes: {
    derivation?: string;
    appendicies?: string;
    source?: string;
    source_pg?: string;
    mark?: string;
    has_image?: boolean;
    has_tts?: boolean;
    original_type?: string;
  };
}

export interface PersonEntity extends BaseEntity {
  typeSlug: "person";
  attributes: {
    gender?: "M" | "F" | "NB" | "";
    notes?: string;
    original_type?: string;
  };
}

export interface CharacterEntity extends BaseEntity {
  typeSlug: "character";
  attributes: {
    gender?: "M" | "F" | "NB" | "";
    notes?: string;
  };
}

export interface ClicheEntity extends BaseEntity {
  typeSlug: "cliche";
  attributes: Record<string, never>; // Empty attributes
}

export interface TermEntity extends BaseEntity {
  typeSlug: "term";
  attributes: {
    examples?: string;
    notes?: string;
    original_type?: string;
  };
}

// Discriminated Union
export type Entity =
  | ReferenceEntity
  | PersonEntity
  | CharacterEntity
  | ClicheEntity
  | TermEntity;

export interface Relationship {
  id: number;
  sourceId: number;
  targetId: number;
  label: string;
  createdAt: string;
}

// Configuration Types
export interface EntityFieldConfig {
  key: string;
  label: string;
  type: string;
  options?: string[];
  multiline?: boolean;
  readonly?: boolean;
}

export interface EntityTypeConfig {
  slug: string;
  displayName: string;
  pluralName?: string;
  icon: string;
  description?: string;
  fields: EntityFieldConfig[];
  listColumns: string[];
  searchable: boolean;
}

export interface RelationshipTypeConfig {
  slug: string;
  forwardLabel: string;
  reverseLabel: string;
  bidirectional?: boolean;
}

export interface AppConfig {
  appName: string;
  version: string;
  entityTypes: EntityTypeConfig[];
  relationshipTypes: RelationshipTypeConfig[];
}

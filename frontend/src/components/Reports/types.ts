import { services } from "@wailsjs/go/models";

// Re-export generated types for convenience and backward compatibility
export type UnlinkedRefResult = services.UnlinkedReferenceResult;
export type UnlinkedRefDetail = services.UnlinkedReferenceDetail;
export type DuplicateResult = services.DuplicateEntityResult;
export type DuplicateItem = services.DuplicateEntityDetail;
export type UnknownTagsResult = services.UnknownTagResult;
export type LinkedNotInDefResult = services.LinkedEntityNotInDescriptionResult;
export type SelfRefResult = services.SelfReferenceResult;
export type DanglingLinkResult = services.DanglingRelationshipResult;
export type ItemWithUnknownTypeResult = services.EntityWithUnknownTypeResult;
export type ItemWithoutDefinitionResult =
  services.EntityWithoutDescriptionResult;
export type OrphanedItemResult = services.OrphanedEntityResult;

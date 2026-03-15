// Centralized color definitions for entity types
export const ENTITY_TYPE_COLORS = {
  title: "#FFB6D9", // light pink
  reference: "#ADD8E6", // light blue
  writer: "#90EE90", // light green
} as const;

export type EntityType = keyof typeof ENTITY_TYPE_COLORS;

export function getEntityColor(
  type: string,
  defaultColor: string = "#E5E7EB",
): string {
  return ENTITY_TYPE_COLORS[type.toLowerCase() as EntityType] || defaultColor;
}

export function getEntityTextColor(type: string): string {
  switch (type.toLowerCase()) {
    case "title":
      return "#831843";
    case "reference":
      return "#1e3a8a";
    case "writer":
      return "#14532d";
    default:
      return "#111827";
  }
}

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "markdown" | "select" | "boolean";
  options?: string[];
}

export interface EntityTypeConfig {
  slug: string;
  displayName: string;
  icon: string;
  color?: string;
  fields: FieldConfig[];
  listColumns?: string[];
}

export interface AppConfig {
  appName: string;
  version: string;
  entityTypes: EntityTypeConfig[];
}

export const appConfig: AppConfig = {
  appName: "Poetry DB",
  version: "1.0",
  entityTypes: [
    {
      slug: "reference",
      displayName: "Reference",
      icon: "book",
      color: "blue",
      fields: [
        { key: "derivation", label: "Etymology", type: "markdown" },
        { key: "appendicies", label: "Notes", type: "markdown" },
        { key: "source", label: "Source", type: "text" },
        { key: "source_pg", label: "Page", type: "text" },
      ],
      listColumns: ["primary_label", "description"],
    },
    {
      slug: "writer",
      displayName: "Writer",
      icon: "feather",
      color: "red",
      fields: [
        { key: "derivation", label: "Biography", type: "markdown" },
        { key: "appendicies", label: "Notes", type: "markdown" },
        { key: "source", label: "Source", type: "text" },
      ],
      listColumns: ["primary_label", "description"],
    },
    {
      slug: "title",
      displayName: "Title",
      icon: "heading",
      color: "green",
      fields: [
        { key: "derivation", label: "Background", type: "markdown" },
        { key: "appendicies", label: "Notes", type: "markdown" },
        { key: "source", label: "Source", type: "text" },
      ],
      listColumns: ["primary_label", "description"],
    },
    {
      slug: "film",
      displayName: "Film",
      icon: "film",
      color: "orange",
      fields: [
        { key: "year", label: "Year", type: "text" },
        { key: "notes", label: "Notes", type: "markdown" },
      ],
      listColumns: ["primary_label", "description"],
    },
    {
      slug: "director",
      displayName: "Director",
      icon: "video",
      color: "grape", // Mantine uses 'grape' or 'violet' for purple-ish
      fields: [{ key: "bio", label: "Biography", type: "markdown" }],
      listColumns: ["primary_label", "description"],
    },
    {
      slug: "person",
      displayName: "Person",
      icon: "user",
      fields: [
        {
          key: "gender",
          label: "Gender",
          type: "select",
          options: ["M", "F", "NB"],
        },
        { key: "notes", label: "Notes", type: "markdown" },
      ],
      listColumns: ["primary_label", "attributes.gender", "description"],
    },
    {
      slug: "character",
      displayName: "Character",
      icon: "user-mask",
      fields: [
        {
          key: "gender",
          label: "Gender",
          type: "select",
          options: ["M", "F", "NB"],
        },
        { key: "notes", label: "Notes", type: "markdown" },
      ],
    },
    {
      slug: "cliche",
      displayName: "Cliche",
      icon: "quote-left",
      fields: [],
      listColumns: ["primary_label", "description"],
    },
    {
      slug: "term",
      displayName: "Literary Term",
      icon: "graduation-cap",
      fields: [
        { key: "examples", label: "Examples", type: "markdown" },
        { key: "notes", label: "Notes", type: "markdown" },
      ],
      listColumns: ["primary_label", "description"],
    },
  ],
};

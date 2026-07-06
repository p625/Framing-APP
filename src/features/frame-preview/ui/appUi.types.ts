export type AppMode = "workspace" | "profile-editor";

export type CenterView = "preview" | "perspective" | "crop" | "environment";

export type WorkspaceSectionId =
  | "artwork"
  | "preparation"
  | "size"
  | "frame"
  | "environment"
  | "export";

/** @deprecated Use WorkspaceSectionId */
export type SidebarSectionId = WorkspaceSectionId;

export type FrameCatalogueSelection =
  | { kind: "builtin"; id: string }
  | { kind: "builtin-profile"; id: string }
  | { kind: "profile"; id: string };

export type ExportMode = "framed" | "environment";

export type AppMode = "workspace" | "profile-editor";

export type CenterView = "preview" | "perspective" | "crop";

export type SidebarSectionId =
  | "artwork"
  | "preparation"
  | "size"
  | "frame"
  | "export";

export type FrameCatalogueSelection =
  | { kind: "builtin"; id: string }
  | { kind: "profile"; id: string };

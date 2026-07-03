"use client";

import { useCallback, useState } from "react";
import type {
  AppMode,
  CenterView,
  FrameCatalogueSelection,
  SidebarSectionId,
} from "../ui/appUi.types";

export function useAppUiState() {
  const [appMode, setAppMode] = useState<AppMode>("workspace");
  const [centerView, setCenterView] = useState<CenterView>("preview");
  const [openSection, setOpenSection] = useState<SidebarSectionId>("artwork");
  const [frameSelection, setFrameSelection] = useState<FrameCatalogueSelection | null>(
    { kind: "builtin", id: "oak" },
  );
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const openSectionToggle = useCallback((section: SidebarSectionId) => {
    setOpenSection((current) => (current === section ? current : section));
  }, []);

  const enterProfileEditor = useCallback((profileId: string | null = null) => {
    setEditingProfileId(profileId);
    setAppMode("profile-editor");
    setCenterView("preview");
  }, []);

  const exitProfileEditor = useCallback(() => {
    setAppMode("workspace");
    setEditingProfileId(null);
    setCenterView("preview");
  }, []);

  const openCenterView = useCallback((view: CenterView) => {
    setCenterView(view);
  }, []);

  const returnToPreview = useCallback(() => {
    setCenterView("preview");
  }, []);

  return {
    appMode,
    centerView,
    openSection,
    frameSelection,
    editingProfileId,
    openSectionToggle,
    setFrameSelection,
    enterProfileEditor,
    exitProfileEditor,
    openCenterView,
    returnToPreview,
  };
}

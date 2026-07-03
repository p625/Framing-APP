"use client";

import { useCallback, useState } from "react";
import { getBuiltinEnvironment } from "../defaults/builtinEnvironments";
import type {
  EnvironmentPlacement,
  EnvironmentSelection,
} from "../framing.types";
import { DEFAULT_ENVIRONMENT_PLACEMENT } from "../framing.types";
import { loadEnvironment } from "../storage/environmentStorage";

export function useEnvironmentState() {
  const [selection, setSelection] = useState<EnvironmentSelection>({
    kind: "builtin",
    id: "white-gallery",
  });
  const [environmentImageUrl, setEnvironmentImageUrl] = useState<string | null>(
    getBuiltinEnvironment("white-gallery")?.imageUrl ?? null,
  );
  const [placement, setPlacement] = useState<EnvironmentPlacement>(
    DEFAULT_ENVIRONMENT_PLACEMENT,
  );
  const [environmentCatalogueRevision, setEnvironmentCatalogueRevision] =
    useState(0);

  const notifyEnvironmentCatalogueChanged = useCallback(() => {
    setEnvironmentCatalogueRevision((revision) => revision + 1);
  }, []);

  const selectBuiltinEnvironment = useCallback((id: string) => {
    const builtin = getBuiltinEnvironment(id);
    if (!builtin) {
      return;
    }
    setSelection({ kind: "builtin", id });
    setEnvironmentImageUrl((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return builtin.imageUrl;
    });
    setPlacement(DEFAULT_ENVIRONMENT_PLACEMENT);
  }, []);

  const selectSavedEnvironment = useCallback(async (id: string) => {
    const record = await loadEnvironment(id);
    if (!record) {
      return;
    }
    setSelection({ kind: "saved", id });
    setEnvironmentImageUrl((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return record.imageUrl;
    });
    setPlacement(DEFAULT_ENVIRONMENT_PLACEMENT);
  }, []);

  const updatePlacement = useCallback((patch: Partial<EnvironmentPlacement>) => {
    setPlacement((current) => ({ ...current, ...patch }));
  }, []);

  const resetPlacement = useCallback(() => {
    setPlacement(DEFAULT_ENVIRONMENT_PLACEMENT);
  }, []);

  return {
    selection,
    environmentImageUrl,
    placement,
    environmentCatalogueRevision,
    selectBuiltinEnvironment,
    selectSavedEnvironment,
    updatePlacement,
    resetPlacement,
    notifyEnvironmentCatalogueChanged,
  };
}

export type UseEnvironmentStateReturn = ReturnType<typeof useEnvironmentState>;

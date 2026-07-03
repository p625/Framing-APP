"use client";

import { useCallback, useState } from "react";
import { getBuiltinEnvironment } from "../defaults/builtinEnvironments";
import type {
  EnvironmentCalibration,
  EnvironmentPlacement,
  EnvironmentSelection,
} from "../framing.types";
import { DEFAULT_ENVIRONMENT_PLACEMENT } from "../framing.types";
import { loadEnvironment } from "../storage/environmentStorage";
import {
  approximateWallCenterPlacement,
  isEnvironmentCalibrationValid,
} from "../utils/environmentCalibration";

function placementForCalibration(
  calibration: EnvironmentCalibration,
): EnvironmentPlacement {
  const center = approximateWallCenterPlacement(calibration);
  return {
    ...DEFAULT_ENVIRONMENT_PLACEMENT,
    x: center.x,
    y: center.y,
  };
}

export function useEnvironmentState() {
  const [selection, setSelection] = useState<EnvironmentSelection>({
    kind: "builtin",
    id: "white-gallery",
  });
  const builtinDefault = getBuiltinEnvironment("white-gallery");
  const [environmentImageUrl, setEnvironmentImageUrl] = useState<string | null>(
    builtinDefault?.imageUrl ?? null,
  );
  const [calibration, setCalibration] = useState<EnvironmentCalibration | null>(
    builtinDefault?.calibration ?? null,
  );
  const [placement, setPlacement] = useState<EnvironmentPlacement>(() =>
    builtinDefault?.calibration
      ? placementForCalibration(builtinDefault.calibration)
      : DEFAULT_ENVIRONMENT_PLACEMENT,
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
    setCalibration(builtin.calibration);
    setPlacement(placementForCalibration(builtin.calibration));
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
    setCalibration(record.calibration);
    setPlacement(
      record.calibration
        ? placementForCalibration(record.calibration)
        : DEFAULT_ENVIRONMENT_PLACEMENT,
    );
  }, []);

  const applySavedCalibration = useCallback(
    (savedCalibration: EnvironmentCalibration) => {
      setCalibration(savedCalibration);
      setPlacement(placementForCalibration(savedCalibration));
    },
    [],
  );

  const updatePlacement = useCallback((patch: Partial<EnvironmentPlacement>) => {
    setPlacement((current) => ({ ...current, ...patch }));
  }, []);

  const resetPlacement = useCallback(() => {
    if (calibration && isEnvironmentCalibrationValid(calibration)) {
      setPlacement(placementForCalibration(calibration));
      return;
    }
    setPlacement(DEFAULT_ENVIRONMENT_PLACEMENT);
  }, [calibration]);

  const hasWallCalibration = isEnvironmentCalibrationValid(calibration);

  return {
    selection,
    environmentImageUrl,
    calibration,
    placement,
    hasWallCalibration,
    environmentCatalogueRevision,
    selectBuiltinEnvironment,
    selectSavedEnvironment,
    applySavedCalibration,
    updatePlacement,
    resetPlacement,
    notifyEnvironmentCatalogueChanged,
  };
}

export type UseEnvironmentStateReturn = ReturnType<typeof useEnvironmentState>;

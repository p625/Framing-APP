import type { EnvironmentCalibration } from "../framing.types";
import {
  BUILTIN_ENVIRONMENTS as BUILTIN_ENVIRONMENT_DATA,
  getBuiltinEnvironment as getBuiltinEnvironmentData,
  type BuiltinEnvironment as BuiltinEnvironmentData,
  type EnvironmentCategory,
  ENVIRONMENT_CATEGORIES,
} from "../data/builtInEnvironments";

export type { EnvironmentCategory };
export { ENVIRONMENT_CATEGORIES };

/** @deprecated Use defaultCalibration — kept for existing call sites. */
export interface BuiltinEnvironment extends Omit<BuiltinEnvironmentData, "defaultCalibration"> {
  calibration: EnvironmentCalibration;
}

function withCalibrationAlias(item: BuiltinEnvironmentData): BuiltinEnvironment {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    thumbnailUrl: item.thumbnailUrl,
    imageUrl: item.imageUrl,
    calibration: item.defaultCalibration,
  };
}

export const BUILTIN_ENVIRONMENTS: BuiltinEnvironment[] =
  BUILTIN_ENVIRONMENT_DATA.map(withCalibrationAlias);

export function getBuiltinEnvironment(id: string): BuiltinEnvironment | undefined {
  const item = getBuiltinEnvironmentData(id);
  return item ? withCalibrationAlias(item) : undefined;
}

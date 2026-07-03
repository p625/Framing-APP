import type { EnvironmentCalibration } from "../framing.types";

export interface BuiltinEnvironment {
  id: string;
  name: string;
  thumbnailUrl: string;
  imageUrl: string;
  calibration: EnvironmentCalibration;
}

export const BUILTIN_ENVIRONMENTS: BuiltinEnvironment[] = [
  {
    id: "white-gallery",
    name: "White gallery wall",
    thumbnailUrl: "/environments/white-gallery.svg",
    imageUrl: "/environments/white-gallery.svg",
    calibration: {
      wallRect: { x: 0.1, y: 0.1, width: 0.8, height: 0.58 },
      realWallWidthCm: 300,
      realWallHeightCm: 220,
    },
  },
  {
    id: "living-room",
    name: "Living room",
    thumbnailUrl: "/environments/living-room.svg",
    imageUrl: "/environments/living-room.svg",
    calibration: {
      wallRect: { x: 0.2, y: 0.08, width: 0.48, height: 0.45 },
      realWallWidthCm: 220,
      realWallHeightCm: 140,
    },
  },
  {
    id: "office-wall",
    name: "Office wall",
    thumbnailUrl: "/environments/office-wall.svg",
    imageUrl: "/environments/office-wall.svg",
    calibration: {
      wallRect: { x: 0.08, y: 0.08, width: 0.72, height: 0.52 },
      realWallWidthCm: 280,
      realWallHeightCm: 200,
    },
  },
  {
    id: "dark-wall",
    name: "Dark wall",
    thumbnailUrl: "/environments/dark-wall.svg",
    imageUrl: "/environments/dark-wall.svg",
    calibration: {
      wallRect: { x: 0.1, y: 0.1, width: 0.78, height: 0.55 },
      realWallWidthCm: 260,
      realWallHeightCm: 190,
    },
  },
];

export function getBuiltinEnvironment(id: string): BuiltinEnvironment | undefined {
  return BUILTIN_ENVIRONMENTS.find((item) => item.id === id);
}

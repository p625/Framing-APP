import type { EnvironmentCalibration } from "../framing.types";

export const ENVIRONMENT_CATEGORIES = [
  "Living Room",
  "Bedroom",
  "Office",
  "Dining Room",
  "Hallway",
  "Gallery",
  "Hotel",
  "Restaurant",
  "Children Room",
] as const;

export type EnvironmentCategory = (typeof ENVIRONMENT_CATEGORIES)[number];

export interface BuiltinEnvironment {
  id: string;
  name: string;
  category: EnvironmentCategory;
  thumbnailUrl: string;
  imageUrl: string;
  defaultCalibration: EnvironmentCalibration;
}

export const BUILTIN_ENVIRONMENTS: BuiltinEnvironment[] = [
  {
    id: "white-gallery",
    name: "White gallery wall",
    category: "Gallery",
    thumbnailUrl: "/environments/white-gallery.svg",
    imageUrl: "/environments/white-gallery.svg",
    defaultCalibration: {
      wallRect: { x: 0.1, y: 0.1, width: 0.8, height: 0.58 },
      realWallWidthCm: 300,
      realWallHeightCm: 220,
    },
  },
  {
    id: "living-room",
    name: "Living room",
    category: "Living Room",
    thumbnailUrl: "/environments/living-room.svg",
    imageUrl: "/environments/living-room.svg",
    defaultCalibration: {
      wallRect: { x: 0.2, y: 0.08, width: 0.48, height: 0.45 },
      realWallWidthCm: 220,
      realWallHeightCm: 140,
    },
  },
  {
    id: "office-wall",
    name: "Office wall",
    category: "Office",
    thumbnailUrl: "/environments/office-wall.svg",
    imageUrl: "/environments/office-wall.svg",
    defaultCalibration: {
      wallRect: { x: 0.08, y: 0.08, width: 0.72, height: 0.52 },
      realWallWidthCm: 280,
      realWallHeightCm: 200,
    },
  },
  {
    id: "dark-wall",
    name: "Dark wall",
    category: "Gallery",
    thumbnailUrl: "/environments/dark-wall.svg",
    imageUrl: "/environments/dark-wall.svg",
    defaultCalibration: {
      wallRect: { x: 0.1, y: 0.1, width: 0.78, height: 0.55 },
      realWallWidthCm: 260,
      realWallHeightCm: 190,
    },
  },
  {
    id: "modern-bedroom",
    name: "Modern Bedroom",
    category: "Bedroom",
    thumbnailUrl: "/environments/modern-bedroom.png",
    imageUrl: "/environments/modern-bedroom.png",
    defaultCalibration: {
      wallRect: { x: 0.28, y: 0.08, width: 0.46, height: 0.42 },
      realWallWidthCm: 240,
      realWallHeightCm: 150,
    },
  },
];

export function getBuiltinEnvironment(id: string): BuiltinEnvironment | undefined {
  return BUILTIN_ENVIRONMENTS.find((item) => item.id === id);
}

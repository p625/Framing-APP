export interface BuiltinEnvironment {
  id: string;
  name: string;
  thumbnailUrl: string;
  imageUrl: string;
}

export const BUILTIN_ENVIRONMENTS: BuiltinEnvironment[] = [
  {
    id: "white-gallery",
    name: "White gallery wall",
    thumbnailUrl: "/environments/white-gallery.svg",
    imageUrl: "/environments/white-gallery.svg",
  },
  {
    id: "living-room",
    name: "Living room",
    thumbnailUrl: "/environments/living-room.svg",
    imageUrl: "/environments/living-room.svg",
  },
  {
    id: "office-wall",
    name: "Office wall",
    thumbnailUrl: "/environments/office-wall.svg",
    imageUrl: "/environments/office-wall.svg",
  },
  {
    id: "dark-wall",
    name: "Dark wall",
    thumbnailUrl: "/environments/dark-wall.svg",
    imageUrl: "/environments/dark-wall.svg",
  },
];

export function getBuiltinEnvironment(id: string): BuiltinEnvironment | undefined {
  return BUILTIN_ENVIRONMENTS.find((item) => item.id === id);
}

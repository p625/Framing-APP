import type { FrameDefinition } from "./framing.types";

export const SAMPLE_FRAMES: FrameDefinition[] = [
  {
    id: "oak",
    name: "Oak Wood",
    textureUrl: "/frames/oak.svg",
    fallbackColor: "#c4a574",
    sampleMode: "texture",
  },
  {
    id: "walnut",
    name: "Walnut",
    textureUrl: "/frames/walnut.svg",
    fallbackColor: "#5c4033",
    sampleMode: "texture",
  },
  {
    id: "black",
    name: "Black Matte",
    textureUrl: "/frames/black.svg",
    fallbackColor: "#1a1a1a",
    sampleMode: "texture",
  },
  {
    id: "gold",
    name: "Gold Ornate",
    textureUrl: "/frames/gold.svg",
    fallbackColor: "#c9a227",
    sampleMode: "texture",
  },
];

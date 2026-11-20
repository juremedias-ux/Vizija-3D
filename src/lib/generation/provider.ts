import { MeshyProvider } from "./meshy";
import {
  MAX_IMAGES,
  type ProviderInfo,
  type ThreeDGenerationProvider,
} from "./types";

/**
 * Izbira ponudnika glede na spremenljivke okolja (samo na strežniku):
 *  AI_3D_PROVIDER=meshy  in  MESHY_API_KEY=...  → Meshy
 *  sicer → demo način (modeli se sestavijo v brskalniku iz preprostih predlog).
 *
 * Nov ponudnik: ustvari razred, ki implementira ThreeDGenerationProvider
 * (glej meshy.ts), in ga dodaj v spodnji »switch«.
 */
export function getGenerationProvider(): ThreeDGenerationProvider | null {
  const provider = process.env.AI_3D_PROVIDER?.trim().toLowerCase();
  switch (provider) {
    case "meshy": {
      const key = process.env.MESHY_API_KEY?.trim();
      return key ? new MeshyProvider(key) : null;
    }
    default:
      return null;
  }
}

export function getProviderInfo(): ProviderInfo {
  const provider = getGenerationProvider();
  if (!provider) {
    return {
      mode: "demo",
      name: "Demo",
      supportsImages: true,
      maxImages: MAX_IMAGES,
    };
  }
  return {
    mode: "ai",
    name: provider.name,
    supportsImages: provider.supportsImages,
    maxImages: Math.min(provider.maxImages, MAX_IMAGES),
  };
}

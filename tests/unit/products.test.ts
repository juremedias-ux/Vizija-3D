import { describe, expect, it } from "vitest";

import {
  MAX_PRODUCT_SLOTS,
  findInterestProduct,
  getProductSlots,
  isPresentedProduct,
  products,
} from "@/content/products";

describe("katalog izdelkov", () => {
  it("ima natanko deset mest", () => {
    expect(MAX_PRODUCT_SLOTS).toBe(10);
    expect(products).toHaveLength(10);
  });

  it("ima edinstvene identifikatorje in vrstni red 1–10", () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(10);
    expect(getProductSlots().map((p) => p.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("predstavljeni izdelki imajo sliko in nadomestno besedilo", () => {
    for (const slot of products.filter((p) => p.status !== "coming-soon")) {
      expect(isPresentedProduct(slot)).toBe(true);
      expect(slot.imageSrc).toMatch(/^\//);
      expect(slot.imageAlt?.length).toBeGreaterThan(10);
    }
  });

  it("prazna mesta nimajo omogočene oddaje zanimanja", () => {
    for (const slot of products.filter((p) => p.status === "coming-soon")) {
      expect(slot.interestEnabled).toBe(false);
      expect(isPresentedProduct(slot)).toBe(false);
      expect(findInterestProduct(slot.id)).toBeNull();
    }
  });

  it("oddajo dovoli samo za omogočene izdelke", () => {
    expect(findInterestProduct("izdelek-01")?.id).toBe("izdelek-01");
    expect(findInterestProduct("ne-obstaja")).toBeNull();
    expect(findInterestProduct(42)).toBeNull();
  });

  it("izdelki ne vsebujejo izmišljenih cen ali številk mer", () => {
    for (const slot of products) {
      const text = `${slot.name ?? ""} ${slot.description ?? ""}`;
      expect(text).not.toMatch(/€|EUR|\d+\s?(mm|cm|kg|g)\b/i);
    }
  });
});

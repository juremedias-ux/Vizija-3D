import type { Metadata } from "next";

import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ProductCatalog } from "@/components/sections/ProductCatalog";
import { RoomVision } from "@/components/sections/RoomVision";
import { Statement } from "@/components/sections/Statement";

export const metadata: Metadata = {
  title: "Izdelki",
  description:
    "3D-tiskani izdelki Vizija 3D za dom in delovni prostor. Oglej si izdelke in oddaj nezavezujoče zanimanje.",
};

export default function ProductsPage() {
  return (
    <>
      <Hero />
      <Statement />
      <HowItWorks />
      <ProductCatalog />
      <RoomVision />
      <Faq />
    </>
  );
}

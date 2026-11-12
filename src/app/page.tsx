import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ProductCatalog } from "@/components/sections/ProductCatalog";
import { RoomVision } from "@/components/sections/RoomVision";
import { Statement } from "@/components/sections/Statement";

export default function HomePage() {
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

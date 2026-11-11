import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ProductCatalog } from "@/components/sections/ProductCatalog";
import { RoomVision } from "@/components/sections/RoomVision";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ProductCatalog />
      <RoomVision />
      <Faq />
    </>
  );
}

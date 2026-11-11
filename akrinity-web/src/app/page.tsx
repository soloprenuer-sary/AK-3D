import { Hero } from '@/components/home/Hero';
import { PrintingNow } from '@/components/home/PrintingNow';
import { StatsStrip } from '@/components/home/StatsStrip';
import { Statement } from '@/components/home/Statement';
import { CategoryTiles } from '@/components/home/CategoryTiles';
import { CustomBanner } from '@/components/home/CustomBanner';
import { BestSellers } from '@/components/home/BestSellers';
import { ProcessSteps } from '@/components/home/ProcessSteps';
import { Materials } from '@/components/home/Materials';
import { SelectedWork } from '@/components/home/SelectedWork';
import { FinalCta } from '@/components/home/FinalCta';

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <PrintingNow />
      <StatsStrip />
      <Statement />
      <CategoryTiles />
      <CustomBanner />
      <BestSellers />
      <ProcessSteps />
      <Materials />
      <SelectedWork />
      <FinalCta />
    </main>
  );
}

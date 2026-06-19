"use client";

import { useEffect, useRef, useState } from "react";
import { WarehouseConfigSidebar } from "./_components/WarehouseConfigSidebar";
import { ProductBrandCard } from "./_components/ProductBrandCard";
import { ProductCategoryCard } from "./_components/ProductCategoryCard";
import { ProductRelationTypeCard } from "./_components/ProductRelationTypeCard";

// Desktop: topbar(h-12=3rem) + main padding top+bottom(lg:p-8=2rem each) = 7rem
// Mobile:  header(h-16=4rem) + p-4 top(1rem) + pb-20 bottom(5rem) = 10rem
const PAGE_HEIGHT = "h-[calc(100svh-10rem)] lg:h-[calc(100svh-7rem)]";

export default function WarehouseConfigurationsPage() {
  const [activeSection, setActiveSection] = useState("brands");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { root: container, rootMargin: "-10% 0px -60% 0px" },
    );

    container
      .querySelectorAll("[data-config-section]")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  function handleNavClick(key: string) {
    const container = scrollRef.current;
    if (!container) return;
    const section = container.querySelector(`#${key}`) as HTMLElement | null;
    if (section) {
      container.scrollTo({ top: section.offsetTop, behavior: "smooth" });
    }
  }

  return (
    <div className={`flex flex-col mx-auto ${PAGE_HEIGHT}`}>
      <div className="flex-none pb-3">
        <h1 className="text-xl font-semibold">Configurazioni magazzino</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestisci le tabelle di configurazione per i prodotti
        </p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <WarehouseConfigSidebar
          activeSection={activeSection}
          onNavClick={handleNavClick}
        />

        <div
          ref={scrollRef}
          className="relative flex-1 min-w-0 overflow-y-auto pb-8"
        >
          <div className="space-y-5">
            <section id="brands" data-config-section>
              <ProductBrandCard />
            </section>
            <section id="categories" data-config-section>
              <ProductCategoryCard />
            </section>
            <section id="relation-types" data-config-section>
              <ProductRelationTypeCard />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';

export default function ScrollAtmosphere({ view }: { view: string }) {
  useEffect(() => {
    const zones = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-focus]'));
    if (!zones.length) return;

    const visible = new Set<HTMLElement>();
    const setActiveZone = () => {
      const viewportCenter = window.innerHeight / 2;
      let active: HTMLElement | undefined;
      let nearestDistance = Number.POSITIVE_INFINITY;

      visible.forEach((zone) => {
        const rect = zone.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          active = zone;
        }
      });

      zones.forEach((zone) => {
        zone.dataset.scrollActive = zone === active ? 'true' : 'false';
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const zone = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(zone);
        else visible.delete(zone);
      });
      setActiveZone();
    }, {
      rootMargin: '-28% 0px -28% 0px',
      threshold: [0, 0.2, 0.5],
    });

    zones.forEach((zone) => observer.observe(zone));

    return () => {
      observer.disconnect();
      zones.forEach((zone) => delete zone.dataset.scrollActive);
    };
  }, [view]);

  return <div className="scroll-atmosphere" aria-hidden="true" />;
}

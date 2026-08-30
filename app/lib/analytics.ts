export const ANALYTICS_READY_EVENT = 'haozhai:analytics-ready';

export type AnalyticsView = 'home' | 'questionnaire' | 'results' | 'market' | 'method';
export type AnalyticsEvent = 'start_analysis' | 'complete_analysis' | 'view_example' | 'adjust_scenario';

const VIEW_METADATA: Record<AnalyticsView, { title: string; fragment: string }> = {
  home: { title: '首頁', fragment: 'home' },
  questionnaire: { title: '適居分析', fragment: 'analysis' },
  results: { title: '分析結果', fragment: 'results' },
  market: { title: '台中行情', fragment: 'market' },
  method: { title: '方法與資料', fragment: 'method' },
};

let previousVirtualLocation = '';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(view: AnalyticsView) {
  if (typeof window === 'undefined' || !window.gtag) return;

  const metadata = VIEW_METADATA[view];
  const pageLocation = `${window.location.origin}${window.location.pathname}#/${metadata.fragment}`;

  window.gtag('event', 'page_view', {
    page_title: `好宅指南｜${metadata.title}`,
    page_location: pageLocation,
    page_referrer: previousVirtualLocation || document.referrer,
  });
  previousVirtualLocation = pageLocation;
}

export function trackAnalyticsEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event);
}

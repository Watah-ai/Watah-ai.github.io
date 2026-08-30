'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { ANALYTICS_READY_EVENT } from '../lib/analytics';

type ConsentChoice = 'granted' | 'denied';

const CONSENT_STORAGE_KEY = 'haozhai-analytics-consent-v1';
const CONSENT_CHANGE_EVENT = 'haozhai:analytics-consent-change';
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';
const analyticsEnabled = /^G-[A-Z0-9]+$/.test(measurementId);

function saveChoice(choice: ConsentChoice) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

function getConsentSnapshot(): ConsentChoice | null | undefined {
  if (!analyticsEnabled) return undefined;
  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return stored === 'granted' || stored === 'denied' ? stored : null;
}

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

export default function AnalyticsConsent() {
  const choice = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, () => undefined);
  const [isChoosing, setIsChoosing] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled || choice !== 'granted') return;

    window.dataLayer ??= [];
    window.gtag ??= (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-haozhai-analytics]');
    if (existingScript) {
      window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.dataset.haozhaiAnalytics = 'true';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.addEventListener('load', () => window.dispatchEvent(new Event(ANALYTICS_READY_EVENT)), { once: true });
    document.head.appendChild(script);
  }, [choice]);

  if (!analyticsEnabled || choice === undefined) return null;

  const choose = (nextChoice: ConsentChoice) => {
    saveChoice(nextChoice);
    setIsChoosing(false);

    if (nextChoice === 'denied' && choice === 'granted' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      window.location.reload();
      return;
    }

  };

  if (choice !== null && !isChoosing) {
    return <button type="button" className="analytics-settings-button" onClick={() => setIsChoosing(true)}>
      分析隱私設定
    </button>;
  }

  return <section className="analytics-consent" aria-labelledby="analytics-consent-title">
    <div>
      <p id="analytics-consent-title" className="font-data text-sm font-bold text-[#eef3f8]">匿名瀏覽分析</p>
      <p className="mt-1 max-w-2xl text-xs leading-5 text-[#a8b5c6]">
        同意後只記錄頁面與功能使用情形，不會傳送預算、收入、家庭需求或分析結果。你可以隨時變更選擇。
      </p>
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">
      <button type="button" className="btn-secondary min-h-0 px-4 py-2 text-xs" onClick={() => choose('denied')}>僅必要功能</button>
      <button type="button" className="btn-primary min-h-0 px-4 py-2 text-xs" onClick={() => choose('granted')}>同意匿名分析</button>
    </div>
  </section>;
}

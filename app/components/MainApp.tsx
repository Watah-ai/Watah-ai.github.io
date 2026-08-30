'use client';

import { useEffect, useMemo, useState } from 'react';
import marketJson from '../data/taichung-market.json';
import { ANALYTICS_READY_EVENT, trackAnalyticsEvent, trackPageView } from '../lib/analytics';
import { sanitizeAnswers } from '../lib/answers';
import { buildRecommendations, calculateBudget } from '../lib/recommendation';
import type { Answers, MarketData } from '../types';
import GalaxyBackground from './GalaxyBackground';
import AnalyticsConsent from './AnalyticsConsent';
import HouseAudioControl from './HouseAudioControl';
import MarketDashboard from './MarketDashboard';
import MethodPage from './MethodPage';
import Questionnaire from './Questionnaire';
import Results from './Results';
import ScrollAtmosphere from './ScrollAtmosphere';

type View = 'home' | 'questionnaire' | 'results' | 'market' | 'method';
const market = marketJson as MarketData;
const SESSION_STORAGE_KEY = 'taichung-first-home-session-answers';
const LEGACY_STORAGE_KEY = 'taichung-first-home-answers';

const defaults: Answers = {
  downPayment: 350,
  reserve: 80,
  monthlyIncome: 10,
  monthlyDebt: 0.5,
  fixedExpense: 4,
  loanYears: 30,
  interestRate: 2.3,
  residents: 2,
  rooms: 2,
  elevator: true,
  parking: false,
  buildings: ['住宅大樓', '華廈'],
  maxAge: 30,
  commuteHub: '市政府',
  maxCommute: 35,
  priorities: { finance: 5, commute: 4, space: 4, lifestyle: 3, condition: 3 },
};

function Home({ onStart, onExample, onMarket }: { onStart: () => void; onExample: () => void; onMarket: () => void }) {
  const stats = [
    [market.metadata.generatedFromRows.toLocaleString(), '住宅成交'],
    [market.districts.length.toString(), '台中行政區'],
    [market.profiles.length.toString(), '房型組合'],
  ];
  const steps = [
    ['01', '建立首購輪廓', '輸入財務、家庭、通勤與房屋接受度。'],
    ['02', '驗證市場可行性', '以政府成交資料找出預算實際支持的房型。'],
    ['03', '理解每個取捨', '呈現分項分數、成交樣本、理由與犧牲。'],
  ];

  return <>
    <section className="galaxy-hero tech-shell relative isolate min-h-[calc(100svh-5rem)] overflow-hidden">
      <GalaxyBackground />
      <div className="galaxy-vignette absolute inset-0 z-[1]" aria-hidden="true" />
      <div className="content-container relative z-10 flex min-h-[calc(100svh-5rem)] flex-col justify-center py-16 md:py-20">
        <div className="max-w-[43rem]">
          <p className="eyebrow">Taichung First-Home Intelligence</p>
          <h1 className="display-title mt-7 text-[clamp(3.15rem,7vw,6.6rem)]">
            <span className="block">用資料找到</span>
            <span className="block md:pl-[0.8em]">適合你的</span>
            <span className="block text-[#ff6b57] md:pl-[1.65em]">第一間房</span>
          </h1>
          <p className="hero-summary mt-7 max-w-[39rem] border-l border-[#ff6b57] py-4 pr-8 pl-5 text-base leading-8 sm:text-lg">輸入預算、家庭需求與生活偏好，從台中公開成交資料找出可負擔的房屋類型，並清楚說明每個選擇的取捨。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={onStart}>開始首購分析 →</button>
            <button className="btn-secondary" onClick={onExample}>查看範例報告</button>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#7f8fa6]">免費使用・資料保存在你的瀏覽器・不是銀行鑑價</p>
        </div>
        <div className="mt-14 grid max-w-[43rem] border-y border-[#263246] sm:grid-cols-3">
          {stats.map(([value, label]) => <div key={label} className="border-b border-[#263246] py-5 last:border-b-0 sm:border-r sm:border-b-0 sm:px-5 sm:first:pl-0 sm:last:border-r-0">
            <strong className="data-number block text-3xl text-[#eef3f8]">{value}</strong>
            <span className="mt-1 block text-xs tracking-[.12em] text-[#94a3b8]">{label}</span>
          </div>)}
        </div>
      </div>
    </section>

    <section className="scroll-focus-zone scroll-tone-light tech-shell border-y border-[#263246]" data-scroll-focus data-scroll-active="false">
      <div className="feature-row content-container relative z-10 grid">
        <div className="feature-row-heading border-b border-[#263246] py-6">
          <h2 className="font-data font-bold">資料支持的決策</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">每項結果標示來源、期間與可信度。</p>
        </div>
        {['2026上半年實價成交', 'Hard Gate 必要條件', '可展開驗算的推薦'].map((item) => <div key={item} className="feature-row-item flex items-center border-b border-[#263246] py-5 text-sm font-bold text-[#72c7f2]"><span className="mr-3 text-[#ff6b57]">+</span>{item}</div>)}
      </div>
    </section>

    <section className="scroll-focus-zone scroll-tone-dark tech-shell py-20" data-scroll-focus data-scroll-active="false">
      <div className="content-container relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="eyebrow">Decision Pipeline</p><h2 className="display-title mt-3 text-3xl sm:text-5xl">資料 → 規則 → 推薦 → 決策</h2></div>
          <button onClick={onMarket} className="btn-secondary">查看台中行情 →</button>
        </div>
        <div className="mt-12 grid border-y border-[#263246] md:grid-cols-3">
          {steps.map(([number, title, text]) => <article key={number} className="border-b border-[#263246] py-8 last:border-b-0 md:border-r md:border-b-0 md:px-8 md:first:pl-0 md:last:border-r-0">
            <span className="data-number text-4xl text-[#ff6b57]">{number}</span>
            <h3 className="font-data mt-8 text-lg font-bold">{title}</h3>
            <p className="body-copy mt-3 max-w-xs text-sm">{text}</p>
          </article>)}
        </div>
      </div>
    </section>
  </>;
}

export default function MainApp() {
  const [view, setView] = useState<View>('home');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(defaults);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    const saved = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      // Session storage is an external client source hydrated after mount.
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers(sanitizeAnswers(JSON.parse(saved), defaults));
      } catch {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);
  useEffect(() => { window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(answers)); }, [answers]);
  useEffect(() => {
    const sendPageView = () => trackPageView(view);
    sendPageView();
    window.addEventListener(ANALYTICS_READY_EVENT, sendPageView);
    return () => window.removeEventListener(ANALYTICS_READY_EVENT, sendPageView);
  }, [view]);

  const budget = useMemo(() => calculateBudget(answers), [answers]);
  const recommendations = useMemo(() => buildRecommendations(answers, market.profiles, budget), [answers, budget]);
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const startAnalysis = () => { trackAnalyticsEvent('start_analysis'); setStep(0); navigate('questionnaire'); };
  const example = () => { trackAnalyticsEvent('view_example'); setAnswers(defaults); navigate('results'); };
  const applyScenario = (kind: 'budget' | 'age' | 'commute' | 'rooms') => {
    trackAnalyticsEvent('adjust_scenario');
    setAnswers((current) => ({ ...current,
      downPayment: kind === 'budget' ? current.downPayment + 100 : current.downPayment,
      maxAge: kind === 'age' ? current.maxAge + 10 : current.maxAge,
      maxCommute: kind === 'commute' ? current.maxCommute + 10 : current.maxCommute,
      rooms: kind === 'rooms' ? Math.max(1, current.rooms - 1) : current.rooms,
    }));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const analysisActive = view === 'questionnaire' || view === 'results';

  return <main className="ambient-main min-h-screen overflow-x-clip bg-[#04070d] text-[#eef3f8]">
    <ScrollAtmosphere view={view} />
    <HouseAudioControl />
    <AnalyticsConsent />
    <header className="sticky top-0 z-30 border-b border-[#263246] bg-[#04070d]/92 backdrop-blur-md">
      <div className="content-container relative flex h-20 items-center">
        <button onClick={() => navigate('home')} className="font-data text-lg font-bold tracking-tight" aria-label="返回好宅指南首頁">好宅<span className="text-[#ff6b57]">指南</span><small className="ml-2 text-[10px] tracking-[.16em] text-[#7f8fa6]">台中首購</small></button>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-xl border border-[#263246] bg-[#0b1220] p-1 text-sm md:flex" aria-label="主要導覽">
          <button aria-current={analysisActive ? 'page' : undefined} className={`rounded-lg px-4 py-2.5 ${analysisActive ? 'bg-[#ff6b57] text-[#060910]' : 'text-[#a8b5c6] hover:text-white'}`} onClick={() => navigate('questionnaire')}>適居分析</button>
          <button aria-current={view === 'market' ? 'page' : undefined} className={`rounded-lg px-4 py-2.5 ${view === 'market' ? 'bg-[#ff6b57] text-[#060910]' : 'text-[#a8b5c6] hover:text-white'}`} onClick={() => navigate('market')}>台中行情</button>
          <button aria-current={view === 'method' ? 'page' : undefined} className={`rounded-lg px-4 py-2.5 ${view === 'method' ? 'bg-[#ff6b57] text-[#060910]' : 'text-[#a8b5c6] hover:text-white'}`} onClick={() => navigate('method')}>方法與資料</button>
        </nav>
      </div>
    </header>

    {view === 'home' && <Home onStart={startAnalysis} onExample={example} onMarket={() => navigate('market')} />}
    {view === 'questionnaire' && <div className="scroll-focus-zone scroll-tone-dark tech-shell px-4 py-9 md:py-14" data-scroll-focus data-scroll-active="false"><Questionnaire answers={answers} step={step} onChange={setAnswers} onStep={setStep} onClose={() => navigate('home')} onComplete={() => { trackAnalyticsEvent('complete_analysis'); navigate('results'); }} /></div>}
    {view === 'results' && <Results answers={answers} budget={budget} recommendations={recommendations} onEdit={() => navigate('questionnaire')} onScenario={applyScenario} />}
    {view === 'market' && <MarketDashboard data={market} />}
    {view === 'method' && <MethodPage data={market} />}

    <footer className="scroll-focus-zone scroll-tone-light tech-shell border-t border-[#263246]" data-scroll-focus data-scroll-active="false">
      <div className="content-container relative z-10 flex flex-wrap items-center justify-between gap-3 py-8 font-data text-xs text-[#7f8fa6]"><span>好宅指南・台中首購適居分析企業專題</span><span>資料僅供決策參考，不構成鑑價、授信或購屋建議。</span></div>
    </footer>
  </main>;
}

'use client';

import { useState } from 'react';
import { monthlyPayment, searchText } from '../lib/recommendation';
import type { Answers, Budget, Recommendation } from '../types';

type Props = {
  answers: Answers;
  budget: Budget;
  recommendations: Recommendation[];
  periodLabel: string;
  onEdit: () => void;
  onScenario: (kind: 'budget' | 'age' | 'commute' | 'rooms') => void;
};

export default function Results({ answers, budget, recommendations, periodLabel, onEdit, onScenario }: Props) {
  const [expanded, setExpanded] = useState(0);
  const [copied, setCopied] = useState('');
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(''), 1400);
  };

  const budgets = [
    { label: '舒適預算', value: budget.comfortable, payment: budget.comfortablePayment, accent: 'border-[#416958] text-[#b7dcc7]', code: 'SAFE' },
    { label: '可接受預算', value: budget.acceptable, payment: budget.acceptablePayment, accent: 'border-[#7a5a46] text-[#ffc0a8]', code: 'BALANCED' },
    { label: '高風險上限', value: budget.riskLimit, payment: budget.riskPayment, accent: 'border-[#7b4039] text-[#ff9f8f]', code: 'LIMIT' },
  ];

  return <div className="tech-shell min-h-[70svh] py-12 md:py-16">
    <div className="content-container relative z-10">
      <section className="scroll-focus-zone scroll-tone-dark flex flex-wrap items-end justify-between gap-6 py-3" data-scroll-focus data-scroll-active="false">
        <div><p className="eyebrow">Your First-Home Report</p><h1 className="display-title mt-3 text-4xl md:text-5xl">台中可行購屋方向</h1><p className="body-copy mt-4 max-w-3xl text-sm">以{periodLabel}的台中實價成交統計為基準，先通過必要條件，再進行加權排序。</p></div>
        <button onClick={onEdit} className="btn-secondary">修改需求</button>
      </section>

      <section className="scroll-focus-zone scroll-tone-light mt-10 grid gap-3 py-4 md:grid-cols-3" data-scroll-focus data-scroll-active="false" aria-label="購屋預算區間">
        {budgets.map((item) => <article className={`tech-panel-soft border-t-2 p-5 ${item.accent}`} key={item.label}>
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#eef3f8]">{item.label}</p><span className="font-data text-[10px] tracking-[.16em]">{item.code}</span></div>
          <p className="data-number mt-5 text-3xl font-bold">{item.value.toLocaleString()} <small className="text-sm">萬</small></p>
          <p className="mt-2 text-xs text-[#94a3b8]">估計本息月付 <span className="data-number">{item.payment.toFixed(1)} 萬/月</span></p>
          <p className="mt-2 text-[10px] font-bold tracking-wide text-[#7f8fa6]">{item.value >= 4_000 ? '高價住宅・最高貸款 3 成' : '一般首購情境・最高貸款 8 成'}</p>
        </article>)}
      </section>
      <p className="mt-4 max-w-5xl text-xs leading-6 text-[#7f8fa6]">假設貸款{answers.loanYears}年、年利率{answers.interestRate}%，並從自備款中保留{answers.reserve}萬元及30萬元基本交易成本。未滿4,000萬元採最高8成的首購情境；達4,000萬元時，依臺中高價住宅規則改採最高3成且無寬限期。本站以試算總價初步判斷，實際應以銀行鑑價或買賣金額孰低及個案核貸為準。<a className="ml-1 text-[#72c7f2] underline decoration-[#385269] underline-offset-2 hover:text-white" href="https://www.cbc.gov.tw/tw/cp-4223-124873-79d4c-1.html" target="_blank" rel="noreferrer">中央銀行規定 ↗</a></p>

      <section className="scroll-focus-zone scroll-tone-dark mt-14 py-4" data-scroll-focus data-scroll-active="false">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#263246] pb-5"><h2 className="font-data text-2xl font-bold">推薦 Top {recommendations.length}</h2><span className="rounded-md border border-[#416958] px-3 py-1.5 font-data text-xs font-bold text-[#b7dcc7]">✓ Hard Gate 已套用</span></div>
        {recommendations.length === 0 ? <div className="tech-panel mt-6 border-[#70453d] p-8"><p className="eyebrow">No Supported Match</p><h3 className="font-data mt-3 text-xl font-bold">目前沒有足夠資料支持的方案</h3><p className="body-copy mt-3 max-w-2xl text-sm">可能是必要條件與高風險預算上限交集過小。建議先增加通勤時間、接受較高屋齡，或重新檢查最低房數。</p><button onClick={onEdit} className="btn-primary mt-6">返回調整需求</button></div> : <div className="mt-6 space-y-4">{recommendations.map((rec, index) => {
          const isOpen = expanded === index;
          const principal = Math.max(rec.medianTotalWan - budget.availableCash, 0);
          const payment = monthlyPayment(principal, answers.interestRate, answers.loanYears);
          const detailsId = `recommendation-details-${index}`;
          const query = searchText(rec);
          return <article key={`${rec.district}-${rec.building}`} className="tech-panel overflow-hidden">
            <button className="grid w-full gap-4 p-5 text-left md:grid-cols-[76px_1fr_auto] md:items-center md:p-6" onClick={() => setExpanded(isOpen ? -1 : index)} aria-expanded={isOpen} aria-controls={detailsId}>
              <div className="data-number flex h-[4.5rem] w-[4.5rem] items-center justify-center border border-[#ff6b57] bg-[#ff6b57]/8 text-2xl font-bold text-[#ff8b78]">{rec.total}</div>
              <div><p className="font-data text-xs font-bold text-[#ff8b78]">RANK {String(index + 1).padStart(2, '0')}・可信度 {rec.confidence}</p><h3 className="font-data mt-2 text-xl font-bold">{rec.district}・{rec.building}{rec.rooms}房</h3><p className="body-copy mt-2 text-sm">成交中位 {rec.medianTotalWan.toLocaleString()} 萬｜中間50%約 {rec.lowTotalWan.toLocaleString()}–{rec.highTotalWan.toLocaleString()} 萬｜約 {rec.medianAreaPing} 坪</p></div>
              <span className="font-data text-sm font-bold text-[#72c7f2]">{isOpen ? '收起驗算 ↑' : '查看驗算 ↓'}</span>
            </button>
            {isOpen ? <div id={detailsId} className="border-t border-[#263246] bg-[#08101c] p-5 md:p-6">
              <div className="grid gap-7 lg:grid-cols-[1.2fr_.8fr]">
                <div><h4 className="font-data font-bold">適配度驗算</h4><div className="mt-5 space-y-4">{rec.parts.map((part) => <div key={part.key} className="grid grid-cols-[90px_1fr_48px] items-center gap-3 text-xs"><span className="font-bold">{part.label}</span><div className="h-1.5 bg-[#1b2637]"><div className="h-full bg-[#ff6b57]" style={{ width: `${part.score}%` }} /></div><span className="data-number text-right text-[#72c7f2]">{part.score}</span></div>)}</div><p className="mt-5 text-xs leading-5 text-[#7f8fa6]">總分＝各指標分數 × 你的偏好權重。公開環境風險尚未接入，不參與本版排序。</p></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><div className="tech-panel-soft border-[#416958] p-4 text-sm leading-6 text-[#b7dcc7]"><b className="font-data text-[#eef3f8]">推薦原因</b><br />{rec.reasons.join('；')}</div><div className="tech-panel-soft border-[#65473b] p-4 text-sm leading-6 text-[#d8b2a7]"><b className="font-data text-[#eef3f8]">主要犧牲</b><br />{rec.sacrifices.length ? rec.sacrifices.join('；') : '目前沒有明顯超出偏好的項目。'}</div></div>
              </div>
              <div className="mt-6 grid border-y border-[#263246] sm:grid-cols-4">{[
                ['同類樣本', `${rec.count.toLocaleString()} 筆`],
                ['單價中位', `${rec.medianUnitWanPing} 萬/坪`],
                ['通勤級距', `約 ${rec.commuteMinutes} 分鐘`],
                ['中位價月付', `${payment.toFixed(1)} 萬`],
              ].map(([label, value]) => <div key={label} className="border-b border-[#263246] py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:px-4 sm:first:pl-0 sm:last:border-r-0"><small className="text-[#7f8fa6]">{label}</small><b className="data-number mt-2 block text-sm text-[#eef3f8]">{value}</b></div>)}</div>
              <div className="tech-panel-soft mt-6 p-5"><p className="font-data text-sm font-bold">建議外部搜尋條件</p><p className="body-copy mt-3 break-words text-sm">{query}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => copy(query)} className="btn-primary min-h-0 px-4 py-2 text-xs"><span aria-live="polite">{copied === query ? '已複製 ✓' : '複製條件'}</span></button><a href="https://sale.591.com.tw/?shType=list&regionid=8" target="_blank" rel="noreferrer" className="btn-secondary min-h-0 px-4 py-2 text-xs">前往591台中售屋 ↗</a><a href="https://www.rakuya.com.tw/sell" target="_blank" rel="noreferrer" className="btn-secondary min-h-0 px-4 py-2 text-xs">前往樂屋網 ↗</a></div></div>
            </div> : null}
          </article>;
        })}</div>}
      </section>

      <section className="scroll-focus-zone scroll-tone-light tech-panel mt-12 border-[#465048] p-6 md:p-8" data-scroll-focus data-scroll-active="false"><p className="eyebrow">Scenario Lab</p><h2 className="font-data mt-3 text-xl font-bold">如果改變一個條件，結果會怎樣？</h2><p className="body-copy mt-2 text-sm">點一下立即重新分析，讓取捨變得具體。</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ['budget', '自備款 +100萬'], ['age', '可接受屋齡 +10年'], ['commute', '通勤上限 +10分鐘'], ['rooms', '最低房數 -1房'],
      ].map(([kind, label]) => <button key={kind} onClick={() => onScenario(kind as 'budget' | 'age' | 'commute' | 'rooms')} disabled={kind === 'rooms' && answers.rooms <= 1} className="choice-button font-data text-sm font-bold disabled:opacity-35">{label} →</button>)}</div></section>
    </div>
  </div>;
}

'use client';

import { useId, useRef, useState } from 'react';
import type { Answers, BuildingType } from '../types';

type Props = {
  answers: Answers;
  step: number;
  onChange: (answers: Answers) => void;
  onStep: (step: number) => void;
  onComplete: () => void;
  onClose: () => void;
};

const buildings: BuildingType[] = ['住宅大樓', '華廈', '公寓', '透天厝'];
const hubs = ['市政府', '台中車站', '中科', '高鐵台中站', '豐原車站'];

function NumericField({ label, value, unit, min = 0, max = 9999, step = 1, hint, integerOnly = false, selectOnFocus = false, replaceOnFirstInput = false, deferMinWhileEditing = false, showStepper = false, onChange }: {
  label: string; value: number; unit: string; min?: number; max?: number; step?: number; hint?: string; integerOnly?: boolean; selectOnFocus?: boolean; replaceOnFirstInput?: boolean; deferMinWhileEditing?: boolean; showStepper?: boolean; onChange: (value: number) => void;
}) {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const [draft, setDraft] = useState(String(value));
  const replaceOnNextInputRef = useRef(false);
  const focusedDraftRef = useRef('');

  const updateDraft = (rawValue: string) => {
    let preparedValue = rawValue;

    if (replaceOnFirstInput && replaceOnNextInputRef.current && rawValue !== '') {
      const focusedDraft = focusedDraftRef.current;
      if (rawValue.startsWith(focusedDraft) && rawValue.length > focusedDraft.length) {
        preparedValue = rawValue.slice(focusedDraft.length);
      }
    }

    if (preparedValue === '') {
      setDraft(deferMinWhileEditing ? '' : String(min));
      onChange(min);
      if (replaceOnFirstInput) {
        replaceOnNextInputRef.current = true;
        focusedDraftRef.current = String(min);
      }
      return;
    }

    const validInput = integerOnly ? /^\d*$/.test(preparedValue) : /^\d*(?:\.\d*)?$/.test(preparedValue);
    if (!validInput) return;
    replaceOnNextInputRef.current = false;

    const normalized = preparedValue === '.'
      ? '0.'
      : preparedValue.replace(/^0+(?=\d)/, '');
    const nextValue = Number(normalized);
    if (!Number.isFinite(nextValue)) return;

    if (deferMinWhileEditing && nextValue < min) {
      setDraft(normalized);
      onChange(min);
      return;
    }

    const boundedValue = Math.min(max, Math.max(min, nextValue));
    setDraft(boundedValue === nextValue ? normalized : String(boundedValue));
    onChange(boundedValue);
  };

  const applyStep = (direction: 1 | -1) => {
    const steppedValue = Number((value + direction * step).toFixed(10));
    const nextValue = Math.min(max, Math.max(min, steppedValue));
    setDraft(String(nextValue));
    onChange(nextValue);
  };

  const armFirstInputReplacement = () => {
    if (!replaceOnFirstInput) return;
    replaceOnNextInputRef.current = true;
    focusedDraftRef.current = draft;
  };

  return <div className="block">
    <label htmlFor={fieldId} className="text-sm font-bold text-[#dce5ee]">{label}</label>
    <div className={`control-shell${showStepper ? ' control-shell-with-stepper' : ''}`}>
      <input
        id={fieldId}
        aria-describedby={hint ? hintId : undefined}
        className="data-number min-w-0 flex-1 bg-transparent py-3.5 text-base font-bold text-[#eef3f8] outline-none"
        type="text"
        inputMode={integerOnly ? 'numeric' : 'decimal'}
        pattern={integerOnly ? '[0-9]*' : '[0-9]*[.]?[0-9]*'}
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={draft === '' ? value : Number(draft)}
        value={draft}
        onFocus={(event) => {
          armFirstInputReplacement();
          if (selectOnFocus) event.currentTarget.select();
        }}
        onClick={(event) => {
          armFirstInputReplacement();
          if (selectOnFocus) event.currentTarget.select();
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
          event.preventDefault();
          const direction = event.key === 'ArrowUp' ? 1 : -1;
          applyStep(direction);
        }}
        onChange={(event) => updateDraft(event.target.value)}
        onBlur={() => setDraft(String(value))}
      />
      <span className="font-data text-xs font-bold text-[#94a3b8]">{unit}</span>
      {showStepper ? <span className="numeric-stepper">
        <button type="button" className="numeric-stepper-button" aria-label={`增加 ${step} ${unit}`} disabled={value >= max} onClick={() => applyStep(1)}><span aria-hidden="true">▲</span></button>
        <button type="button" className="numeric-stepper-button" aria-label={`減少 ${step} ${unit}`} disabled={value <= min} onClick={() => applyStep(-1)}><span aria-hidden="true">▼</span></button>
      </span> : null}
    </div>
    {hint ? <small id={hintId} className="mt-2 block leading-5 text-[#7f8fa6]">{hint}</small> : null}
  </div>;
}

function Choice({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" aria-pressed={active} data-active={active} className="choice-button text-sm font-bold" onClick={onClick}>{children}</button>;
}

export default function Questionnaire({ answers, step, onChange, onStep, onComplete, onClose }: Props) {
  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => onChange({ ...answers, [key]: value });
  const canContinue = answers.downPayment > answers.reserve + 30 && answers.monthlyIncome > answers.monthlyDebt + answers.fixedExpense;
  const titles = ['財務基礎', '家庭與空間', '通勤條件', '房屋接受度', '決策偏好'];
  const blocked = (step === 0 && !canContinue) || (step === 3 && answers.buildings.length === 0);

  return <section className="tech-panel relative z-10 mx-auto w-full max-w-3xl p-5 shadow-[0_24px_80px_rgba(0,0,0,.35)] md:p-8" aria-labelledby="question-title">
    <div className="flex items-start justify-between gap-4 border-b border-[#263246] pb-5">
      <div>
        <p className="eyebrow">Step {String(step + 1).padStart(2, '0')} / 05・{titles[step]}</p>
        <h1 id="question-title" className="font-data mt-3 text-2xl font-bold text-[#eef3f8]">建立你的首購輪廓</h1>
      </div>
      <button onClick={onClose} className="rounded-md border border-transparent px-3 py-2 text-sm text-[#94a3b8] hover:border-[#263246] hover:text-white">稍後再填</button>
    </div>

    <div className="mt-5 h-1 overflow-hidden bg-[#060910]" aria-label={`問卷完成 ${String((step + 1) * 20)}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={(step + 1) * 20}><div className="h-full bg-[#ff6b57] transition-transform duration-300" style={{ transform: `scaleX(${(step + 1) / 5})`, transformOrigin: 'left' }} /></div>

    <div className="mt-8 min-h-[360px]">
      {step === 0 && <div className="space-y-6">
        <div><h2 className="font-data text-xl font-bold">先確認安全購屋範圍</h2><p className="body-copy mt-2 max-w-2xl text-sm">所有金額都能修改。系統會保留緊急預備金與基本交易成本，再推算三段預算。</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumericField label="目前可用自備款" value={answers.downPayment} unit="萬元" max={999_999} onChange={(value) => update('downPayment', value)} />
          <NumericField label="希望保留的緊急資金" value={answers.reserve} unit="萬元" onChange={(value) => update('reserve', value)} />
          <NumericField label="家庭每月稅後收入" value={answers.monthlyIncome} unit="萬元" step={0.1} onChange={(value) => update('monthlyIncome', value)} />
          <NumericField label="每月其他貸款還款" value={answers.monthlyDebt} unit="萬元" step={0.1} onChange={(value) => update('monthlyDebt', value)} />
          <NumericField label="每月固定生活支出" value={answers.fixedExpense} unit="萬元" step={0.1} onChange={(value) => update('fixedExpense', value)} />
          <div className="grid grid-cols-2 gap-3">
            <NumericField label="貸款年期" value={answers.loanYears} unit="年" min={10} max={40} step={5} showStepper onChange={(value) => update('loanYears', value)} />
            <NumericField label="利率假設" value={answers.interestRate} unit="%" min={0} max={10} step={0.1} onChange={(value) => update('interestRate', value)} />
          </div>
        </div>
        {!canContinue ? <p id="continue-help" role="alert" className="tech-panel-soft border-[#7c473d] p-4 text-sm font-bold leading-6 text-[#ffb29f]"><span className="font-data mr-2 text-[#ff6b57]">!</span>自備款需大於預留資金加30萬元交易成本，且收入需高於貸款與固定支出。</p> : null}
      </div>}

      {step === 1 && <div className="space-y-7">
        <div><h2 className="font-data text-xl font-bold">這個家要容納誰？</h2><p className="body-copy mt-2 text-sm">最低房數會成為 Hard Gate，不會被其他高分抵銷。</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumericField label="預計居住人數" value={answers.residents} unit="人" min={1} max={9} integerOnly selectOnFocus replaceOnFirstInput showStepper onChange={(value) => update('residents', value)} />
          <NumericField label="最低需要房數" value={answers.rooms} unit="房" min={1} max={5} integerOnly selectOnFocus replaceOnFirstInput showStepper onChange={(value) => update('rooms', value)} />
        </div>
        <div><p className="mb-3 text-sm font-bold">必要設備</p><div className="grid gap-3 sm:grid-cols-2">
          <Choice active={answers.elevator} onClick={() => update('elevator', !answers.elevator)}>電梯必須有<br /><small className="font-normal text-[#7f8fa6]">開啟後排除公寓及透天</small></Choice>
          <Choice active={answers.parking} onClick={() => update('parking', !answers.parking)}>車位必須有<br /><small className="font-normal text-[#7f8fa6]">只保留車位成交比例較高的類型</small></Choice>
        </div></div>
      </div>}

      {step === 2 && <div className="space-y-7">
        <div><h2 className="font-data text-xl font-bold">主要通勤目的地在哪裡？</h2><p className="body-copy mt-2 text-sm">免費版使用生活圈距離級距估算，不是假裝成即時導航時間。</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{hubs.map((hub) => <Choice key={hub} active={answers.commuteHub === hub} onClick={() => update('commuteHub', hub)}>{hub}</Choice>)}</div>
        <NumericField label="可接受單程通勤時間" value={answers.maxCommute} unit="分鐘" min={10} max={90} step={5} selectOnFocus deferMinWhileEditing showStepper onChange={(value) => update('maxCommute', value)} />
        <div className="tech-panel-soft border-[#345b73] p-4 text-sm leading-6 text-[#a7def8]"><b className="font-data text-[#eef3f8]">可信度 B：</b>通勤為行政區級距推估。正式找房時仍應使用實際地址，在常用地圖服務確認尖峰時段路線。</div>
      </div>}

      {step === 3 && <div className="space-y-7">
        <div><h2 className="font-data text-xl font-bold">你願意接受哪些房屋？</h2><p className="body-copy mt-2 text-sm">至少選擇一種建物類型。</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{buildings.map((building) => <Choice key={building} active={answers.buildings.includes(building)} onClick={() => update('buildings', answers.buildings.includes(building) ? answers.buildings.filter((item) => item !== building) : [...answers.buildings, building])}>{building}</Choice>)}</div>
        {answers.buildings.length === 0 ? <p id="continue-help" role="alert" className="text-sm font-bold text-[#ffb29f]">請至少選擇一種建物類型，才能繼續。</p> : null}
        <NumericField label="可接受最高屋齡" value={answers.maxAge} unit="年" min={0} max={60} step={5} showStepper onChange={(value) => update('maxAge', value)} hint="屋齡資料不足的組合會標示為待確認，不會被當成已知新屋。" />
      </div>}

      {step === 4 && <div className="space-y-7">
        <div><h2 className="font-data text-xl font-bold">最後，告訴我們你在意什麼</h2><p className="body-copy mt-2 text-sm">1代表較不重要，5代表非常重要。財務安全仍由 Hard Gate 先行保護。</p></div>
        <div className="space-y-5">{([
          ['finance', '財務餘裕'], ['commute', '通勤便利'], ['space', '家庭空間'], ['lifestyle', '生活機能'], ['condition', '屋況與屋齡'],
        ] as const).map(([key, label]) => <label className="grid grid-cols-[90px_1fr_28px] items-center gap-3" key={key}><span className="text-sm font-bold">{label}</span><input aria-valuetext={`${answers.priorities[key]}，最高為5`} type="range" min="1" max="5" value={answers.priorities[key]} onChange={(event) => update('priorities', { ...answers.priorities, [key]: Number(event.target.value) })} /><b className="data-number text-[#ff6b57]">{answers.priorities[key]}</b></label>)}</div>
        <div className="tech-panel-soft border-[#6a4b39] p-4 text-sm leading-6 text-[#d8b2a7]">分析只會使用結構化規則與政府成交統計，不會讓語言模型猜測房價或替你做購屋保證。</div>
      </div>}
    </div>

    <div className="mt-8 flex items-center justify-between border-t border-[#263246] pt-5">
      <button type="button" onClick={() => onStep(Math.max(step - 1, 0))} disabled={step === 0} className="btn-secondary disabled:invisible">← 上一步</button>
      {step < 4 ? <button type="button" aria-describedby={blocked ? 'continue-help' : undefined} disabled={blocked} onClick={() => onStep(step + 1)} className="btn-primary disabled:opacity-40">下一步 →</button> : <button type="button" onClick={onComplete} className="btn-primary">產生分析報告 →</button>}
    </div>
  </section>;
}

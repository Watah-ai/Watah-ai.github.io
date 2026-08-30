import type { MarketData } from '../types';

export default function MarketDashboard({ data }: { data: MarketData }) {
  const max = Math.max(...data.districts.map((item) => item.medianUnitWanPing));
  return <div className="tech-shell min-h-[70svh] py-12 md:py-16">
    <div className="content-container relative z-10">
      <section className="scroll-focus-zone scroll-tone-dark py-3" data-scroll-focus data-scroll-active="false">
        <p className="eyebrow">Taichung Market / 2026 H1</p>
        <h1 className="display-title mt-3 text-4xl md:text-5xl">台中行政區成交概況</h1>
        <p className="body-copy mt-4 max-w-3xl text-sm">以{data.metadata.period}住宅用途成交資料計算。以下是成交統計，不是目前待售開價。</p>
      </section>

      <section className="scroll-focus-zone scroll-tone-light mt-10 grid gap-7 py-4 lg:grid-cols-[1fr_320px]" data-scroll-focus data-scroll-active="false">
        <section className="tech-panel p-4 md:p-7" aria-label="行政區每坪中位價格">
          <div className="grid grid-cols-[4.5rem_minmax(8rem,1fr)_3.5rem] gap-3 border-b border-[#263246] pb-3 font-data text-xs font-bold text-[#7f8fa6]"><span>行政區</span><span>每坪中位價格</span><span className="text-right">樣本</span></div>
          <div className="mt-4 space-y-4">{data.districts.map((item) => <div key={item.district} className="grid grid-cols-[4.5rem_minmax(8rem,1fr)_3.5rem] items-center gap-3 text-sm">
            <b>{item.district}</b>
            <div className="flex min-w-0 items-center gap-3"><div className="h-1.5 min-w-0 flex-1 bg-[#1b2637]"><div className="h-full bg-[#ff6b57]" style={{ width: `${item.medianUnitWanPing / max * 100}%` }} /></div><span className="data-number w-[4.6rem] shrink-0 text-right font-bold text-[#72c7f2]">{item.medianUnitWanPing}萬</span></div>
            <span className="data-number text-right text-xs text-[#7f8fa6]">{item.count.toLocaleString()}</span>
          </div>)}</div>
        </section>

        <aside className="space-y-4">
          <div className="tech-panel border-t-2 border-t-[#ff6b57] p-6"><p className="font-data text-xs tracking-[.12em] text-[#94a3b8]">CLEAN RESIDENTIAL SALES</p><p className="data-number mt-4 text-4xl font-bold text-[#ff8b78]">{data.metadata.generatedFromRows.toLocaleString()}</p><p className="mt-2 text-xs leading-5 text-[#7f8fa6]">筆資料用於本版統計與推薦</p></div>
          <div className="tech-panel p-6"><h2 className="font-data font-bold">如何閱讀</h2><ul className="body-copy mt-4 space-y-3 text-sm"><li>・中位數比平均數較不受極端交易影響。</li><li>・不同房型與屋齡不可只比較行政區單價。</li><li>・樣本少的區域，結論不確定性較高。</li></ul></div>
          <div className="tech-panel-soft border-[#65473b] p-6 text-sm leading-6 text-[#d8b2a7]"><b className="font-data text-[#eef3f8]">資料限制</b><br />成交時間、特殊交易、車位拆分及新成屋集中交屋都會影響統計。網站不把這些數字當作銀行鑑價。</div>
        </aside>
      </section>
    </div>
  </div>;
}

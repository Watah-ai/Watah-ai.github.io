import type { MarketData } from '../types';

export default function MethodPage({ data }: { data: MarketData }) {
  const methods = [
    ['01', '先計算負擔能力', '依收入、負債、固定支出、自備款、預留資金、利率與年期，產生舒適、可接受與高風險三段預算。'],
    ['02', 'Hard Gate 先行', '總價、最低房數、電梯、車位、建物類型、屋齡與通勤等必要條件不符時，直接排除，不以其他高分抵銷。'],
    ['03', '對可行方案加權', '依財務、通勤、空間、生活機能與屋況條件計算適配度；權重來自使用者問卷，所有分數可展開驗算。'],
    ['04', '呈現理由與犧牲', '每項推薦不只提供總分，也說明成交樣本、價格帶、主要優點、主要取捨與資料可信度。'],
  ];
  return <div className="tech-shell min-h-[70svh] py-12 md:py-16">
    <div className="content-container relative z-10 max-w-4xl">
      <section className="scroll-focus-zone scroll-tone-dark py-3" data-scroll-focus data-scroll-active="false">
        <p className="eyebrow">Method & Sources</p>
        <h1 className="display-title mt-3 text-4xl md:text-5xl">分析方法與資料透明度</h1>

        <div className="mt-12 border-y border-[#263246]">{methods.map(([number, title, text]) => <div key={number} className="grid gap-4 border-b border-[#263246] py-7 last:border-b-0 sm:grid-cols-[5rem_1fr]">
          <span className="data-number text-3xl text-[#ff6b57]">{number}</span>
          <div><h2 className="font-data text-lg font-bold">{title}</h2><p className="body-copy mt-3 text-sm">{text}</p></div>
        </div>)}</div>
      </section>

      <section className="scroll-focus-zone scroll-tone-light tech-panel mt-10 border-t-2 border-t-[#72c7f2] p-6 md:p-8" data-scroll-focus data-scroll-active="false">
        <p className="eyebrow text-[#72c7f2]">Official Dataset</p>
        <h2 className="font-data mt-3 text-xl font-bold">本版正式資料來源</h2>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-lg border border-[#263246] bg-[#263246] text-sm sm:grid-cols-2">
          {[
            ['資料集', data.metadata.title],
            ['資料涵蓋期間', data.metadata.period],
            ['提供機關', data.metadata.source],
            ['授權', data.metadata.license],
          ].map(([label, value]) => <div key={label} className="bg-[#111b2a] p-4"><dt className="font-data text-xs text-[#7f8fa6]">{label}</dt><dd className="mt-2 font-bold text-[#eef3f8]">{value}</dd></div>)}
        </dl>
        <p className="body-copy mt-5 text-sm">{data.metadata.note}</p>
        <a href={data.metadata.sourceUrl} target="_blank" rel="noreferrer" className="btn-primary mt-6">查看政府資料集 ↗</a>
      </section>

      <section className="scroll-focus-zone scroll-tone-dark tech-panel-soft mt-6 border-[#65473b] p-6" data-scroll-focus data-scroll-active="false"><h2 className="font-data font-bold text-[#ffc0a8]">尚未接入的資料</h2><p className="mt-3 text-sm leading-7 text-[#bda99d]">生活機能、環境風險與精確通勤仍需要個別公開圖資管線；本版不以假資料補分。通勤只顯示行政區級距推估，環境風險不參與排序。</p></section>
    </div>
  </div>;
}

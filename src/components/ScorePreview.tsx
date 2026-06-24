import type { ScoreBreakdown } from '../game/scoring'

// 出手前的即時分數預覽：顯示牌型、逐項貢獻、總底分 × 總倍率 = 預估分數。
export function ScorePreview({ breakdown }: { breakdown: ScoreBreakdown }) {
  const { hand, chips, mult, total, lines } = breakdown
  return (
    <div className="score-preview">
      <div className="sp-head">
        <span className="sp-hand">{hand.label}</span>
        <span className="sp-formula">
          <b className="chips">{chips}</b> × <b className="mult">{mult}</b> ={' '}
          <b className="sp-total">{total}</b>
        </span>
      </div>
      <div className="sp-lines">
        {lines.map((ln, i) => (
          <div key={i} className={`sp-line ${ln.kind}`}>
            <span className="sp-label">{ln.label}</span>
            <span className="sp-contrib">
              {ln.chips ? <span className="chips">+{ln.chips}底</span> : null}
              {ln.mult ? <span className="mult">+{ln.mult}倍</span> : null}
              {ln.xmult ? <span className="xmult">×{ln.xmult}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

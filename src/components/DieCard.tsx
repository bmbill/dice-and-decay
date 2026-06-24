import type { Die } from '../game/types'
import { KIND_COLOR } from '../game/affixes'
import { RARITY_LABEL } from '../game/loot'

const RARITY_BORDER: Record<string, string> = {
  normal: '#8a837a',
  magic: '#6a8fe6',
  rare: '#e6d35a',
  unique: '#e6925a',
}

const PIP_LAYOUT: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function MiniFace({ pip, wild }: { pip: number; wild?: boolean }) {
  const usesDots = !!PIP_LAYOUT[pip]
  return (
    <div className="mini-face">
      {usesDots ? (
        Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="mini-slot">
            {PIP_LAYOUT[pip].includes(i) ? (
              <span className="mini-pip" style={{ background: wild ? '#e6925a' : '#1a1620' }} />
            ) : null}
          </span>
        ))
      ) : (
        <span className="mini-num" style={{ color: wild ? '#e6925a' : '#1a1620' }}>
          {pip}
        </span>
      )}
    </div>
  )
}

// 一張骰子卡：顯示稀有度、所有面與每面詞綴。
export function DieCard({
  die,
  equipped,
  onToggle,
  onCraft,
  selectableFaces,
  onFaceClick,
  highlightFace,
}: {
  die: Die
  equipped?: boolean
  onToggle?: () => void
  onCraft?: () => void
  selectableFaces?: boolean
  onFaceClick?: (faceIndex: number) => void
  highlightFace?: number | null
}) {
  const border = RARITY_BORDER[die.rarity]
  return (
    <div className={`die-card ${equipped ? 'equipped' : ''}`} style={{ borderColor: border }}>
      <div className="die-card-head">
        <span className="dc-name" style={{ color: border }}>
          {die.name}
        </span>
        <span className="dc-rarity" style={{ color: border }}>
          {RARITY_LABEL[die.rarity]} · {die.faces.length}面
        </span>
      </div>
      <div className="die-card-faces">
        {die.faces.map((f, i) => {
          const kindColor = f.affix?.kind ? KIND_COLOR[f.affix.kind] : '#cfc8be'
          return (
            <div
              key={i}
              className={`dc-face-row ${selectableFaces ? 'selectable' : ''} ${highlightFace === i ? 'highlight' : ''}`}
              onClick={selectableFaces ? () => onFaceClick?.(i) : undefined}
            >
              <MiniFace pip={f.pip} wild={f.affix?.wild} />
              {f.affix ? (
                <span className="dc-affix" style={{ color: kindColor }}>
                  {f.affix.icon} {f.affix.name}
                </span>
              ) : (
                <span className="dc-affix empty">無詞綴</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="dc-buttons">
        {onToggle && (
          <button className={`dc-btn ${equipped ? 'on' : ''}`} onClick={onToggle}>
            {equipped ? '✓ 已上場' : '上場'}
          </button>
        )}
        {onCraft && (
          <button className="dc-btn craft" onClick={onCraft}>
            🔨 改造
          </button>
        )}
      </div>
    </div>
  )
}

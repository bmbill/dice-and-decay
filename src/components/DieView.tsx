import type { RolledDie } from '../game/types'
import { KIND_COLOR } from '../game/affixes'

const RARITY_BORDER: Record<string, string> = {
  normal: '#8a837a',
  magic: '#6a8fe6',
  rare: '#e6d35a',
  unique: '#e6925a',
}

// 骰面點數排版（1-6 的點點位置）；7 以上改顯示數字。
const PIP_LAYOUT: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

export function DieView({
  rolled,
  onClick,
  scoring,
}: {
  rolled: RolledDie
  onClick?: () => void
  scoring?: boolean
}) {
  const face = rolled.die.faces[rolled.faceIndex]
  const affix = face.affix
  const border = RARITY_BORDER[rolled.die.rarity]
  const kindColor = affix?.kind ? KIND_COLOR[affix.kind] : undefined
  const usesDots = !!PIP_LAYOUT[face.pip]

  return (
    <div className={`die ${rolled.held ? 'held' : ''} ${scoring ? 'scoring' : ''}`} onClick={onClick}>
      <div className="die-face" style={{ borderColor: border }}>
        {usesDots ? (
          Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="pip-slot">
              {PIP_LAYOUT[face.pip].includes(i) ? (
                <span className="pip" style={{ background: affix?.wild ? '#d6824a' : '#1a1620' }} />
              ) : null}
            </span>
          ))
        ) : (
          <span className="big-num" style={{ color: affix?.wild ? '#d6824a' : '#1a1620' }}>
            {face.pip}
          </span>
        )}
      </div>
      {affix && (
        <div className="die-affix" style={{ color: kindColor ?? '#cfc8be' }}>
          {affix.icon} {affix.name}
        </div>
      )}
      {rolled.held && <div className="hold-tag">鎖</div>}
    </div>
  )
}

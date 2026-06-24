import { useState } from 'react'
import { useGame } from '../game/store'
import { DieCard } from './DieCard'
import { currencyById, type CurrencyId } from '../game/crafting'

type Mode = null | 'engrave' | 'removeFace'

export function CraftBench({ dieId }: { dieId: string }) {
  const die = useGame((s) => s.collection.find((d) => d.id === dieId))
  const currencies = useGame((s) => s.currencies)
  const closeCraft = useGame((s) => s.closeCraft)
  const craftReroll = useGame((s) => s.craftReroll)
  const craftEngrave = useGame((s) => s.craftEngrave)
  const craftAddFace = useGame((s) => s.craftAddFace)
  const craftRemoveFace = useGame((s) => s.craftRemoveFace)
  const craftAscend = useGame((s) => s.craftAscend)

  const [mode, setMode] = useState<Mode>(null)
  const [engraveFaceIdx, setEngraveFaceIdx] = useState<number | null>(null)

  if (!die) return null
  const have = (id: CurrencyId) => currencies[id] ?? 0

  const resetMode = () => {
    setMode(null)
    setEngraveFaceIdx(null)
  }

  const onFaceClick = (faceIndex: number) => {
    if (mode === 'removeFace') {
      craftRemoveFace(die.id, faceIndex)
      resetMode()
    } else if (mode === 'engrave') {
      setEngraveFaceIdx(faceIndex) // 選好面，跳出點數選擇器
    }
  }

  const pickPip = (pip: number) => {
    if (engraveFaceIdx != null) craftEngrave(die.id, engraveFaceIdx, pip)
    resetMode()
  }

  return (
    <div className="modal-backdrop" onClick={closeCraft}>
      <div className="modal craft-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>🔨 合成台</h3>
          <button className="x" onClick={closeCraft}>
            ✕
          </button>
        </div>

        <div className="craft-die">
          <DieCard die={die} selectableFaces={mode != null} onFaceClick={onFaceClick} highlightFace={engraveFaceIdx} />
        </div>

        {/* 點數選擇器：選好面後出現 */}
        {mode === 'engrave' && engraveFaceIdx != null && (
          <div className="pip-picker">
            <div className="pp-title">把第 {engraveFaceIdx + 1} 面改成幾點？</div>
            <div className="pp-grid">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <button key={n} className="pp-btn" onClick={() => pickPip(n)}>
                  {n}
                </button>
              ))}
            </div>
            <button className="btn ghost wide" onClick={resetMode}>
              取消
            </button>
          </div>
        )}

        {mode && engraveFaceIdx == null && (
          <>
            <p className="craft-prompt">
              ↑ 點選一個面來{mode === 'engrave' ? '刻紋改點數' : '裂解移除'}
            </p>
            <button className="btn ghost wide" onClick={resetMode}>
              取消選面
            </button>
          </>
        )}

        {!mode && (
          <div className="craft-actions">
            <CraftBtn id="reroll" have={have('reroll')} onClick={() => craftReroll(die.id)} />
            <CraftBtn id="engrave" have={have('engrave')} onClick={() => setMode('engrave')} />
            <CraftBtn id="addFace" have={have('addFace')} onClick={() => craftAddFace(die.id)} />
            <CraftBtn id="removeFace" have={have('removeFace')} onClick={() => setMode('removeFace')} />
            <CraftBtn id="ascend" have={have('ascend')} onClick={() => craftAscend(die.id)} />
          </div>
        )}
      </div>
    </div>
  )
}

function CraftBtn({ id, have, onClick }: { id: CurrencyId; have: number; onClick: () => void }) {
  const c = currencyById(id)
  const disabled = have <= 0
  return (
    <button className="craft-btn" onClick={onClick} disabled={disabled} title={c.desc}>
      <span className="cb-icon">{c.icon}</span>
      <span className="cb-name">
        {c.name} <span className="cb-have">×{have}</span>
      </span>
      <span className="cb-desc">{c.desc}</span>
    </button>
  )
}

import { useGame } from '../game/store'
import { DieCard } from './DieCard'
import { CraftBench } from './CraftBench'
import { RARITY_RANK } from '../game/loot'

export function Inventory() {
  const collection = useGame((s) => s.collection)
  const equippedIds = useGame((s) => s.equippedIds)
  const setSize = useGame((s) => s.setSize)
  const currencies = useGame((s) => s.currencies)
  const toggleEquip = useGame((s) => s.toggleEquip)
  const setView = useGame((s) => s.setView)
  const openCraft = useGame((s) => s.openCraft)
  const craftingDieId = useGame((s) => s.craftingDieId)
  const changeSetSize = useGame((s) => s.changeSetSize)
  const resetSave = useGame((s) => s.resetSave)

  const sorted = [...collection].sort((a, b) => {
    const ea = equippedIds.includes(a.id) ? 1 : 0
    const eb = equippedIds.includes(b.id) ? 1 : 0
    if (ea !== eb) return eb - ea
    return RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]
  })

  const full = equippedIds.length >= setSize

  return (
    <div className="inventory">
      <header className="topbar">
        <div className="title">背包 ｜ 骰組</div>
        <button className="btn ghost" onClick={() => setView('battle')}>
          返回戰鬥
        </button>
      </header>

      <div className="inv-status">
        上場 <b className={equippedIds.length === setSize ? 'ok' : 'warn'}>{equippedIds.length}</b> / {setSize}
        ｜ 收藏 {collection.length}
      </div>

      {/* 骰組上限調整（擴充符/凝縮符）*/}
      <div className="setsize-row">
        <span>骰組上限</span>
        <button
          className="ss-btn"
          onClick={() => changeSetSize(-1)}
          disabled={(currencies.shrink ?? 0) <= 0}
          title="凝縮符 -1"
        >
          🔻 -1 ×{currencies.shrink ?? 0}
        </button>
        <b className="ss-num">{setSize}</b>
        <button
          className="ss-btn"
          onClick={() => changeSetSize(1)}
          disabled={(currencies.expand ?? 0) <= 0}
          title="擴充符 +1"
        >
          🎲 +1 ×{currencies.expand ?? 0}
        </button>
      </div>

      {!full && (
        <div className="inv-warn">⚠ 上場未滿 {setSize} 顆，去點骰子「上場」補滿才能正常戰鬥</div>
      )}

      <div className="inv-grid">
        {sorted.map((die) => {
          const eq = equippedIds.includes(die.id)
          return (
            <DieCard
              key={die.id}
              die={die}
              equipped={eq}
              onToggle={() => toggleEquip(die.id)}
              onCraft={() => openCraft(die.id)}
            />
          )
        })}
      </div>

      <button
        className="reset-save"
        onClick={() => {
          if (confirm('確定要清除存檔、重新開始嗎？')) resetSave()
        }}
      >
        🗑 重置存檔（重新開始）
      </button>

      {craftingDieId && <CraftBench dieId={craftingDieId} />}
    </div>
  )
}

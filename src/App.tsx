import { useEffect } from 'react'
import { useGame } from './game/store'
import { evaluateHand, scoreHand } from './game/scoring'
import { isBossLevel } from './game/loot'
import { currencyById, type CurrencyId } from './game/crafting'
import { DieView } from './components/DieView'
import { DieCard } from './components/DieCard'
import { HelpPanel } from './components/HelpPanel'
import { Inventory } from './components/Inventory'
import { ScorePreview } from './components/ScorePreview'

export default function App() {
  const g = useGame()

  useEffect(() => {
    // 等存檔載入完成；若無存檔（背包空），才開新局
    if (g.hydrated && g.collection.length === 0) g.newRun()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.hydrated])

  if (!g.hydrated) return <div className="app loading">載入存檔中…</div>
  if (g.collection.length === 0) return null
  if (g.view === 'inventory') {
    return (
      <div className="app">
        <Inventory />
        {g.showHelp && <HelpPanel onClose={g.toggleHelp} />}
      </div>
    )
  }

  const boss = isBossLevel(g.level)
  // 即時計算當前桌面的完整分數與明細（出手前就看得到）
  const hand = g.rolled.length ? evaluateHand(g.rolled) : null
  const preview = hand ? scoreHand(g.rolled, hand) : null
  const scoringSet = new Set(hand?.scoringIndices ?? [])
  const progress = g.threshold > 0 ? 1 - g.remaining / g.threshold : 0
  const notEnoughDice = g.equippedIds.length < g.setSize

  return (
    <div className="app">
      <header className="topbar">
        <div className="title">DICE &amp; DECAY</div>
        <div className="top-right">
          <button className="icon-btn" onClick={() => g.setView('inventory')} title="背包">
            🎒
          </button>
          <button className="icon-btn" onClick={g.toggleHelp} title="說明">
            ?
          </button>
        </div>
      </header>

      <div className="level-row">
        <span className={`level-tag ${boss ? 'boss' : ''}`}>
          {boss ? `☠ BOSS · 第 ${g.level} 關` : `第 ${g.level} 關`}
        </span>
      </div>

      <section className={`threshold ${boss ? 'boss' : ''}`}>
        <div className="th-row">
          <span>門檻剩餘</span>
          <span className="th-num">{g.remaining}</span>
        </div>
        <div className="th-bar">
          <div className="th-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        <div className="th-meta">
          <span>目標 {g.threshold}</span>
          <span>
            出手 {g.handsLeft} ｜ 重骰 {g.rerollsLeft}
          </span>
        </div>
      </section>

      {/* 即時分數預覽（出手前看完整計算過程）*/}
      {preview && <ScorePreview breakdown={preview} />}

      <section className="table">
        {g.rolled.map((r, i) => (
          <DieView
            key={r.die.id}
            rolled={r}
            scoring={scoringSet.has(i)}
            onClick={() => g.status === 'playing' && g.toggleHold(i)}
          />
        ))}
      </section>

      <p className="hint">點擊骰子可「鎖定」，重骰時保留它。發光的骰子是這次計分的牌。</p>

      <section className="actions">
        {g.status === 'playing' && (
          <>
            <button className="btn" onClick={g.reroll} disabled={g.rerollsLeft <= 0}>
              重骰 ({g.rerollsLeft})
            </button>
            <button className="btn primary" onClick={g.playHand}>
              出手收分 {preview ? `(+${preview.total})` : ''}
            </button>
          </>
        )}
        {g.status === 'lost' && (
          <button className="btn danger" onClick={g.newRun}>
            失敗… 重新開始
          </button>
        )}
      </section>

      {/* 過關 + 掉寶畫面 */}
      {g.status === 'won' && (
        <div className="modal-backdrop">
          <div className="modal loot-modal">
            <h3 className="loot-title">過關！</h3>
            <p className="modal-note">掉落了一顆骰子：</p>
            {g.pendingLoot && (
              <div className="loot-die">
                <DieCard die={g.pendingLoot} />
              </div>
            )}
            {g.pendingCurrency && Object.keys(g.pendingCurrency).length > 0 && (
              <div className="loot-currency">
                <span className="lc-title">改造石：</span>
                {Object.entries(g.pendingCurrency).map(([id, n]) => (
                  <span key={id} className="lc-item">
                    {currencyById(id as CurrencyId).icon} {currencyById(id as CurrencyId).name} ×{n}
                  </span>
                ))}
              </div>
            )}
            <p className="loot-hint">已收進背包，可到 🎒 換上場或改造。</p>
            <button className="btn primary wide" onClick={g.nextLevel}>
              前往第 {g.level + 1} 關 {isBossLevel(g.level + 1) ? '（☠ BOSS）' : ''}
            </button>
          </div>
        </div>
      )}

      {notEnoughDice && g.status === 'playing' && (
        <div className="dice-warn" onClick={() => g.setView('inventory')}>
          ⚠ 上場骰子不足 {g.setSize} 顆，點此前往背包補滿
        </div>
      )}

      {g.showHelp && <HelpPanel onClose={g.toggleHelp} />}
    </div>
  )
}

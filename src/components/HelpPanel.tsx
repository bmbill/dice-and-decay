import { HAND_TABLE } from '../game/scoring'
import { AFFIX_POOL, KIND_COLOR, KIND_LABEL } from '../game/affixes'
import { CURRENCIES } from '../game/crafting'
import type { HandType } from '../game/types'

const ORDER: HandType[] = ['high', 'pair', 'twoPair', 'three', 'straight', 'fullHouse', 'four', 'five']

export function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>玩法說明</h3>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="help-block">
          <p className="modal-note">
            擲骰湊出最好的<b>牌型</b>，把關卡<b>門檻</b>扣到 0 就過關。
          </p>
          <p className="modal-note">
            分數公式：<b className="chips">底分</b> × <b className="mult">倍率</b> = 得分。
            計分骰的<b>點數</b>與<b>面詞綴</b>會加到底分／倍率上。過關掉骰子與改造石。
          </p>
        </div>

        <h4>① 牌型基礎分</h4>
        <table className="hand-table">
          <thead>
            <tr>
              <th>牌型</th>
              <th className="chips">底分</th>
              <th className="mult">倍率</th>
              <th>基礎分</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((t) => {
              const h = HAND_TABLE[t]
              return (
                <tr key={t}>
                  <td>{h.label}</td>
                  <td className="chips">{h.chips}</td>
                  <td className="mult">×{h.mult}</td>
                  <td className="ht-total">{Math.round(h.chips * h.mult)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <h4>② 面詞綴（掛在骰子的某一面上）</h4>
        <ul className="affix-legend">
          {AFFIX_POOL.map((a) => {
            const color = a.kind ? KIND_COLOR[a.kind] : '#e8e2d6'
            return (
              <li key={a.id}>
                <span className="al-icon">{a.icon}</span>
                <span className="al-main">
                  <b style={{ color }}>{a.name}</b>
                  {a.kind && (
                    <span className="al-tag" style={{ color, borderColor: color }}>
                      {KIND_LABEL[a.kind]}
                    </span>
                  )}
                  <span className="al-desc">{a.desc}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <h4>③ 改造石（在背包點骰子的「🔨 改造」使用）</h4>
        <ul className="affix-legend">
          {CURRENCIES.map((c) => (
            <li key={c.id}>
              <span className="al-icon">{c.icon}</span>
              <span className="al-main">
                <b>{c.name}</b>
                <span className="al-desc">{c.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

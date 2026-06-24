import type { RolledDie, HandResult, HandType } from './types'

// 每種牌型的基礎 chips / mult（Balatro 風格：分數 = chips × mult）
export const HAND_TABLE: Record<HandType, { label: string; chips: number; mult: number }> = {
  high: { label: '高骰', chips: 10, mult: 1 },
  pair: { label: '對子', chips: 20, mult: 1.5 },
  twoPair: { label: '兩對', chips: 35, mult: 2 },
  three: { label: '三條', chips: 50, mult: 2.5 },
  straight: { label: '順子', chips: 70, mult: 3 },
  fullHouse: { label: '葫蘆', chips: 90, mult: 3.5 },
  four: { label: '四條', chips: 120, mult: 4 },
  five: { label: '五骰', chips: 180, mult: 6 },
}

// 取得一顆擲出骰的「有效點數」；百搭面回傳 0 代表萬用。
function effectivePip(r: RolledDie): { pip: number; wild: boolean } {
  const face = r.die.faces[r.faceIndex]
  if (face.affix?.wild) return { pip: face.pip, wild: true }
  return { pip: face.pip, wild: false }
}

// 評估桌面上的骰子，回傳最佳牌型與參與計分的骰子索引。
export function evaluateHand(rolled: RolledDie[]): HandResult {
  const n = rolled.length
  const wildIdx: number[] = []
  const counts = new Map<number, number[]>() // pip -> 索引們

  rolled.forEach((r, i) => {
    const { pip, wild } = effectivePip(r)
    if (wild) {
      wildIdx.push(i)
    } else {
      const arr = counts.get(pip) ?? []
      arr.push(i)
      counts.set(pip, arr)
    }
  })

  // 找出最大的同點群組，把百搭併進去衝最大組合
  const groups = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)
  const wildCount = wildIdx.length

  const sizeOf = (idx: number) => (groups[idx]?.[1].length ?? 0)
  const idxOf = (idx: number) => groups[idx]?.[1] ?? []

  const top = sizeOf(0) + wildCount
  const second = sizeOf(1)

  // 順子判定（需要連續 n 個點；百搭可補洞）。原型先支援 5 骰順子。
  const straightResult = detectStraight(rolled, wildIdx)

  let type: HandType = 'high'
  let scoringIndices: number[] = []

  if (top >= 5) {
    type = 'five'
    scoringIndices = [...idxOf(0), ...wildIdx].slice(0, 5)
  } else if (top >= 4) {
    type = 'four'
    scoringIndices = [...idxOf(0), ...wildIdx].slice(0, 4)
  } else if (top >= 3 && second >= 2) {
    type = 'fullHouse'
    scoringIndices = [...idxOf(0), ...wildIdx, ...idxOf(1)].slice(0, 5)
  } else if (straightResult) {
    type = 'straight'
    scoringIndices = straightResult
  } else if (top >= 3) {
    type = 'three'
    scoringIndices = [...idxOf(0), ...wildIdx].slice(0, 3)
  } else if (sizeOf(0) >= 2 && sizeOf(1) >= 2) {
    type = 'twoPair'
    scoringIndices = [...idxOf(0), ...idxOf(1)].slice(0, 4)
  } else if (top >= 2) {
    type = 'pair'
    scoringIndices = [...idxOf(0), ...wildIdx].slice(0, 2)
  } else {
    type = 'high'
    // 取點數最高的單顆
    let best = 0
    let bestPip = -1
    rolled.forEach((r, i) => {
      const p = r.die.faces[r.faceIndex].pip
      if (p > bestPip) {
        bestPip = p
        best = i
      }
    })
    scoringIndices = [best]
  }

  const base = HAND_TABLE[type]
  return { type, label: base.label, baseChips: base.chips, baseMult: base.mult, scoringIndices }
}

// 偵測 5 連順；百搭可補任意點。支援任意點數（改造過的骰子）。
function detectStraight(rolled: RolledDie[], wildIdx: number[]): number[] | null {
  if (rolled.length < 5) return null
  const pipToIdx = new Map<number, number>()
  rolled.forEach((r, i) => {
    if (wildIdx.includes(i)) return
    const p = r.die.faces[r.faceIndex].pip
    if (!pipToIdx.has(p)) pipToIdx.set(p, i)
  })

  const pips = [...pipToIdx.keys()].sort((a, b) => a - b)
  const minPip = pips.length ? pips[0] : 1
  const maxStart = pips.length ? pips[pips.length - 1] : 1

  // 從每個可能起點嘗試 5 連順
  for (let start = minPip; start <= maxStart; start++) {
    let wilds = wildIdx.length
    const used: number[] = []
    let ok = true
    for (let k = 0; k < 5; k++) {
      const p = start + k
      if (pipToIdx.has(p)) {
        used.push(pipToIdx.get(p)!)
      } else if (wilds > 0) {
        wilds--
      } else {
        ok = false
        break
      }
    }
    if (ok) return [...used, ...wildIdx].slice(0, 5)
  }
  return null
}

// 計分明細的單行（給即時預覽顯示計算過程）
export interface ScoreLine {
  kind: 'base' | 'die'
  label: string
  chips?: number // 對 chips 的貢獻
  mult?: number // 對 mult 的加法貢獻
  xmult?: number // 對 mult 的乘法貢獻
}

// 把牌型基礎分 + 參與骰子的點數與面詞綴算成最終分數，並回傳逐項明細。
export interface ScoreBreakdown {
  hand: HandResult
  chips: number
  mult: number
  total: number
  lines: ScoreLine[]
}

export function scoreHand(rolled: RolledDie[], hand: HandResult): ScoreBreakdown {
  let chips = hand.baseChips
  let mult = hand.baseMult // 加法倍率部分
  let xmult = 1 // 乘法倍率部分（最後乘上去）
  const lines: ScoreLine[] = [
    { kind: 'base', label: `牌型 ${hand.label}`, chips: hand.baseChips, mult: hand.baseMult },
  ]

  for (const i of hand.scoringIndices) {
    const face = rolled[i].die.faces[rolled[i].faceIndex]
    const affix = face.affix
    // 計分骰的點數加進 chips，讓大點數有意義
    chips += face.pip
    let addChips = face.pip
    let addMult = 0
    let mulX = 0
    if (affix?.chips) {
      chips += affix.chips
      addChips += affix.chips
    }
    if (affix?.mult) {
      mult += affix.mult
      addMult += affix.mult
    }
    if (affix?.xmult) {
      xmult *= affix.xmult
      mulX = affix.xmult
    }
    lines.push({
      kind: 'die',
      label: affix ? `${face.pip}點 · ${affix.name}` : `${face.pip}點`,
      chips: addChips,
      mult: addMult || undefined,
      xmult: mulX || undefined,
    })
  }

  // 最終倍率 = 加法倍率 × 乘法倍率
  const finalMult = mult * xmult
  const total = Math.round(chips * finalMult)
  return { hand, chips, mult: Math.round(finalMult * 100) / 100, total, lines }
}

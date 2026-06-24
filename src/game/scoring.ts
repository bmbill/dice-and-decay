import type { RolledDie, HandResult, HandType } from './types'

// 每種牌型的基礎 chips / mult（Balatro 風格：分數 = chips × mult）
// 6+ 骰的牌型（六骰、長順…）需要用擴充符把骰組帶大才湊得出，回報也更高。
export const HAND_TABLE: Record<HandType, { label: string; chips: number; mult: number }> = {
  high: { label: '高骰', chips: 10, mult: 1 },
  pair: { label: '對子', chips: 20, mult: 1.5 },
  twoPair: { label: '兩對', chips: 35, mult: 2 },
  three: { label: '三條', chips: 50, mult: 2.5 },
  straight: { label: '順子', chips: 70, mult: 3 },
  fullHouse: { label: '葫蘆', chips: 90, mult: 3.5 },
  four: { label: '四條', chips: 120, mult: 4 },
  straight6: { label: '六連順', chips: 160, mult: 4.5 },
  five: { label: '五骰', chips: 180, mult: 6 },
  six: { label: '六骰', chips: 260, mult: 8 },
  straight7: { label: '七連順', chips: 320, mult: 9 },
  seven: { label: '七骰', chips: 380, mult: 11 },
  eight: { label: '八骰', chips: 520, mult: 15 },
}

// 牌型基礎分（用於比較哪個牌型較好）
function baseScore(t: HandType): number {
  return HAND_TABLE[t].chips * HAND_TABLE[t].mult
}

// N 個同點 → 牌型（上限八骰）
function nKindType(n: number): HandType {
  if (n >= 8) return 'eight'
  if (n === 7) return 'seven'
  if (n === 6) return 'six'
  if (n === 5) return 'five'
  if (n === 4) return 'four'
  if (n === 3) return 'three'
  return 'pair'
}

// 連順長度 → 牌型（5=順子, 6=六連順, 7+=七連順）
function straightType(len: number): HandType {
  if (len >= 7) return 'straight7'
  if (len === 6) return 'straight6'
  return 'straight'
}

// 取得一顆擲出骰的「有效點數」；百搭面回傳 0 代表萬用。
function effectivePip(r: RolledDie): { pip: number; wild: boolean } {
  const face = r.die.faces[r.faceIndex]
  if (face.affix?.wild) return { pip: face.pip, wild: true }
  return { pip: face.pip, wild: false }
}

interface Candidate {
  type: HandType
  indices: number[]
}

// 評估桌面上的骰子：列出所有可湊出的牌型，回傳基礎分最高者。
export function evaluateHand(rolled: RolledDie[]): HandResult {
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

  const groups = [...counts.entries()].map(([, idx]) => idx).sort((a, b) => b.length - a.length)
  const wildCount = wildIdx.length
  const g0 = groups[0] ?? []
  const g1 = groups[1] ?? []

  const candidates: Candidate[] = []

  // N 同點：最大群組 + 全部百搭（上限 8）
  const nKind = Math.min(8, g0.length + wildCount)
  if (nKind >= 2) {
    candidates.push({ type: nKindType(nKind), indices: [...g0, ...wildIdx].slice(0, nKind) })
  } else if (wildCount >= 2) {
    const n = Math.min(8, wildCount)
    candidates.push({ type: nKindType(n), indices: wildIdx.slice(0, n) })
  }

  // 葫蘆：三條 + 對子（百搭優先補三條）
  if (g0.length >= 1) {
    const needTriple = Math.max(0, 3 - g0.length)
    const wildsLeft = wildCount - needTriple
    if (wildsLeft >= 0 && g1.length + wildsLeft >= 2 && g0.length + Math.min(needTriple, wildCount) >= 3) {
      const triple = [...g0, ...wildIdx.slice(0, needTriple)].slice(0, 3)
      const pairWilds = wildIdx.slice(needTriple, needTriple + Math.max(0, 2 - g1.length))
      const pair = [...g1, ...pairWilds].slice(0, 2)
      if (triple.length === 3 && pair.length === 2) {
        candidates.push({ type: 'fullHouse', indices: [...triple, ...pair] })
      }
    }
  }

  // 兩對
  if (g0.length >= 2 && g1.length >= 2) {
    candidates.push({ type: 'twoPair', indices: [...g0.slice(0, 2), ...g1.slice(0, 2)] })
  }

  // 連順（取最長）
  const st = longestStraight(rolled, wildIdx)
  if (st) candidates.push(st)

  // 高骰（保底）
  let bestSingle = 0
  let bestPip = -Infinity
  rolled.forEach((r, i) => {
    const p = r.die.faces[r.faceIndex].pip
    if (p > bestPip) {
      bestPip = p
      bestSingle = i
    }
  })
  candidates.push({ type: 'high', indices: rolled.length ? [bestSingle] : [] })

  // 選基礎分最高的牌型
  const best = candidates.reduce((a, b) => (baseScore(b.type) > baseScore(a.type) ? b : a))
  const base = HAND_TABLE[best.type]
  return { type: best.type, label: base.label, baseChips: base.chips, baseMult: base.mult, scoringIndices: best.indices }
}

// 找出最長的連順（>=5 才算）；百搭可補任意點。支援任意點數（改造過的骰子）。
function longestStraight(rolled: RolledDie[], wildIdx: number[]): Candidate | null {
  if (rolled.length < 5) return null
  const pipToIdx = new Map<number, number>()
  rolled.forEach((r, i) => {
    if (wildIdx.includes(i)) return
    const p = r.die.faces[r.faceIndex].pip
    if (!pipToIdx.has(p)) pipToIdx.set(p, i)
  })

  const pips = [...pipToIdx.keys()].sort((a, b) => a - b)
  if (!pips.length && wildIdx.length < 5) return null
  const minPip = pips.length ? pips[0] : 1
  const maxPip = pips.length ? pips[pips.length - 1] : 1
  const wildTotal = wildIdx.length

  let best: { len: number; indices: number[] } | null = null

  // 起點可由百搭往下墊
  for (let start = minPip - wildTotal; start <= maxPip; start++) {
    let wilds = wildTotal
    const used: number[] = []
    let p = start
    while (true) {
      if (pipToIdx.has(p)) {
        used.push(pipToIdx.get(p)!)
      } else if (wilds > 0) {
        wilds--
      } else {
        break
      }
      p++
      if (used.length + (wildTotal - wilds) >= rolled.length) break // 不可能超過骰子總數
    }
    const len = used.length + (wildTotal - wilds)
    if (len >= 5 && (!best || len > best.len)) {
      const wildsUsed = wildTotal - wilds
      best = { len, indices: [...used, ...wildIdx.slice(0, wildsUsed)] }
    }
  }

  if (!best) return null
  return { type: straightType(best.len), indices: best.indices }
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

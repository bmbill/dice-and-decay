// ── 核心資料模型 ──────────────────────────────────────────
// 骰子是「裝備」：有稀有度，每一面是一個可帶詞綴的槽。

export type Rarity = 'normal' | 'magic' | 'rare' | 'unique'

export type Element = 'physical' | 'fire' | 'ice'

// 面詞綴：掛在骰子某一面上的效果。
// 觸發時機目前只實作 onScore（這顆骰子被算進得分手牌時）。
export interface Affix {
  id: string
  name: string
  desc: string
  icon?: string
  // 詞綴類型，用於分色顯示與說明
  kind?: 'chips' | 'mult' | 'xmult' | 'wild'
  element?: Element
  tier?: 1 | 2 // 1=普通（藍/附魔骰可洗）2=強力（稀有/傳奇骰才容易洗到）
  // 得分修正：加底分(chips)、加倍率(mult，加法)、或乘倍率(xmult，乘法)
  chips?: number
  mult?: number
  xmult?: number
  // 是否為百搭面（湊牌型時可當任意點數）
  wild?: boolean
}

export interface DieFace {
  pip: number // 基礎點數 1-6
  affix?: Affix
}

export interface Die {
  id: string
  name: string
  rarity: Rarity
  faces: DieFace[] // 長度固定 6
}

// 一顆骰子當前的擲出狀態（在戰鬥桌面上）
export interface RolledDie {
  die: Die
  faceIndex: number // 當前朝上的面 0-5
  held: boolean // 是否鎖定（不重骰）
}

export type HandType =
  | 'high'
  | 'pair'
  | 'twoPair'
  | 'three'
  | 'straight'
  | 'fullHouse'
  | 'four'
  | 'straight6'
  | 'five'
  | 'six'
  | 'straight7'
  | 'seven'
  | 'eight'

export interface HandResult {
  type: HandType
  label: string
  baseChips: number
  baseMult: number
  // 參與計分的骰子索引（在桌面 rolled 陣列中的位置）
  scoringIndices: number[]
}

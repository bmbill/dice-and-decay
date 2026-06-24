import type { Affix, Element, Rarity } from './types'

// ── 詞綴池（分兩階）──────────────────────────────────────────
// Tier 1：普通詞綴，附魔/藍骰就能洗到，做穩定加法。
// Tier 2：強力詞綴（含乘法 ×倍率），稀有/傳奇骰才容易洗到——這是打寶深度的核心。
// 說明一律用「得分時，◯◯ +N」的固定句型，玩家一眼就懂。

export const AFFIX_POOL: Affix[] = [
  // Tier 1
  { id: 'sharp', name: '利刃', icon: '🔪', kind: 'chips', tier: 1, desc: '得分時，底分 +30', chips: 30 },
  { id: 'heavy', name: '重擊', icon: '🔨', kind: 'chips', tier: 1, desc: '得分時，底分 +55', chips: 55 },
  { id: 'ember', name: '烈焰', icon: '🔥', kind: 'mult', tier: 1, desc: '得分時，倍率 +0.8', mult: 0.8, element: 'fire' },
  { id: 'frost', name: '寒冰', icon: '❄️', kind: 'mult', tier: 1, desc: '得分時，倍率 +0.7', mult: 0.7, element: 'ice' },
  { id: 'wild', name: '百搭', icon: '🃏', kind: 'wild', tier: 1, desc: '可當任意點數，幫你湊牌型', wild: true },

  // Tier 2（強力）
  { id: 'titan', name: '巨力', icon: '🗿', kind: 'chips', tier: 2, desc: '得分時，底分 +110', chips: 110 },
  { id: 'burst', name: '爆裂', icon: '💥', kind: 'mult', tier: 2, desc: '得分時，倍率 +2.5', mult: 2.5, element: 'fire' },
  { id: 'resonance', name: '共鳴', icon: '🌀', kind: 'xmult', tier: 2, desc: '得分時，總倍率 ×1.3', xmult: 1.3, element: 'ice' },
  { id: 'surge', name: '狂潮', icon: '⚡', kind: 'xmult', tier: 2, desc: '得分時，總倍率 ×1.6', xmult: 1.6, element: 'fire' },
]

const TIER1 = AFFIX_POOL.filter((a) => a.tier === 1)
const TIER2 = AFFIX_POOL.filter((a) => a.tier === 2)

// 依骰子稀有度，洗到 Tier 2 強力詞綴的機率（越稀有越容易）
const TIER2_CHANCE: Record<Rarity, number> = {
  normal: 0,
  magic: 0,
  rare: 0.35,
  unique: 0.65,
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 抽一條詞綴：稀有/傳奇骰有機率抽到 Tier 2。
export function randomAffixForRarity(rarity: Rarity): Affix {
  if (Math.random() < TIER2_CHANCE[rarity]) return pick(TIER2)
  return pick(TIER1)
}

export const ELEMENT_COLOR: Record<Element, string> = {
  physical: '#c9c2b8',
  fire: '#ff7a45',
  ice: '#5fc8ff',
}

// 詞綴類型的顯示顏色（底分=藍、加倍率=橘、乘倍率=金紅、百搭=金）
export const KIND_COLOR: Record<NonNullable<Affix['kind']>, string> = {
  chips: '#5fc8ff',
  mult: '#ff9d5c',
  xmult: '#ff5c8a',
  wild: '#ffd24a',
}

export const KIND_LABEL: Record<NonNullable<Affix['kind']>, string> = {
  chips: '底分',
  mult: '加倍率',
  xmult: '乘倍率',
  wild: '百搭',
}

export function affixById(id: string): Affix | undefined {
  return AFFIX_POOL.find((a) => a.id === id)
}

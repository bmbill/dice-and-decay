import type { Die, DieFace } from './types'
import { AFFIX_POOL } from './affixes'
import { RARITY_RANK } from './loot'
import type { Rarity } from './types'

// ── 改造石（PoE 通貨球的對應）─────────────────────────────
export type CurrencyId = 'reroll' | 'engrave' | 'addFace' | 'removeFace' | 'ascend' | 'expand' | 'shrink'

export interface Currency {
  id: CurrencyId
  name: string
  icon: string
  desc: string
  scope: 'die' | 'meta' // 作用在骰子上，或作用在整體骰組
}

export const CURRENCIES: Currency[] = [
  { id: 'reroll', name: '重塑石', icon: '🌀', desc: '重洗這顆骰子所有面的詞綴', scope: 'die' },
  { id: 'engrave', name: '刻紋石', icon: '✒️', desc: '指定一面，改變它的點數', scope: 'die' },
  { id: 'addFace', name: '增面石', icon: '➕', desc: '替這顆骰子增加一個面', scope: 'die' },
  { id: 'removeFace', name: '裂解石', icon: '➖', desc: '移除這顆骰子的一個面', scope: 'die' },
  { id: 'ascend', name: '崇高石', icon: '⬆️', desc: '提升這顆骰子一階稀有度（多一條詞綴）', scope: 'die' },
  { id: 'expand', name: '擴充符', icon: '🎲', desc: '上場骰組上限 +1（可多帶一顆骰子）', scope: 'meta' },
  { id: 'shrink', name: '凝縮符', icon: '🔻', desc: '上場骰組上限 -1（精煉骰組）', scope: 'meta' },
]

export const currencyById = (id: CurrencyId) => CURRENCIES.find((c) => c.id === id)!

const MIN_FACES = 2
const MAX_FACES = 12

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const AFFIX_COUNT_BY_RARITY: Record<Rarity, [number, number]> = {
  normal: [0, 0],
  magic: [1, 2],
  rare: [3, 5],
  unique: [4, 6],
}

const RARITY_ORDER: Rarity[] = ['normal', 'magic', 'rare', 'unique']

// 重洗：依稀有度重新隨機灑詞綴到各面（點數保留）。
export function rerollAffixes(die: Die): Die {
  const faces: DieFace[] = die.faces.map((f) => ({ pip: f.pip })) // 清空詞綴、保留點數
  const [min, max] = AFFIX_COUNT_BY_RARITY[die.rarity]
  const count = min + Math.floor(Math.random() * (max - min + 1))
  const order = faces.map((_, i) => i).sort(() => Math.random() - 0.5)
  for (let i = 0; i < count && i < faces.length; i++) {
    faces[order[i]].affix = pick(AFFIX_POOL)
  }
  return { ...die, faces }
}

// 刻紋：把指定面的點數改成 pip。
export function engraveFace(die: Die, faceIndex: number, pip: number): Die {
  const faces = die.faces.map((f, i) => (i === faceIndex ? { ...f, pip } : { ...f }))
  return { ...die, faces }
}

// 增面：加一個面（點數延續，無詞綴）。
export function addFace(die: Die): Die | null {
  if (die.faces.length >= MAX_FACES) return null
  const nextPip = die.faces.length + 1
  return { ...die, faces: [...die.faces.map((f) => ({ ...f })), { pip: nextPip }] }
}

// 裂解：移除指定面。
export function removeFace(die: Die, faceIndex: number): Die | null {
  if (die.faces.length <= MIN_FACES) return null
  return { ...die, faces: die.faces.filter((_, i) => i !== faceIndex).map((f) => ({ ...f })) }
}

// 崇高：升一階稀有度，並補上對應的詞綴數量。
export function ascendRarity(die: Die): Die | null {
  const idx = RARITY_ORDER.indexOf(die.rarity)
  if (idx >= RARITY_ORDER.length - 1) return null
  const newRarity = RARITY_ORDER[idx + 1]
  const upgraded = { ...die, rarity: newRarity, name: die.name }
  // 把空面補一條詞綴，直到達到新稀有度下限
  const faces = upgraded.faces.map((f) => ({ ...f }))
  const targetMin = AFFIX_COUNT_BY_RARITY[newRarity][0]
  const current = faces.filter((f) => f.affix).length
  const empties = faces.map((f, i) => (f.affix ? -1 : i)).filter((i) => i >= 0).sort(() => Math.random() - 0.5)
  for (let i = 0; i < targetMin - current && i < empties.length; i++) {
    faces[empties[i]].affix = pick(AFFIX_POOL)
  }
  return { ...upgraded, faces }
}

export { MIN_FACES, MAX_FACES, RARITY_RANK }

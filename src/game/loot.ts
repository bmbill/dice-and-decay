import type { Die, Rarity } from './types'
import { rollDie } from './dice'

// 依關卡深度決定掉落稀有度（越深越好，PoE 式）。
// Boss 保底稀有以上，並提高傳奇機率。
export function rollLoot(level: number, isBoss: boolean): Die {
  const r = Math.random()
  const luck = level * 0.015 // 深度加成

  if (isBoss) {
    if (r < 0.18 + luck) return rollDie('unique')
    return rollDie('rare')
  }

  if (r < 0.02 + luck * 0.4) return rollDie('unique')
  if (r < 0.14 + luck) return rollDie('rare')
  if (r < 0.5 + luck) return rollDie('magic')
  return rollDie('normal')
}

export const RARITY_LABEL: Record<Rarity, string> = {
  normal: '粗糙',
  magic: '附魔',
  rare: '稀有',
  unique: '傳奇',
}

export const RARITY_RANK: Record<Rarity, number> = {
  normal: 0,
  magic: 1,
  rare: 2,
  unique: 3,
}

// 每 N 關一場 Boss
export const BOSS_INTERVAL = 5
export const isBossLevel = (level: number) => level % BOSS_INTERVAL === 0

import type { CurrencyId } from './crafting'

// 過關掉落的改造石。Boss 掉更多、有機會給稀有的擴充符/崇高石。
export function rollCurrencyDrop(level: number, isBoss: boolean): Partial<Record<CurrencyId, number>> {
  const drop: Partial<Record<CurrencyId, number>> = {}
  const add = (id: CurrencyId, n: number) => (drop[id] = (drop[id] ?? 0) + n)

  const common: CurrencyId[] = ['reroll', 'engrave', 'addFace', 'removeFace']

  if (isBoss) {
    add(common[Math.floor(Math.random() * common.length)], 2)
    add('ascend', 1)
    if (Math.random() < 0.5) add('expand', 1)
    else add('shrink', 1)
  } else {
    if (Math.random() < 0.7) add(common[Math.floor(Math.random() * common.length)], 1)
    if (Math.random() < 0.12 + level * 0.01) add('ascend', 1)
  }
  return drop
}

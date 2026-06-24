import type { Die, DieFace, Rarity } from './types'
import { AFFIX_POOL } from './affixes'

let idCounter = 0
const uid = (prefix: string) => `${prefix}_${(idCounter++).toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 每個稀有度會掛幾條面詞綴
const AFFIX_COUNT: Record<Rarity, [number, number]> = {
  normal: [0, 0],
  magic: [1, 2],
  rare: [3, 5],
  unique: [4, 6],
}

const RARITY_NAME: Record<Rarity, string> = {
  normal: '粗糙骰',
  magic: '附魔骰',
  rare: '稀有骰',
  unique: '傳奇骰',
}

// 產生一顆骰子：faceCount 面（預設 6），點數 1..faceCount，再依稀有度隨機把詞綴灑到不同面上。
export function rollDie(rarity: Rarity, faceCount = 6): Die {
  const faces: DieFace[] = Array.from({ length: faceCount }, (_, i) => ({ pip: i + 1 }))

  const [min, max] = AFFIX_COUNT[rarity]
  const count = min + Math.floor(Math.random() * (max - min + 1))

  const faceOrder = faces.map((_, i) => i).sort(() => Math.random() - 0.5)
  for (let i = 0; i < count && i < faceCount; i++) {
    faces[faceOrder[i]].affix = pick(AFFIX_POOL)
  }

  return {
    id: uid('die'),
    name: RARITY_NAME[rarity],
    rarity,
    faces,
  }
}

// 起始骰組：4 顆普通 + 1 顆附魔，先讓玩家有東西可玩。
export function startingDice(): Die[] {
  return [rollDie('normal'), rollDie('normal'), rollDie('normal'), rollDie('normal'), rollDie('magic')]
}

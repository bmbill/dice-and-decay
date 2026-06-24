import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { Die, RolledDie } from './types'
import { startingDice } from './dice'
import { evaluateHand, scoreHand, type ScoreBreakdown } from './scoring'
import { rollLoot, isBossLevel, rollCurrencyDrop } from './loot'
import {
  type CurrencyId,
  rerollAffixes,
  engraveFace,
  addFace,
  removeFace,
  ascendRarity,
} from './crafting'

const REROLLS_PER_LEVEL = 3
const HANDS_PER_LEVEL = 4 // 一關內可出幾次手牌
const DEFAULT_SET_SIZE = 5 // 上場骰組起始上限
const MIN_SET_SIZE = 3
const MAX_SET_SIZE = 8

// 關卡門檻成長曲線；Boss 關更硬。
// 成長率調緩（1.42），讓滿配骰組搭配乘法詞綴跟得上；Boss ×1.7。
function thresholdFor(level: number): number {
  const base = Math.round(120 * Math.pow(1.42, level - 1))
  return isBossLevel(level) ? Math.round(base * 1.7) : base
}

type View = 'battle' | 'inventory'
type Currencies = Partial<Record<CurrencyId, number>>

// 起手包：給一小批改造石讓玩家馬上能試合成。
function starterCurrencies(): Currencies {
  return { reroll: 3, engrave: 3, addFace: 2, removeFace: 2, ascend: 1, expand: 1, shrink: 1 }
}

interface GameState {
  collection: Die[]
  equippedIds: string[]
  setSize: number
  currencies: Currencies

  // UI
  view: View
  showHelp: boolean
  craftingDieId: string | null // 合成台上選中的骰子
  hydrated: boolean // IndexedDB 存檔是否已載入完成

  // 當前關卡
  level: number
  threshold: number
  remaining: number
  rerollsLeft: number
  handsLeft: number

  // 桌面
  rolled: RolledDie[]
  lastScore: ScoreBreakdown | null
  status: 'playing' | 'won' | 'lost'

  // 打寶（過關獎勵）
  pendingLoot: Die | null
  pendingCurrency: Currencies | null

  // 動作
  newRun: () => void
  toggleHold: (index: number) => void
  reroll: () => void
  playHand: () => void
  nextLevel: () => void
  setView: (v: View) => void
  toggleHelp: () => void
  toggleEquip: (id: string) => void

  // 合成
  openCraft: (id: string) => void
  closeCraft: () => void
  craftReroll: (id: string) => void
  craftEngrave: (id: string, faceIndex: number, pip: number) => void
  craftAddFace: (id: string) => void
  craftRemoveFace: (id: string, faceIndex: number) => void
  craftAscend: (id: string) => void
  changeSetSize: (delta: 1 | -1) => void
  resetSave: () => void
  markHydrated: () => void
}

// zustand persist 用的 IndexedDB 儲存介面（透過 idb-keyval）
const idbStorage = {
  getItem: async (name: string) => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string) => {
    await idbSet(name, value)
  },
  removeItem: async (name: string) => {
    await idbDel(name)
  },
}

function equippedDice(collection: Die[], ids: string[]): Die[] {
  return ids.map((id) => collection.find((d) => d.id === id)).filter(Boolean) as Die[]
}

function rollFaces(dice: Die[], keep?: RolledDie[]): RolledDie[] {
  return dice.map((die, i) => {
    if (keep && keep[i]?.held && keep[i]?.die.id === die.id) return keep[i]
    return { die, faceIndex: Math.floor(Math.random() * die.faces.length), held: false }
  })
}

function freshTable(get: () => GameState): RolledDie[] {
  const { collection, equippedIds } = get()
  return rollFaces(equippedDice(collection, equippedIds))
}

// 合成後更新背包中那顆骰子，並重擲桌面（讓改動立即反映）。
function applyDieChange(get: () => GameState, set: (p: Partial<GameState>) => void, id: string, next: Die | null, cost: CurrencyId) {
  if (!next) return
  const { collection, currencies } = get()
  if ((currencies[cost] ?? 0) <= 0) return
  const newCollection = collection.map((d) => (d.id === id ? next : d))
  set({
    collection: newCollection,
    currencies: { ...currencies, [cost]: (currencies[cost] ?? 0) - 1 },
    rolled: rollFaces(equippedDice(newCollection, get().equippedIds), get().rolled),
  })
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
  collection: [],
  equippedIds: [],
  setSize: DEFAULT_SET_SIZE,
  currencies: {},
  view: 'battle',
  showHelp: false,
  hydrated: false,
  craftingDieId: null,
  level: 1,
  threshold: 0,
  remaining: 0,
  rerollsLeft: REROLLS_PER_LEVEL,
  handsLeft: HANDS_PER_LEVEL,
  rolled: [],
  lastScore: null,
  status: 'playing',
  pendingLoot: null,
  pendingCurrency: null,

  newRun: () => {
    const collection = startingDice()
    const equippedIds = collection.map((d) => d.id)
    const threshold = thresholdFor(1)
    set({
      collection,
      equippedIds,
      setSize: DEFAULT_SET_SIZE,
      currencies: starterCurrencies(),
      view: 'battle',
      craftingDieId: null,
      level: 1,
      threshold,
      remaining: threshold,
      rerollsLeft: REROLLS_PER_LEVEL,
      handsLeft: HANDS_PER_LEVEL,
      rolled: rollFaces(equippedDice(collection, equippedIds)),
      lastScore: null,
      status: 'playing',
      pendingLoot: null,
      pendingCurrency: null,
    })
  },

  toggleHold: (index) => {
    set((s) => ({
      rolled: s.rolled.map((r, i) => (i === index ? { ...r, held: !r.held } : r)),
    }))
  },

  reroll: () => {
    const { rerollsLeft, collection, equippedIds, rolled, status } = get()
    if (rerollsLeft <= 0 || status !== 'playing') return
    set({
      rolled: rollFaces(equippedDice(collection, equippedIds), rolled),
      rerollsLeft: rerollsLeft - 1,
    })
  },

  playHand: () => {
    const { rolled, remaining, handsLeft, status, level } = get()
    if (status !== 'playing' || handsLeft <= 0 || rolled.length === 0) return

    const hand = evaluateHand(rolled)
    const breakdown = scoreHand(rolled, hand)
    const newRemaining = Math.max(0, remaining - breakdown.total)
    const newHandsLeft = handsLeft - 1

    let newStatus: GameState['status'] = 'playing'
    let pendingLoot: Die | null = null
    let pendingCurrency: Currencies | null = null
    if (newRemaining <= 0) {
      newStatus = 'won'
      pendingLoot = rollLoot(level, isBossLevel(level))
      pendingCurrency = rollCurrencyDrop(level, isBossLevel(level))
    } else if (newHandsLeft <= 0) {
      newStatus = 'lost'
    }

    set({
      lastScore: breakdown,
      remaining: newRemaining,
      handsLeft: newHandsLeft,
      status: newStatus,
      pendingLoot,
      pendingCurrency,
      rerollsLeft: REROLLS_PER_LEVEL,
      rolled: newStatus === 'playing' ? freshTable(get) : rolled,
    })
  },

  nextLevel: () => {
    const { level, status, pendingLoot, pendingCurrency, collection, currencies } = get()
    if (status !== 'won') return
    const newCollection = pendingLoot ? [...collection, pendingLoot] : collection
    const newCurrencies = { ...currencies }
    if (pendingCurrency) {
      for (const [k, v] of Object.entries(pendingCurrency)) {
        const id = k as CurrencyId
        newCurrencies[id] = (newCurrencies[id] ?? 0) + (v ?? 0)
      }
    }
    const nextLvl = level + 1
    const threshold = thresholdFor(nextLvl)
    set({
      collection: newCollection,
      currencies: newCurrencies,
      level: nextLvl,
      threshold,
      remaining: threshold,
      rerollsLeft: REROLLS_PER_LEVEL,
      handsLeft: HANDS_PER_LEVEL,
      rolled: rollFaces(equippedDice(newCollection, get().equippedIds)),
      lastScore: null,
      status: 'playing',
      pendingLoot: null,
      pendingCurrency: null,
    })
  },

  setView: (v) => set({ view: v }),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),

  toggleEquip: (id) => {
    const { equippedIds, setSize } = get()
    if (equippedIds.includes(id)) {
      set({ equippedIds: equippedIds.filter((x) => x !== id) })
    } else if (equippedIds.length < setSize) {
      set({ equippedIds: [...equippedIds, id] })
    }
  },

  openCraft: (id) => set({ craftingDieId: id }),
  closeCraft: () => set({ craftingDieId: null }),

  craftReroll: (id) => {
    const die = get().collection.find((d) => d.id === id)
    if (die) applyDieChange(get, set, id, rerollAffixes(die), 'reroll')
  },
  craftEngrave: (id, faceIndex, pip) => {
    const die = get().collection.find((d) => d.id === id)
    if (die) applyDieChange(get, set, id, engraveFace(die, faceIndex, pip), 'engrave')
  },
  craftAddFace: (id) => {
    const die = get().collection.find((d) => d.id === id)
    if (die) applyDieChange(get, set, id, addFace(die), 'addFace')
  },
  craftRemoveFace: (id, faceIndex) => {
    const die = get().collection.find((d) => d.id === id)
    if (die) applyDieChange(get, set, id, removeFace(die, faceIndex), 'removeFace')
  },
  craftAscend: (id) => {
    const die = get().collection.find((d) => d.id === id)
    if (die) applyDieChange(get, set, id, ascendRarity(die), 'ascend')
  },

  changeSetSize: (delta) => {
    const { setSize, currencies, equippedIds } = get()
    const cost: CurrencyId = delta === 1 ? 'expand' : 'shrink'
    if ((currencies[cost] ?? 0) <= 0) return
    const next = setSize + delta
    if (next < MIN_SET_SIZE || next > MAX_SET_SIZE) return
    // 縮小時若上場數超過新上限，裁掉多的
    const newEquipped = equippedIds.slice(0, next)
    set({
      setSize: next,
      equippedIds: newEquipped,
      currencies: { ...currencies, [cost]: (currencies[cost] ?? 0) - 1 },
    })
  },

  resetSave: () => {
    idbDel('dice-and-decay').catch(() => {})
    get().newRun()
  },

  markHydrated: () => set({ hydrated: true }),
}),
    {
      name: 'dice-and-decay',
      storage: createJSONStorage(() => idbStorage),
      // 只存進度與戰局狀態，不存純 UI 狀態
      partialize: (s) => ({
        collection: s.collection,
        equippedIds: s.equippedIds,
        setSize: s.setSize,
        currencies: s.currencies,
        level: s.level,
        threshold: s.threshold,
        remaining: s.remaining,
        rerollsLeft: s.rerollsLeft,
        handsLeft: s.handsLeft,
        rolled: s.rolled,
        lastScore: s.lastScore,
        status: s.status,
        pendingLoot: s.pendingLoot,
        pendingCurrency: s.pendingCurrency,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
    },
  ),
)

export { DEFAULT_SET_SIZE, MIN_SET_SIZE, MAX_SET_SIZE }

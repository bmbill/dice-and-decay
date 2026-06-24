import type { Affix, Element } from './types'

// ── 詞綴池 ──────────────────────────────────────────────────
// 每條詞綴只做一件好懂的事：加底分、加倍率、或變百搭。
// 說明一律用「得分時，◯◯ +N」的固定句型，玩家一眼就懂。

export const AFFIX_POOL: Affix[] = [
  { id: 'sharp', name: '利刃', icon: '🔪', kind: 'chips', desc: '得分時，底分 +25', chips: 25 },
  { id: 'heavy', name: '重擊', icon: '🔨', kind: 'chips', desc: '得分時，底分 +45', chips: 45 },
  { id: 'ember', name: '烈焰', icon: '🔥', kind: 'mult', desc: '得分時，倍率 +0.6', mult: 0.6, element: 'fire' },
  { id: 'frost', name: '寒冰', icon: '❄️', kind: 'mult', desc: '得分時，倍率 +0.5', mult: 0.5, element: 'ice' },
  { id: 'wild', name: '百搭', icon: '🃏', kind: 'wild', desc: '可當任意點數，幫你湊牌型', wild: true },
  { id: 'burst', name: '爆裂', icon: '💥', kind: 'mult', desc: '得分時，倍率 +1.4（高風險高報酬）', mult: 1.4, element: 'fire' },
]

export const ELEMENT_COLOR: Record<Element, string> = {
  physical: '#c9c2b8',
  fire: '#ff7a45',
  ice: '#5fc8ff',
}

// 詞綴類型的顯示顏色（底分=藍、倍率=橘、百搭=金）
export const KIND_COLOR: Record<NonNullable<Affix['kind']>, string> = {
  chips: '#5fc8ff',
  mult: '#ff9d5c',
  wild: '#ffd24a',
}

export const KIND_LABEL: Record<NonNullable<Affix['kind']>, string> = {
  chips: '底分',
  mult: '倍率',
  wild: '百搭',
}

export function affixById(id: string): Affix | undefined {
  return AFFIX_POOL.find((a) => a.id === id)
}

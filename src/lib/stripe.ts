import Stripe from 'stripe'
import { loadStripe as _loadStripe } from '@stripe/stripe-js'

// 環境変数の必須チェック
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_STD_MONTH: process.env.STRIPE_PRICE_STD_MONTH,
  STRIPE_PRICE_PRO_MONTH: process.env.STRIPE_PRICE_PRO_MONTH,
  STRIPE_PRICE_PACK_1M: process.env.STRIPE_PRICE_PACK_1M,
} as const

// 起動時の環境変数バリデーション
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `環境変数 ${key} が設定されていません。\n` +
      `.env.local ファイルに以下を追加してください:\n` +
      `${key}=your_value_here\n\n` +
      `詳細: https://docs.stripe.com/keys`
    )
  }
})

// Stripe APIバージョン - 半年ごとに最新版へ更新
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// getStripe をシングルトンに
let stripePromise: ReturnType<typeof _loadStripe> | null = null

export const getStripe = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('getStripe must be called in browser'))
  }
  if (!stripePromise) {
    stripePromise = _loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// 型安全を強化するためのEnum
export enum Plan {
  STD_MONTH = 'STD_MONTH',
  PRO_MONTH = 'PRO_MONTH',
  PACK_1M = 'PACK_1M'
}

export const STRIPE_PRICE_IDS = {
  [Plan.STD_MONTH]: process.env.STRIPE_PRICE_STD_MONTH!,
  [Plan.PRO_MONTH]: process.env.STRIPE_PRICE_PRO_MONTH!,
  [Plan.PACK_1M]: process.env.STRIPE_PRICE_PACK_1M!,
} as const

export const PLANS = {
  [Plan.STD_MONTH]: {
    id: 'std_month',
    name: 'スタンダードプラン',
    price: 6980,
    priceId: STRIPE_PRICE_IDS[Plan.STD_MONTH],
    tokens: 280000,
    description: '月額6,980円で28万トークン',
    features: [
      '28万トークン/月',
      'LINE Bot対応',
      '物件説明文自動生成',
      'CSV一括インポート',
      'ダッシュボード',
      'メールサポート'
    ],
    recurring: true,
    interval: 'month' as const
  },
  [Plan.PRO_MONTH]: {
    id: 'pro_month',
    name: 'プロプラン',
    price: 29800,
    priceId: STRIPE_PRICE_IDS[Plan.PRO_MONTH],
    tokens: 1200000,
    description: '月額29,800円で120万トークン',
    features: [
      '120万トークン/月',
      'LINE Bot対応',
      '物件説明文自動生成',
      'CSV一括インポート',
      'ダッシュボード',
      '優先サポート'
    ],
    recurring: true,
    interval: 'month' as const
  },
  [Plan.PACK_1M]: {
    id: 'pack_1m',
    name: '追加トークンパック',
    price: 25000,
    priceId: STRIPE_PRICE_IDS[Plan.PACK_1M],
    tokens: 1000000,
    description: '25,000円で100万トークン追加',
    features: [
      '100万トークン追加',
      '有効期限なし',
      '既存プランに追加'
    ],
    recurring: false,
    interval: null
  }
} as const

export type PlanId = keyof typeof PLANS

export const TRIAL_DAYS = 7
export const TRIAL_TOKENS = 100000  // トライアル期間のトークン上限

// cent ↔ 円変換ヘルパー
export const toJpyCents = (yen: number): number => Math.round(yen * 100)
export const fromJpyCents = (cents: number): number => Math.round(cents) / 100

// Stripe エラーハンドリングユーティリティ
export class StripeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'StripeError'
  }
}

export function handleStripeError(error: unknown): StripeError {
  // Stripe v12 以降は error.type === 'StripeCardError' などで判別
  if ((error as any).type && (error as any).message) {
    const raw = error as any
    const msg = getJapaneseErrorMessage(raw.code ?? 'unknown_error')
    return new StripeError(msg, raw.code, raw.statusCode)
  }

  if (error instanceof Error) {
    return new StripeError(`Stripeエラー: ${error.message}`, 'unknown_error')
  }

  return new StripeError(
    'Stripeで予期しないエラーが発生しました。サポートへ連絡してください。',
    'unknown_error'
  )
}

// プラン判定とトークン上限のユーティリティ関数
export function planFromPriceId(priceId?: string): string {
  if (!priceId) return 'trial'
  
  switch (priceId) {
    case STRIPE_PRICE_IDS[Plan.STD_MONTH]:
      return 'standard'
    case STRIPE_PRICE_IDS[Plan.PRO_MONTH]:
      return 'pro'
    case STRIPE_PRICE_IDS[Plan.PACK_1M]:
      return 'token_pack'
    default:
      return 'unknown'
  }
}

export function tokenLimitFromPlan(planType: string): number {
  switch (planType) {
    case 'standard':
      return 280000
    case 'pro':
      return 1200000
    default:
      return 100000 // Trial/unknown
  }
}

function getJapaneseErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'card_declined': 'カードが拒否されました。別のカードをお試しください。',
    'expired_card': 'カードの有効期限が切れています。',
    'incorrect_cvc': 'セキュリティコードが正しくありません。',
    'insufficient_funds': 'カードの残高が不足しています。',
    'invalid_card_type': 'このカードタイプはサポートされていません。',
    'api_key_expired': 'APIキーの有効期限が切れています。管理者にお問い合わせください。',
    'authentication_required': '追加認証が必要です。画面の指示に従ってください。',
    'rate_limit': 'リクエストが多すぎます。しばらく待ってからお試しください。',
    'unknown_error': '予期しないエラーが発生しました。'
  }
  
  return errorMessages[code] || errorMessages.unknown_error + 
    '\n詳細: https://stripe.com/docs/error-codes'
}
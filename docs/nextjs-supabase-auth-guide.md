# Next.js + Supabase 認証実装ガイド

## 概要

DoorAIでは、Next.js App RouterとSupabase SSRを使用した認証システムを実装しています。このドキュメントでは、現在の実装とベストプラクティスの準拠状況を説明します。

## 🏗️ アーキテクチャ

### 1. Supabase SSR の採用

**使用パッケージ**: `@supabase/ssr`

従来の `@supabase/auth-helpers-nextjs` ではなく、最新の `@supabase/ssr` を使用しています。これは Supabase の推奨アプローチです。

### 2. クライアント構成

#### ブラウザクライアント (`/lib/supabase.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### サーバークライアント (`/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        }
      }
    }
  )
}
```

## 🔐 認証フロー

### 1. ミドルウェア (`/middleware.ts`)

すべてのリクエストで認証状態をチェック:

```typescript
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()

  // 未認証ユーザーの保護ルートへのアクセスを制限
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 認証済みユーザーの認証ページへのアクセスをリダイレクト
  if (session && (request.nextUrl.pathname === '/login' || 
                  request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

### 2. 認証メソッド (`/lib/auth.ts`)

#### メールアドレス認証
```typescript
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  return await supabase.auth.signInWithPassword({ email, password })
}
```

#### Google OAuth認証
```typescript
export async function signInWithGoogle() {
  const supabase = createClient()
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  })
}
```

#### サインアップ（テナント自動作成付き）
```typescript
export async function signUpWithEmail(
  email: string, 
  password: string, 
  name: string, 
  companyName?: string
) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, companyName })
  })
  // API Route でテナント作成とトークン初期化を実行
}
```

### 3. コールバック処理 (`/app/(public)/auth/callback/route.ts`)

OAuthプロバイダーからのコールバックを処理:

```typescript
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
```

## 📁 ファイル構造

```
src/
├── app/
│   ├── (public)/           # 認証不要のルート
│   │   ├── login/
│   │   ├── signup/
│   │   └── auth/
│   │       └── callback/
│   └── (app)/             # 認証必要のルート
│       ├── dashboard/
│       └── properties/
├── lib/
│   ├── auth.ts            # 認証ヘルパー関数
│   ├── supabase.ts        # ブラウザクライアント
│   └── supabase/
│       └── server.ts      # サーバークライアント
├── contexts/
│   ├── AuthContext.tsx    # 認証状態管理
│   └── TenantContext.tsx  # テナント情報管理
└── middleware.ts          # 認証ミドルウェア
```

## 🔄 認証状態管理

### AuthContext (`/contexts/AuthContext.tsx`)

クライアントサイドでの認証状態管理:

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  refreshAuth: () => Promise<void>
}

// 使用例
const { user, loading } = useAuth()
```

### TenantContext (`/contexts/TenantContext.tsx`)

マルチテナント管理:

```typescript
interface TenantContextType {
  tenant: Tenant | null
  loading: boolean
  refreshTenant: () => Promise<void>
}
```

## ✅ ベストプラクティス準拠状況

### 実装済み ✅

1. **Supabase SSR の使用**
   - 最新の `@supabase/ssr` パッケージを使用
   - サーバー/クライアントの適切な分離

2. **ミドルウェアでの認証チェック**
   - すべてのリクエストで認証状態を確認
   - 適切なリダイレクト処理

3. **セキュアなクッキー管理**
   - httpOnly クッキーの使用
   - サーバーサイドでのセッション管理

4. **マルチテナント対応**
   - テナント別のデータ分離
   - RLS（Row Level Security）の活用

5. **OAuthプロバイダー対応**
   - Google認証の実装
   - 適切なコールバック処理

### 推奨事項 📋

1. **セッションリフレッシュの自動化**
```typescript
// 定期的なセッション更新
useEffect(() => {
  const interval = setInterval(async () => {
    await supabase.auth.refreshSession()
  }, 30 * 60 * 1000) // 30分ごと
  
  return () => clearInterval(interval)
}, [])
```

2. **エラーハンドリングの強化**
```typescript
try {
  const { data, error } = await signInWithEmail(email, password)
  if (error) {
    // エラーコードに基づく処理
    switch (error.code) {
      case 'invalid_credentials':
        // 無効な認証情報
        break
      case 'email_not_confirmed':
        // メール未確認
        break
    }
  }
} catch (error) {
  // ネットワークエラーなど
}
```

3. **レート制限の考慮**
```typescript
// 認証試行回数の制限
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15分

if (attempts >= MAX_ATTEMPTS) {
  // ロックアウト処理
}
```

## 🛡️ セキュリティ考慮事項

### 1. 環境変数の管理
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
# SUPABASE_SERVICE_ROLE_KEY は使用しない（クライアントサイドでは危険）
```

### 2. RLS (Row Level Security)
```sql
-- テナントベースのアクセス制御
CREATE POLICY "Users can only access their tenant data" ON properties
  FOR ALL USING (tenant_id = (
    SELECT tenant_id FROM tenants 
    WHERE auth_user_id = auth.uid()
  ));
```

### 3. CSRF保護
- Supabase SSR は自動的にCSRF保護を提供
- Server Actions の使用でさらに強化

## 🚀 パフォーマンス最適化

### 1. 認証状態のキャッシュ
```typescript
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
```

### 2. 並列データ取得
```typescript
const [user, tenant] = await Promise.all([
  getCurrentUser(),
  getTenantByAuthUserId(userId)
])
```

## 📝 トラブルシューティング

### よくある問題

1. **"Invalid login credentials" エラー**
   - メールアドレス/パスワードの確認
   - メール確認の完了確認

2. **セッション切れ**
   - ミドルウェアでの自動リフレッシュ実装
   - クライアントサイドでの定期更新

3. **OAuth リダイレクトエラー**
   - Supabase ダッシュボードでのリダイレクトURL設定
   - 環境変数の確認

## 🔍 デバッグ方法

```typescript
// 認証状態の確認
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)

// ユーザー情報の確認
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// エラーの詳細確認
if (error) {
  console.error('Auth error:', {
    message: error.message,
    status: error.status,
    code: error.code
  })
}
```

## まとめ

DoorAIの認証実装は、Next.js App RouterとSupabase SSRのベストプラクティスに準拠しています。マルチテナント対応、OAuth統合、セキュアなセッション管理など、エンタープライズレベルの要件を満たす実装となっています。
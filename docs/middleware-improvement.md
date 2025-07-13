# ミドルウェア改善ガイド

## 現在のミドルウェアを改善する方法

### 1. 現在の`middleware.ts`を以下のように更新：

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2. サーバークライアントを新パターンに移行：

既存の`server.ts`と並行して`server-v2.ts`を使用し、段階的に移行できます。

```typescript
// 新しいサーバーアクションでの使用例
import { createClient } from '@/lib/supabase/server-v2'

export async function someServerAction() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  // ...
}
```

## メリット

1. **自動トークンリフレッシュ**: ミドルウェアで自動的にトークンが更新される
2. **よりセキュア**: 最新のSupabaseベストプラクティスに準拠
3. **パフォーマンス向上**: 効率的なクッキー管理

## 注意点

- 既存のコードは引き続き動作するため、段階的な移行が可能
- 新しい機能から順次新パターンを適用することを推奨
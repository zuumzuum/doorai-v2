# Next.js App Router ベストプラクティス実装完了

## 実装概要

DoorAIプロジェクトをNext.js App Routerのベストプラクティスに準拠させるため、以下の改善を実施しました。

## 📋 完了した改善項目

### 1. Server Actions への移行 ✅

**従来**: API Routes (`/api/properties/*`)
**現在**: Server Actions (`/lib/actions/*`)

#### 移行されたAPI:
- `POST /api/properties/import-csv` → `importCSVAction`
- `POST /api/properties/generate-descriptions` → `generateDescriptionsAction`
- `GET /api/properties/generate-descriptions` → `getGenerationStatusAction`
- `GET /api/properties/batch-status` → `getBatchStatusAction`
- `POST /api/properties/batch-status` → `processBatchResultsAction`, `cancelBatchAction`

#### メリット:
- サーバーサイドでの実行によるセキュリティ向上
- TypeScriptの型安全性
- 自動的なCSRF保護
- より良いパフォーマンス

### 2. 型安全性の向上 ✅

**新規追加**: `/lib/types/actions.ts`

```typescript
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function createSuccessResult<T>(data?: T, message?: string): ActionSuccessResult<T>
export function createErrorResult(error: string, validationErrors?: ValidationError[]): ActionErrorResult
```

#### 効果:
- 全てのServer Actionsで一貫したレスポンス形式
- 型安全なエラーハンドリング
- 開発者体験の向上

### 3. エラーハンドリングの統一 ✅

**新規追加**: `/lib/utils/error-handler.ts`

```typescript
export class AppError extends Error
export class ValidationError extends AppError
export class AuthError extends AppError
export class NotFoundError extends AppError
export class ConflictError extends AppError

export function handleServerActionError(error: unknown): ActionErrorResult
export function requireAuth(user: any): void
export function requireTenant(tenant: any): void
```

#### 効果:
- 統一されたエラーハンドリングパターン
- 適切なエラー情報の提供
- デバッグの容易さ向上

### 4. キャッシュ戦略の改善 ✅

**更新されたファイル**:
- `/lib/dal/tenants.ts`
- `/lib/dal/properties.ts`
- `/lib/dal/batch-generations.ts`

```typescript
import { cache } from 'react'

export const getTenantByAuthUserId = cache(async (authUserId: string) => {
  // ... 実装
})

export const getPropertiesByTenantId = cache(async (tenantId: string) => {
  // ... 実装
})

export const getBatchGenerationsByTenantId = cache(async (tenantId: string) => {
  // ... 実装
})
```

#### 効果:
- 同一リクエスト内での重複データ取得の除去
- パフォーマンス向上
- メモリ使用量の最適化

### 5. UIコンポーネントの更新 ✅

**更新されたコンポーネント**:
- `CSVImportDialog.tsx`
- `AIGenerationDialog.tsx`

#### 変更点:
- API Routes呼び出しをServer Actions呼び出しに変更
- 型安全なレスポンス処理
- 改善されたエラーハンドリング

## 🏗️ アーキテクチャ改善

### Before (API Routes)
```
Client Component → fetch('/api/endpoint') → API Route → Database
```

### After (Server Actions)
```
Client Component → Server Action → Database
```

### 利点:
1. **セキュリティ**: Server Actions は自動的にCSRF保護を提供
2. **パフォーマンス**: 不要なシリアライゼーション/デシリアライゼーションを削減
3. **型安全性**: TypeScriptの型システムがend-to-endで動作
4. **開発者体験**: より直感的なAPI設計

## 🔧 実装されたパターン

### 1. Server Action パターン
```typescript
"use server";

export async function actionName(params: ParamsType): Promise<ActionResult<DataType>> {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResult('認証が必要です');
    }

    // ビジネスロジック
    const result = await performOperation(params);
    
    return createSuccessResult(result, '操作が完了しました');
  } catch (error) {
    return handleServerActionError(error);
  }
}
```

### 2. エラーハンドリング パターン
```typescript
// 統一されたエラーレスポンス
if (!user) {
  return createErrorResult('認証が必要です');
}

// 型安全なエラーハンドリング
try {
  // 処理
} catch (error) {
  return handleServerActionError(error);
}
```

### 3. キャッシュ パターン
```typescript
export const getCachedData = cache(async (id: string) => {
  return await database.query(id);
});
```

## 📊 パフォーマンス向上

### 1. ネットワーク要求の削減
- Server Actions により、不要なHTTPオーバーヘッドを削減
- 同一リクエスト内でのデータ重複取得を防止

### 2. メモリ使用量の最適化
- `cache()` 関数による効率的なデータ取得
- 重複するデータベースクエリの除去

### 3. 型安全性によるランタイムエラーの削減
- コンパイル時での型チェック
- 実行時エラーの予防

## 🛡️ セキュリティ改善

### 1. CSRF保護
- Server Actions は自動的にCSRF攻撃を防止
- 追加の設定不要

### 2. 認証・認可の強化
- すべてのServer Actionsで統一された認証チェック
- テナントレベルでのデータ分離

### 3. エラー情報の適切な管理
- 本番環境では詳細なエラー情報を隠蔽
- 開発環境では詳細なデバッグ情報を提供

## 🎯 今後の改善点

### 1. 残存するAPI Routes
以下のAPI Routesは引き続き必要なため、現在のまま維持:
- `/api/properties/template` - ファイルダウンロード
- `/api/auth/signup` - 認証フロー
- `/api/auth/callback` - 認証コールバック

### 2. 追加検討事項
- [ ] Zod による入力検証の追加
- [ ] より詳細なログ機能の実装
- [ ] パフォーマンスモニタリングの設定

## 🚀 結論

Next.js App Routerのベストプラクティスに準拠することで、以下の改善を実現しました：

1. **パフォーマンス**: キャッシュ戦略とServer Actionsによる高速化
2. **セキュリティ**: 統一された認証・認可とCSRF保護
3. **開発者体験**: 型安全性とエラーハンドリングの向上
4. **保守性**: 一貫したアーキテクチャパターンの適用

これらの改善により、DoorAIはより堅牢でスケーラブルなアプリケーションとなりました。
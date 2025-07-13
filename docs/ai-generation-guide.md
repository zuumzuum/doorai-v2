# AI自動生成機能ガイド

## 概要

DoorAIのAI自動生成機能は、GPT-4o Batch APIを使用して物件の魅力的な紹介文を自動生成します。この機能により、大量の物件データから効率的に高品質な説明文を作成できます。

## 主要機能

### 1. バッチ処理による一括生成
- OpenAI Batch APIを使用してコスト効率の良い生成
- 大量の物件データを一度に処理
- 24時間以内の非同期処理

### 2. 進捗監視
- リアルタイムでバッチジョブの状態を監視
- 進捗バーによる視覚的フィードバック
- 完了通知とエラーハンドリング

### 3. コスト管理
- 事前のコスト見積もり
- トークン使用量の追跡
- 予算に応じた処理制御

## API エンドポイント

### 生成開始
```
POST /api/properties/generate-descriptions
```

**リクエスト:**
```json
{
  "propertyIds": ["uuid1", "uuid2"] // オプション。指定しない場合は全未生成物件
}
```

**レスポンス:**
```json
{
  "success": true,
  "batchId": "batch_abc123",
  "totalProperties": 50,
  "estimatedCost": 0.125,
  "estimatedTokens": 52500
}
```

### 状態確認
```
GET /api/properties/batch-status?batchId=batch_abc123
```

**レスポンス:**
```json
{
  "batchId": "batch_abc123",
  "status": "in_progress",
  "requestCounts": {
    "total": 50,
    "completed": 30,
    "failed": 2
  }
}
```

### 結果処理
```
POST /api/properties/batch-status
```

**リクエスト:**
```json
{
  "batchId": "batch_abc123",
  "action": "process_results"
}
```

## 生成プロセス

### 1. 前処理
1. 認証・権限確認
2. アクティブバッチジョブの確認
3. 対象物件の抽出（AI説明文未生成）
4. コスト見積もり

### 2. バッチジョブ作成
1. OpenAI用JSONLファイルの作成
2. ファイルアップロード
3. バッチジョブの開始
4. データベースへの記録

### 3. 監視・処理
1. 定期的な状態確認（5秒間隔）
2. 完了時の結果取得
3. プロパティテーブルの更新
4. エラーハンドリング

## データベーススキーマ

### batch_generations テーブル
```sql
CREATE TABLE batch_generations (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  batch_id TEXT UNIQUE,
  input_file_id TEXT,
  output_file_id TEXT,
  status TEXT,
  total_requests INTEGER,
  completed_requests INTEGER,
  failed_requests INTEGER,
  estimated_cost DECIMAL(10,4),
  actual_cost DECIMAL(10,4),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### properties テーブル追加カラム
```sql
ALTER TABLE properties 
ADD COLUMN batch_job_id TEXT,
ADD COLUMN ai_description TEXT;
```

## UI コンポーネント

### AIGenerationDialog
主要なUI コンポーネントで以下の機能を提供：

- 生成状態の表示
- 進捗バーによる視覚化
- コスト情報の表示
- キャンセル機能
- エラー表示

**使用例:**
```tsx
<AIGenerationDialog 
  trigger={<Button>AI一括生成</Button>}
  onComplete={() => window.location.reload()}
/>
```

## システムプロンプト

AI生成で使用されるシステムプロンプト：

```
あなたは不動産の専門家として、物件情報から魅力的な物件紹介文を作成してください。

以下の要件に従って紹介文を作成してください：
1. 物件の魅力を最大限に伝える
2. 具体的で読みやすい文章にする
3. 200文字以内で簡潔にまとめる
4. 顧客が興味を持つような表現を使う
5. 物件の特徴や立地の良さを強調する

紹介文のみを返してください。余計な説明は不要です。
```

## コスト計算

### 推定コスト計算式
```typescript
const avgPromptTokens = 150;
const avgCompletionTokens = 100;
const totalTokens = (avgPromptTokens + avgCompletionTokens) * requestCount;

// GPT-4o Batch API pricing from environment variables (USD per 1M tokens)
const INPUT = +(process.env.GPT4O_BATCH_INPUT_USD || '2.5');
const OUTPUT = +(process.env.GPT4O_BATCH_OUTPUT_USD || '10');

const inputCost = (avgPromptTokens * requestCount / 1_000_000) * INPUT;
const outputCost = (avgCompletionTokens * requestCount / 1_000_000) * OUTPUT;

const estimatedCost = inputCost + outputCost;
```

### 環境変数設定
```env
# GPT-4o Batch API Pricing (USD per 1M tokens)
GPT4O_BATCH_INPUT_USD=2.5
GPT4O_BATCH_OUTPUT_USD=10
```

## エラーハンドリング

### 一般的なエラー
- `Unauthorized`: 認証エラー
- `Tenant not found`: テナント情報なし
- `Active batch exists`: 既存のアクティブバッチジョブ
- `No properties found`: 生成対象物件なし
- `OpenAI API error`: OpenAI API エラー

### エラー対応
1. ユーザーフレンドリーなエラーメッセージ表示
2. 自動リトライ機能（API エラー時）
3. ログ記録とデバッグ情報

## セキュリティ

### Row Level Security (RLS)
- テナント別のデータ分離
- 認証ユーザーのみアクセス可能

### API キー管理
- 環境変数による安全な管理
- サーバーサイドのみでの使用

## 運用・監視

### 監視項目
- バッチジョブの成功率
- 平均処理時間
- コスト使用量
- エラー率

### パフォーマンス最適化
- チャンク処理による効率化
- 適切なポーリング間隔
- メモリ使用量の最適化

## 今後の拡張

### 予定機能
- 生成テンプレートのカスタマイズ
- 複数言語対応
- 画像を含む物件説明生成
- 生成履歴の管理

### スケーラビリティ
- 並列処理の最適化
- キューシステムの導入
- キャッシュ機能の追加
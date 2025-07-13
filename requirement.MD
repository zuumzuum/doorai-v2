| 項目 | 内容 |
| --- | --- |
| **目的** | "物件紹介文を AI で自動生成し、24 h LINE で即応答" を 7 **日間トライアル→月額課金** で本番検証する |
| **ターゲット** | 月 50 件前後の反響を扱う中小不動産会社 |
| **βユーザー目標** | 5 社（トライアル開始）→ 3 社有料継続 |

### 1. 必須機能（シンプル版）

| カテゴリ | 実装する | 
| --- | --- |
| **AI** | - **Batch 物件紹介生成** (GPT-4o Batch)<br>- **LINE 応答** (GPT-4o Realtime)(テナント別 DB 検索付き) |
| **決済** | **Stripe Checkout + Webhook**<br>①Standard ¥6,980 / 月 (280k tokens)<br>②Pro￥29,800 / 月 (1,200,000tokens)<br>※7 日トライアル期間あり |
| **UI** | -LP（ランディングページ）<br>-ログイン・認証画面<br>ダッシュボードでサイドタブを表示（3つ）<br>- 物件一覧＋「AI 生成」ボタン<br>-LINE 設定画面（channel access token,channel ID, Webhook URL）<br>- プライシングページ（Checkout ボタン） |
| **Auth / DB** | Supabase email/pwd ログイン + google認証<br>`tenants`, `properties`, `line_channels`, `subscriptions`, `usage_tokens` |
| **制限ガード** | 90 % トークン→警告, 100 %→Upgrade モーダル |

### 2. 技術スタック

| レイヤ | 技術 |
| --- | --- |
| Front | Next.js 15 / React 19 / Tailwind / shadcn/ui |
| DB / Auth | Supabase (Postgres 15 + RLS) |
| AI | GPT-4o Realtime / Batch |
| Messaging | LINE Messaging API |
| Billing | Stripe Checkout + Billing Portal + Webhook |
| Infra | Vercel Hobby |

### 3. アーキテクチャ

```
CSV Upload or 手動新規登録──▶ /api/batch-generate ─▶ GPT-4o Batch ─┐
LINE Webhook ─▶ /api/line ─▶ DAL properties.search ─▶ GPT-4o RT ─▶ LINE Reply
Stripe Checkout ─▶ Webhook ─▶ /api/stripe/webhook ─▶ subscriptions & usage_tokens
Edge Cron: batch-status-poller / monthly-token-reset
```

### 4. マイルストーン（4 日間）

| 日 | 完了条件 |
| --- | --- |
| **D1** | Supabase スキーマ & UI完成 |
| **D2** | LINEbot ＋ CSV→Batch 生成→description 更新 |
| **D3** | LINE 応答＋Pricing ページCheckout→Subscription 作成 & トライアル開始 |
| **D4** | Webhook → `subscriptions` 反映トークン制限警告／Upgrade 動作5 社オンボーディング |

### 6️⃣ Stripe 設定リスト

| Price ID | Mode | 金額 | metadata.tokens |
| --- | --- | --- | --- |
| `price_std_month` | subscription (trial 7d) | ¥6,980 | 280 000 |
| `price_pro_month` | subscription (trial 7d) | ¥29,800 | 1 200 000 |
| `price_pack_1m` | payment (one-time) | ¥25,000 | 1 000 000 |

Webhook：`checkout.session.completed`, `customer.subscription.*`

### 7. 主要画面フロー

1. **LP → Signup** → 7 日トライアル開始 (枠 = 700k)
2. **残量 90 %**：黄色バナー「残 70 k tokens」
3. **残量 100 %**：モーダル
    - 「1 M パック購入 ¥15,000」(Checkout)
    - 「あとで」→利用停止
4. トライアル Day 3：メール＋LINE「カード登録で自動継続」

### 8. リスクと緩和

| リスク | インパクト | 対策 |
| --- | --- | --- |
| トライアル→課金転換率<20 % | MRR未達 | Day 6 シーケンス強化・電話フォロー |
| Pack購入率<15 % | 粗利低下 | Pack¥22kテスト／枠900k→800kへ再調整 |
| OpenAI費膨張 | 利益圧迫 | Realtime比率を CloudWatch で監視→超過で Batch fallback |

### 9.ショートトライアル用ファネル

| 日 | タッチポイント | 目的 |
| --- | --- | --- |
| **Day 0** | CSV → AI生成→LINE連携（15 分） | 初期価値実感 |
| **Day 3** | メール＋LINE DM「LINE応答●件達成！」 | 軽い成果提示・カード登録案内 |
| **Day 6** | 警告バナー＋メール「明日で体験終了」 | 決済誘導 |

> CVR 目標：登録→課金 15 %
> 

### OpenAI API 価格 (2025-07 時点、Realtime vs Batch)

| モデル | API | **Input** | **Output** | 備考 |
| --- | --- | --- | --- | --- |
| **GPT-4o** | Realtime | **$5 / 1 M tok** | **$20 / 1 M tok** | 低レイテンシ [openai.com](https://openai.com/api/pricing/) |
| GPT-4o | **Batch** | **$2.5 / 1 M tok** | **$10 / 1 M tok** | Realtimeの半額 (24 h 非同期) [openai.com](https://openai.com/api/pricing/) |

> 1 USD ≒ ¥150（2025年想定レート）
> 
> 
> Realtime 1往復（200 in + 200 out = **400 tok**） → **約 ¥0.75**
> 
> Batch 物件コピー 1件（50 in + 1,000 out = **1,050 tok**） → **約 ¥1.52**
> 

---

## ターゲット別：月間トークン消費と原価仮説

| 指標 | **ライト店**<br>(月反響50件) | **ミドル店**<br>(月反響150件) | **ラージ店**<br>(月反響500件) |
| --- | --- | --- | --- |
| LINE往復/顧客 | 4 | 4 | 4 |
| **LINE往復数** | 50×4＝**200** | 150×4＝**600** | 500×4＝**2 000** |
| **LINE tok** | 200×400＝**80 k** | 600×400＝**240 k** | 2 000×400＝**800 k** |
| 物件コピー／月 | 50 | 200 | 900 |
| **Batch tok** | 50×1 050＝**52.5 k** | 200×1 050＝**210 k** | 900×1 050＝**945 k** |
| **総トークン** | **133 k** | **450 k** | **1 745 k** |
| **月原価** | ¥226 | ¥754 | ¥2 865 |

---

## プラン適合 & 売上シナリオ

| 価格設計案 | 上限枠 | ライト | ミドル | ラージ |
| --- | --- | --- | --- | --- |
| **Standard** ¥6,980 | 280 k tok | ◎ 枠内 | ▲ 170 k 超過… **Pack×1** 推奨 | × |
| **Pro** ¥29,800 | 1.2 M tok | — | ◎ 枠内 | ▲ 545 k 超… **Pack×1** 必須 |
| **Pack 1 M** ¥25,000 | +1 M | 不要 | 追加1回で総額 ¥31,980 > Pro →**自然にProへ誘導** | 追加1回で ¥54,800 |
- 粗利：どの層も **＞90 %**（原価が月 0.2–2.9 千円）

---

### 事業インパクト

| KPI | 標準 (Std) | 上位 (Pro) |
| --- | --- | --- |
| 想定導入社数 (5年) | 800 | 150 |
| 月額売上 | ¥5.6 M | ¥4.5 M |
| Pack比率 | 10 % | 20 % |
| **ARR** | ≈ **¥140 M** | Pack収入含め **¥180 M** 以上 |

---

## 結論

- **市場母集団 8,000 社超**（LINE活用 × 店舗≤5）→ シェア 10 % で **800 Std** は十分現実的。
- **Std 280 k tok / Pro 1.2 M tok / Pack ¥25k** なら<br> – ライト層 = 1プラン完結 – ミドル = 迷わず Pro にアップセル – ラージ = Pro＋Pack
- 全プラン粗利 90 % を守りつつ、Packが ARR の 25 % を押し上げる。

したがって **二段プラン＋高単価 Pack** が最もスケール余地が大きく、DoorAI の ARR を最大化できる価格戦略です。
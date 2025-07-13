# DoorAI プロジェクト進捗・全体まとめ（2024年7月時点）

---

## 1. プロジェクト概要
- **目的**: 物件紹介文をAIで自動生成し、24h LINEで即応答。不動産会社向けSaaS。
- **ターゲット**: 月50件前後の反響を扱う中小不動産会社。
- **提供価値**: 物件説明文の自動生成、LINE Botによる顧客対応、トークン課金型のサブスクリプション。

---

## 2. 技術スタック・設計方針
- **フロント**: Next.js 15 / React 19 / Tailwind / shadcn/ui
- **DB/Auth**: Supabase (Postgres 15 + RLS)
- **AI**: GPT-4o（Batch/Realtime）
- **決済**: Stripe Checkout + Webhook
- **インフラ**: Vercel Hobby
- **設計指針**: Server Components優先、Server Actions活用、型安全・一貫したエラーハンドリング

---

## 3. Supabase テーブル設計（主要テーブル抜粋）
- **tenants**: テナント管理（不動産会社単位）
- **properties**: 物件情報（AI説明文・バッチ生成管理カラム含む）
- **line_channels**: LINEチャネル情報
- **subscriptions**: サブスクリプション・プラン管理
- **usage_tokens**: トークン使用量・制限管理
- **batch_generations**: AIバッチ生成ジョブ管理

---

## 4. 実装済み機能
- [x] Supabaseスキーマ・RLS設計
- [x] 認証（メール/Google）
- [x] 物件管理UI（CSVインポート/AI一括生成/個別追加）
- [x] AIバッチ生成（OpenAI Batch API連携）
- [x] LINE Bot連携（Webhook/応答）
- [x] Stripe決済（サブスク/トライアル/パック）
- [x] トークン使用量ガード（90%警告・100%モーダル）
- [x] ダッシュボード・プラン管理画面
- [x] LP/FAQ/お問い合わせ/プライシングページ
- [x] サーバーアクション/型安全レスポンス/エラーハンドリング

---

## 5. 未実装・改善予定機能
- [ ] Zodによる入力バリデーション強化
- [ ] Stripe Webhookのエラー/リトライ強化
- [ ] AI生成の失敗時リカバリUI
- [ ] LINE Botの高度化（会話履歴/FAQ自動応答など）
- [ ] 管理者向けレポート・分析機能
- [ ] パフォーマンスモニタリング・詳細ログ
- [ ] テスト自動化（Vitest/pg-tapカバレッジ80%以上）
- [ ] CI/CDパイプラインの強化

---

## 6. 直近のTODO・マイルストーン
- D1: Supabaseスキーマ・UI完成（済）
- D2: LINEbot＋CSV→Batch生成→description更新（済）
- D3: LINE応答＋PricingページCheckout→Subscription作成&トライアル開始（済）
- D4: Webhook→subscriptions反映/トークン制限警告/Upgrade動作/5社オンボーディング（進行中）
- D5: 入力バリデーション・Stripeエラー処理・AI失敗時UI改善
- D6: 管理者レポート・FAQ自動応答・CI強化

---

## 7. 現状の課題・リスク
- トライアル→課金転換率の向上施策（Day6シーケンス/電話フォロー等）
- OpenAI APIコスト最適化（Batch/Realtime比率調整）
- Pack購入率向上・プラン誘導設計
- サポート体制・運用フローの整備

---

## 8. 今後の開発方針
- 顧客フィードバックを元にUI/UX改善を優先
- AI応答精度・説明文品質の継続的向上
- 管理機能・分析機能の拡充
- セキュリティ・パフォーマンスの強化

---

（最終更新: 2024年7月10日） 
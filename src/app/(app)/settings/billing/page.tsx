"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PLANS, Plan } from "@/lib/stripe";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Crown
} from "lucide-react";

export default function BillingPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  const [currentPlan] = useState({
    name: "トライアル",
    price: 0,
    tokensLimit: 700000,
    tokensUsed: 630000,
    expiresAt: "2024年7月16日",
    daysLeft: 5
  });

  const [usageHistory] = useState([
    { date: "2024-07-09", tokens: 45000, type: "LINE応答" },
    { date: "2024-07-08", tokens: 32000, type: "AI生成" },
    { date: "2024-07-07", tokens: 28000, type: "LINE応答" },
    { date: "2024-07-06", tokens: 52000, type: "AI生成" },
    { date: "2024-07-05", tokens: 38000, type: "LINE応答" }
  ]);

  const tokenUsagePercentage = (currentPlan.tokensUsed / currentPlan.tokensLimit) * 100;

  const plans = [
    {
      name: "Standard",
      price: 6980,
      tokens: 280000,
      features: [
        "物件登録数：100件まで",
        "CSV一括インポート",
        "AI物件説明文生成：月500回",
        "LINE Bot基本機能",
        "メールサポート"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: 29800,
      tokens: 1200000,
      features: [
        "物件登録数：1,000件まで",
        "CSV一括インポート",
        "AI物件説明文生成：月2,000回",
        "LINE Bot高度機能",
        "チャットサポート",
        "カスタマイズ機能",
        "レポート機能"
      ],
      popular: true
    }
  ];

  const handleUpgrade = (planName: string) => {
    try {
      let planType: Plan;
      
      // プラン名からPlan enumにマッピング
      switch (planName.toLowerCase()) {
        case 'standard':
          planType = Plan.STD_MONTH;
          break;
        case 'pro':
          planType = Plan.PRO_MONTH;
          break;
        default:
          console.error('未知のプラン名:', planName);
          return;
      }

      const plan = PLANS[planType];
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      // Stripe Checkout URLを構築
      const checkoutUrl = new URL(`https://checkout.stripe.com/c/pay/${plan.priceId}`);
      checkoutUrl.searchParams.set('locale', 'ja');
      checkoutUrl.searchParams.set('success_url', `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
      checkoutUrl.searchParams.set('cancel_url', `${baseUrl}/checkout/cancel`);
      
      // ユーザー情報をメタデータとして追加
      if (user && tenant) {
        checkoutUrl.searchParams.set('client_reference_id', tenant.id);
        checkoutUrl.searchParams.set('customer_email', user.email || '');
      }
      
      // 新しいタブで決済ページを開く
      window.open(checkoutUrl.toString(), '_blank');
      
    } catch (error) {
      console.error('チェックアウトURL生成エラー:', error);
    }
  };

  const handlePurchaseTokens = () => {
    try {
      const plan = PLANS[Plan.PACK_1M];
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      // Stripe Checkout URLを構築
      const checkoutUrl = new URL(`https://checkout.stripe.com/c/pay/${plan.priceId}`);
      checkoutUrl.searchParams.set('locale', 'ja');
      checkoutUrl.searchParams.set('success_url', `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
      checkoutUrl.searchParams.set('cancel_url', `${baseUrl}/checkout/cancel`);
      
      // ユーザー情報をメタデータとして追加
      if (user && tenant) {
        checkoutUrl.searchParams.set('client_reference_id', tenant.id);
        checkoutUrl.searchParams.set('customer_email', user.email || '');
      }
      
      // 新しいタブで決済ページを開く
      window.open(checkoutUrl.toString(), '_blank');
      
    } catch (error) {
      console.error('トークンパック購入エラー:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プラン・使用状況</h1>
        <p className="text-muted-foreground">
          現在のプランとトークン使用状況の管理
        </p>
      </div>

      {/* Current Plan Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">現在のプラン</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPlan.name}</div>
            <p className="text-xs text-muted-foreground">
              {currentPlan.daysLeft}日間無料体験中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月額料金</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{currentPlan.price.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {currentPlan.expiresAt}まで無料
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有効期限</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPlan.daysLeft}日</div>
            <p className="text-xs text-muted-foreground">
              トライアル残り期間
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                トークン使用状況
              </CardTitle>
              <CardDescription>
                今月のトークン使用量と残量
              </CardDescription>
            </div>
            <Badge 
              variant={tokenUsagePercentage >= 90 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {tokenUsagePercentage.toFixed(1)}% 使用中
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>使用済み: {currentPlan.tokensUsed.toLocaleString()}トークン</span>
              <span>上限: {currentPlan.tokensLimit.toLocaleString()}トークン</span>
            </div>
            <Progress value={tokenUsagePercentage} className="h-2" />
            <div className="text-sm text-muted-foreground">
              残り: {(currentPlan.tokensLimit - currentPlan.tokensUsed).toLocaleString()}トークン
            </div>
          </div>

          {tokenUsagePercentage >= 90 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-800 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                トークン使用量が90%を超えました
              </div>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" onClick={handlePurchaseTokens}>
                  トークンパック購入 (¥25,000)
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpgrade("Pro")}>
                  Proプランにアップグレード
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle>使用履歴</CardTitle>
          <CardDescription>
            直近のトークン使用状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageHistory.map((usage, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">{usage.date}</p>
                    <p className="text-xs text-muted-foreground">{usage.type}</p>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {usage.tokens.toLocaleString()} tokens
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>利用可能なプラン</CardTitle>
          <CardDescription>
            あなたのビジネスに最適なプランを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan, index) => (
              <Card key={index} className={plan.popular ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.popular && (
                      <Badge>人気No.1</Badge>
                    )}
                  </div>
                  <CardDescription>
                    <span className="text-2xl font-bold">¥{plan.price.toLocaleString()}</span>
                    <span className="text-sm">/月</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <strong>{plan.tokens.toLocaleString()}トークン</strong>/月
                  </div>
                  
                  <div className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {plan.name}プランを選択
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Pack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            トークンパック
          </CardTitle>
          <CardDescription>
            追加のトークンが必要な場合はトークンパックを購入できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">1,000,000トークンパック</h4>
              <p className="text-sm text-muted-foreground">
                追加で1Mトークンを購入（有効期限なし）
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">¥25,000</div>
              <Button onClick={handlePurchaseTokens}>
                購入する
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
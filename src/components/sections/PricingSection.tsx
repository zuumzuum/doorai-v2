import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  const plans = [
    {
      name: "スタータープラン",
      price: "¥9,800",
      period: "/月",
      description: "個人事業主・小規模事業者向け",
      features: [
        "物件登録数：100件まで",
        "CSV一括インポート",
        "AI物件説明文生成：月500回",
        "LINE Bot基本機能",
        "メールサポート",
        "データバックアップ"
      ],
      notIncluded: [
        "カスタマイズ機能",
        "優先サポート",
        "API連携"
      ],
      popular: false,
      buttonText: "14日間無料体験"
    },
    {
      name: "ビジネスプラン",
      price: "¥29,800",
      period: "/月",
      description: "中小企業・成長企業向け",
      features: [
        "物件登録数：1,000件まで",
        "CSV一括インポート",
        "AI物件説明文生成：月2,000回",
        "LINE Bot高度機能",
        "チャットサポート",
        "データバックアップ",
        "カスタマイズ機能",
        "レポート機能",
        "複数ユーザー管理"
      ],
      notIncluded: [
        "専用サポート",
        "オンプレミス対応"
      ],
      popular: true,
      buttonText: "14日間無料体験"
    },
    {
      name: "エンタープライズ",
      price: "お問い合わせ",
      period: "",
      description: "大企業・多店舗展開向け",
      features: [
        "物件登録数：無制限",
        "CSV一括インポート",
        "AI物件説明文生成：無制限",
        "LINE Bot全機能",
        "専用サポート",
        "データバックアップ",
        "フルカスタマイズ",
        "高度なレポート機能",
        "無制限ユーザー管理",
        "API連携",
        "オンプレミス対応",
        "SLA保証"
      ],
      notIncluded: [],
      popular: false,
      buttonText: "お問い合わせ"
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            シンプルで分かりやすい料金体系
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            あなたのビジネス規模に合わせたプランをご用意。すべてのプランで14日間無料体験可能
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    人気No.1
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3 opacity-50">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full mt-6" 
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.name === "エンタープライズ" ? "#contact" : "/signup"}>
                    {plan.buttonText}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            すべてのプランに含まれる基本機能
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="px-3 py-1 bg-secondary rounded-full">SSL暗号化</span>
            <span className="px-3 py-1 bg-secondary rounded-full">99.9%稼働率保証</span>
            <span className="px-3 py-1 bg-secondary rounded-full">データ自動バックアップ</span>
            <span className="px-3 py-1 bg-secondary rounded-full">モバイル対応</span>
            <span className="px-3 py-1 bg-secondary rounded-full">いつでも解約可能</span>
          </div>
        </div>
      </div>
    </section>
  );
}
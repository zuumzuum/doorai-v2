import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Upload, 
  Bot, 
  MessageSquare, 
  Database, 
  Clock, 
  TrendingUp,
  FileText,
  Settings,
  Shield
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Upload,
      title: "CSV一括インポート",
      description: "物件情報をCSVファイルで簡単に一括アップロード。手動入力の手間を大幅削減。",
      color: "text-blue-600"
    },
    {
      icon: Bot,
      title: "AI自動生成",
      description: "GPT-4o Batch APIを活用し、物件の特徴を活かした魅力的な説明文を自動生成。",
      color: "text-purple-600"
    },
    {
      icon: MessageSquare,
      title: "LINE Bot 24時間対応",
      description: "お客様からの問い合わせに24時間自動で対応。営業機会を逃しません。",
      color: "text-green-600"
    },
    {
      icon: Database,
      title: "統合データベース",
      description: "Supabaseで物件情報を安全に管理。リアルタイムでの更新・検索が可能。",
      color: "text-orange-600"
    },
    {
      icon: Clock,
      title: "リアルタイム更新",
      description: "物件情報の変更が即座に反映。常に最新の情報をお客様に提供。",
      color: "text-red-600"
    },
    {
      icon: TrendingUp,
      title: "成約率向上",
      description: "AIが生成する魅力的な物件説明と即座の対応で成約率を大幅に向上。",
      color: "text-indigo-600"
    },
    {
      icon: FileText,
      title: "レポート機能",
      description: "問い合わせ分析や成約データの可視化で、営業戦略の最適化をサポート。",
      color: "text-teal-600"
    },
    {
      icon: Settings,
      title: "カスタマイズ可能",
      description: "会社のブランドに合わせたカスタマイズが可能。独自の営業スタイルに対応。",
      color: "text-pink-600"
    },
    {
      icon: Shield,
      title: "セキュリティ",
      description: "エンタープライズレベルのセキュリティで、顧客情報を安全に保護。",
      color: "text-gray-600"
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            充実の機能でDXを実現
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            不動産業界に特化した機能で、あなたの業務を効率化し、売上を向上させます
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-background flex items-center justify-center`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Bot, FileText, MessageCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            不動産業界を変える
            <br />
            <span className="text-primary">AI-Powered DX</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            CSV物件情報を自動解析し、AIが物件説明文を生成。LINE Botで24時間お客様対応。
            <br />
            あなたの不動産業務を革新する「DoorAI」
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" asChild>
              <Link href="/signup">
                無料で始める
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">
                デモを見る
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">CSV自動インポート</h3>
              <p className="text-muted-foreground">
                物件情報をCSVで一括アップロード
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI自動生成</h3>
              <p className="text-muted-foreground">
                GPT-4oが魅力的な物件説明文を自動生成
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">LINE Bot対応</h3>
              <p className="text-muted-foreground">
                24時間自動でお客様の問い合わせに対応
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "無料体験期間中に解約しても料金は発生しませんか？",
      answer: "はい、14日間の無料体験期間中にいつでも解約可能で、料金は一切発生しません。解約後も体験期間中に作成したデータは保持されます。"
    },
    {
      question: "CSV形式の物件データはどのような形式に対応していますか？",
      answer: "一般的なCSV形式（UTF-8、Shift_JIS）に対応しています。物件名、住所、価格、間取り、築年数、設備などの基本項目があれば自動で読み込み可能です。詳細な形式については導入時にサポートいたします。"
    },
    {
      question: "AIが生成する物件説明文の品質はどの程度ですか？",
      answer: "GPT-4oを使用し、不動産業界に特化した学習データで訓練されています。物件の特徴を活かした魅力的な説明文を生成し、実際に成約率が平均30%向上した実績があります。"
    },
    {
      question: "LINE Botの設定は複雑ですか？",
      answer: "いいえ、管理画面から簡単に設定できます。LINE公式アカウントと連携するだけで、24時間自動応答が開始されます。初期設定のサポートも提供しています。"
    },
    {
      question: "他の不動産管理システムとの連携は可能ですか？",
      answer: "ビジネスプラン以上でAPI連携が可能です。主要な不動産管理システムとの連携実績があります。具体的な連携方法については個別にご相談ください。"
    },
    {
      question: "データのセキュリティは大丈夫ですか？",
      answer: "エンタープライズレベルのセキュリティを提供しています。SSL暗号化、定期的なバックアップ、アクセス制御、SOC2準拠などで顧客データを保護しています。"
    },
    {
      question: "月の利用制限を超えた場合はどうなりますか？",
      answer: "制限を超えた場合、自動的に上位プランへのアップグレードをご案内します。一時的な超過の場合は追加料金でご利用いただけます。"
    },
    {
      question: "サポート体制について教えてください。",
      answer: "プランに応じてメール、チャット、電話サポートを提供しています。エンタープライズプランでは専任担当者が付きます。平日9:00-18:00でサポートしています。"
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            よくある質問
          </h2>
          <p className="text-xl text-muted-foreground">
            お客様からよくいただく質問にお答えします
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-background rounded-lg border">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
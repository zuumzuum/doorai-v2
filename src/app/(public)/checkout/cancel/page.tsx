"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Home, CreditCard } from "lucide-react";
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-orange-800">
            お支払いがキャンセルされました
          </CardTitle>
          <CardDescription className="text-gray-600">
            決済手続きが中断されました。いつでも再度お試しいただけます。
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">お困りですか？</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 決済情報の入力に不安がある場合</li>
              <li>• プラン内容についてご質問がある場合</li>
              <li>• 技術的な問題が発生した場合</li>
            </ul>
            <p className="text-sm text-blue-700 mt-2">
              お気軽にサポートまでお問い合わせください。
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/settings/billing">
                <CreditCard className="w-4 h-4 mr-2" />
                決済を再開する
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ダッシュボードに戻る
              </Link>
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                ホームに戻る
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              ご不明な点がございましたら
            </p>
            <Link 
              href="#contact" 
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              サポートまでお問い合わせください
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
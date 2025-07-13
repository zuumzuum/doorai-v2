"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const session = searchParams.get('session_id');
    setSessionId(session);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            お支払いが完了しました！
          </CardTitle>
          <CardDescription className="text-gray-600">
            ご購入ありがとうございます。サービスの準備が整い次第、ご登録のメールアドレスに詳細をお送りします。
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {sessionId && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">決済ID:</span>
              </p>
              <p className="text-xs font-mono text-gray-800 break-all">
                {sessionId}
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">次のステップ</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• サブスクリプションが有効化されます（数分程度）</li>
              <li>• 確認メールをお送りします</li>
              <li>• ダッシュボードで新機能をご利用いただけます</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <ArrowRight className="w-4 h-4 mr-2" />
                ダッシュボードに移動
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                ホームに戻る
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              ご不明な点がございましたら、
              <Link href="#contact" className="text-blue-600 hover:underline">
                サポートまでお問い合わせください
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            DoorAI
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>認証エラー</CardTitle>
            <CardDescription>
              メール確認リンクの処理中にエラーが発生しました
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>考えられる原因：</p>
              <ul className="mt-2 space-y-1">
                <li>• 確認リンクの有効期限が切れている</li>
                <li>• リンクが既に使用されている</li>
                <li>• リンクが不正または破損している</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">
                  ログインページに戻る
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">
                  新規登録をやり直す
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
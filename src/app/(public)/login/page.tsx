"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Chrome, AlertCircle } from "lucide-react";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const { data, error: authError } = await signInWithEmail(email, password);
      
      console.log("Login attempt:", { data, authError }); // Debug log
      
      if (authError) {
        setError(authError.message);
        console.error("Auth error:", authError);
      } else if (data?.user) {
        console.log("Login successful, redirecting..."); // Debug log
        // Force a page reload to trigger middleware and context updates
        window.location.href = "/dashboard";
      } else {
        setError("ログインデータが不正です。");
      }
    } catch (error) {
      setError("ログインに失敗しました。もう一度お試しください。");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    const { data, error: authError } = await signInWithGoogle();
    
    if (authError) {
      setError(authError.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            DoorAI
          </Link>
          <p className="text-muted-foreground mt-2">
            不動産業界向けAI-SaaS
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>ログイン</CardTitle>
            <CardDescription>
              アカウントにログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              </div>
            )}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Googleでログイン
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  または
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <Mail className="h-4 w-4 mr-2" />
                {isLoading ? "ログイン中..." : "メールでログイン"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                アカウントをお持ちでない方は{" "}
              </span>
              <Link href="/signup" className="text-primary hover:underline">
                新規登録
              </Link>
            </div>

            <div className="text-center text-sm">
              <Link href="/forgot-password" className="text-muted-foreground hover:text-primary">
                パスワードをお忘れですか？
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
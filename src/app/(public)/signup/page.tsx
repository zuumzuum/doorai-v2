"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Chrome, Building2, User, AlertCircle, CheckCircle } from "lucide-react";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      setIsLoading(false);
      return;
    }
    
    const { data, error: authError } = await signUpWithEmail(
      formData.email, 
      formData.password, 
      formData.name
    );
    
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
      console.log("Signup result:", data); // Debug log
      
      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        setError("確認メールを送信しました。メールを確認してアカウントを有効化してください。");
      } else if (data.user) {
        router.push("/dashboard");
      }
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignup = async () => {
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
            7日間無料トライアル開始
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>無料で始める</CardTitle>
            <CardDescription>
              7日間無料トライアル（700k tokens）
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

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center text-green-800 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  アカウントが作成されました。確認メールをご確認ください。
                </div>
              </div>
            )}
            <Button
              onClick={handleGoogleSignup}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              <Chrome className="h-5 w-5 mr-2" />
              🚀 Googleで無料開始（推奨）
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

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">お名前</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="山田 太郎"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="8文字以上"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード確認</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="パスワードを再入力"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <User className="h-4 w-4 mr-2" />
                {isLoading ? "アカウント作成中..." : "7日間無料で始める"}
              </Button>
            </form>

            <div className="text-xs text-muted-foreground text-center">
              アカウントを作成することで、
              <Link href="/terms" className="hover:text-primary">利用規約</Link>
              および
              <Link href="/privacy" className="hover:text-primary">プライバシーポリシー</Link>
              に同意したものとみなされます。
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                すでにアカウントをお持ちの方は{" "}
              </span>
              <Link href="/login" className="text-primary hover:underline">
                ログイン
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
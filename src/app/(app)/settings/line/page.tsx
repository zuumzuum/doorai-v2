"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Eye, 
  EyeOff,
  AlertCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { 
  saveLineSettings, 
  getLineSettings, 
  testLineConnection, 
  toggleLineStatus
} from "@/lib/actions/line-settings";
import { type LineSettingsInput } from "@/lib/schemas/auth";

export default function LineSettingsPage() {
  const [settings, setSettings] = useState<LineSettingsInput>({
    channelAccessToken: "",
    channelSecret: "",
    channelId: "",
  });
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/line/webhook`;

  // Load existing settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const result = await getLineSettings();
      if (result.success && result.data) {
        setSettings({
          channelId: result.data.channelId,
          channelSecret: "", // Don't show secret for security
          channelAccessToken: "", // Don't show token for security
        });
        setIsConnected(result.data.isActive);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (field: keyof LineSettingsInput, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await saveLineSettings(settings);
    
    if (result.success) {
      setSuccess("LINE設定を保存しました");
      setIsConnected(result.data.isActive);
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setError(null);
    setSuccess(null);

    const result = await testLineConnection();
    
    if (result.success) {
      setSuccess("LINE Botとの接続に成功しました");
    } else {
      setError(result.error);
    }
    
    setIsTesting(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("クリップボードにコピーしました");
    } catch (err) {
      setError("コピーに失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LINE設定</h1>
        <p className="text-muted-foreground">
          LINE Botの設定と接続状況の管理
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                接続状況
              </CardTitle>
              <CardDescription>
                LINE Botの現在の接続状態
              </CardDescription>
            </div>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className="flex items-center"
            >
              {isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  接続中
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  未接続
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                LINE Botが正常に動作しています
              </div>
              <div className="text-sm text-muted-foreground">
                最終確認: 2024年7月9日 14:30
              </div>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleTest} disabled={isTesting}>
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      テスト中...
                    </>
                  ) : (
                    "接続テスト"
                  )}
                </Button>
                <Button size="sm" variant="outline">
                  ログを表示
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center text-sm text-red-600">
                <XCircle className="h-4 w-4 mr-2" />
                LINE Botが設定されていません
              </div>
              <div className="text-sm text-muted-foreground">
                下記の設定を完了してください
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>LINE Bot設定</CardTitle>
          <CardDescription>
            LINE Developersコンソールから取得した情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel Access Token */}
          <div className="space-y-2">
            <Label htmlFor="channelAccessToken">
              Channel Access Token
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="channelAccessToken"
                  type={showToken ? "text" : "password"}
                  value={settings.channelAccessToken}
                  onChange={(e) => handleInputChange("channelAccessToken", e.target.value)}
                  placeholder="Channel Access Tokenを入力"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              LINE Developersコンソールの「Messaging API」タブで取得できます
            </p>
          </div>

          {/* Channel Secret */}
          <div className="space-y-2">
            <Label htmlFor="channelSecret">
              Channel Secret
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="channelSecret"
                  type={showSecret ? "text" : "password"}
                  value={settings.channelSecret}
                  onChange={(e) => handleInputChange("channelSecret", e.target.value)}
                  placeholder="Channel Secretを入力"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              LINE Developersコンソールの「Basic settings」タブで確認できます
            </p>
          </div>

          {/* Channel ID */}
          <div className="space-y-2">
            <Label htmlFor="channelId">
              Channel ID
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="channelId"
              value={settings.channelId}
              onChange={(e) => handleInputChange("channelId", e.target.value)}
              placeholder="Channel IDを入力"
            />
            <p className="text-xs text-muted-foreground">
              LINE Developersコンソールの「Basic settings」タブで確認できます
            </p>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <div className="flex space-x-2">
              <Input
                id="webhookUrl"
                value={webhookUrl}
                readOnly
                className="bg-secondary"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              このURLをLINE DevelopersコンソールのWebhook URLに設定してください
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center pt-4">
            <Button onClick={handleSave} disabled={isLoading} className="min-w-24">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "設定を保存"
              )}
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                LINE Developers
              </Button>
              <Button variant="outline" size="sm">
                設定ガイド
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            設定ガイド
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. LINE Developersアカウントの作成</h4>
              <p className="text-sm text-muted-foreground">
                LINE Developersコンソールにログインし、新しいチャンネルを作成してください。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Messaging APIの有効化</h4>
              <p className="text-sm text-muted-foreground">
                作成したチャンネルでMessaging APIを有効にし、Channel Access Tokenを取得してください。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Webhook URLの設定</h4>
              <p className="text-sm text-muted-foreground">
                上記のWebhook URLをLINE DevelopersコンソールのWebhook設定に追加してください。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. 動作確認</h4>
              <p className="text-sm text-muted-foreground">
                設定完了後、LINE Botにメッセージを送信して正常に動作することを確認してください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
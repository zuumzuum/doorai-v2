"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  User, 
  LogOut, 
  Settings,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { signOut } from "@/lib/auth";

export function Header() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push("/login");
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      {/* Token Usage Warning */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-muted-foreground">
            トークン使用量: 630k / 700k (90%)
          </span>
          <Badge variant="secondary" className="text-yellow-600">
            残り 70k
          </Badge>
        </div>
      </div>

      {/* User Menu */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{tenant?.name || user?.user_metadata?.name || "ユーザー"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
                {tenant?.company_name && (
                  <p className="text-xs text-muted-foreground">
                    {tenant.company_name}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              アカウント設定
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              プロフィール
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
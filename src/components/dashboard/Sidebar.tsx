"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building2, 
  MessageSquare, 
  Settings, 
  BarChart3,
  CreditCard
} from "lucide-react";

const navigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: Home },
  { name: "物件管理", href: "/properties", icon: Building2 },
  { name: "LINE設定", href: "/settings/line", icon: MessageSquare },
  { name: "プラン・使用状況", href: "/settings/billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="text-2xl font-bold text-primary">
          DoorAI
        </Link>
        <p className="text-sm text-muted-foreground mt-1">
          不動産AI-SaaS
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div>トライアル残り: 5日</div>
          <div className="mt-1">トークン使用量: 15k / 700k</div>
        </div>
      </div>
    </div>
  );
}
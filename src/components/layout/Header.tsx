"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">DoorAI</span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              機能
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
              料金
            </Link>
            <Link href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
              お問い合わせ
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/login">ログイン</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">無料で始める</Link>
            </Button>
          </div>

          <button
            onClick={toggleMenu}
            className="md:hidden p-2"
            aria-label="メニューを開く"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={toggleMenu}
              >
                機能
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={toggleMenu}
              >
                料金
              </Link>
              <Link
                href="#faq"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={toggleMenu}
              >
                FAQ
              </Link>
              <Link
                href="#contact"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={toggleMenu}
              >
                お問い合わせ
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/login">ログイン</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">無料で始める</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
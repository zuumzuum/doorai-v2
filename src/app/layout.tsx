import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoorAI - 不動産業界向けAI-SaaS",
  description: "物件紹介文をAIで自動生成し、24時間LINEで即応答する不動産業界向けSaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
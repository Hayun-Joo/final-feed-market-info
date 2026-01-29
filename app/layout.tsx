import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "배합사료 원료 시황 대시보드",
  description: "한국 배합사료 회사를 위한 실시간 원료 시황 정보 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {children}
      </body>
    </html>
  );
}

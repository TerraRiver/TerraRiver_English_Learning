import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileNav from "./components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "单词本",
  description: "个人英语词汇知识库",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900`}
      >
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-8">
                <a href="/" className="text-base font-semibold tracking-tight text-gray-900">
                  单词本
                </a>
                <div className="hidden sm:flex items-center gap-0.5">
                  <a href="/" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors">首页</a>
                  <a href="/dictionary" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors">词典</a>
                  <a href="/review" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors">复习</a>
                  <a href="/stats" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors">统计</a>
                  <a href="/word/new" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors">添加词条</a>
                </div>
              </div>
              <MobileNav />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}

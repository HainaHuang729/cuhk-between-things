import type { Metadata } from "next";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "CUHK Campus Marketplace",
  description: "CUHK 校园交易与资源共享社区"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}

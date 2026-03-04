import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechStore - Premium Electronics",
  description: "Discover the latest in premium electronics and accessories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Ép nền trắng (bg-white) và chữ đen (text-slate-900) cho toàn bộ web */}
      <body className="bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
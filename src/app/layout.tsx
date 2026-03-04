import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// 1. Import Toaster
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "TechStone - Innovation & Technology",
  description: "Your ultimate tech marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans flex flex-col min-h-screen selection:bg-cyan-500/30">
        <Header />
        
        <div className="flex-grow">
          {children}
        </div>
        
        <Footer />

        {/* 2. Đặt Toaster ở đây, cấu hình màu sắc cho hợp với TechStone */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '10px',
            },
            success: {
              style: {
                background: '#0891b2', // Màu cyan-600
              },
            },
          }}
        />
      </body>
    </html>
  );
}
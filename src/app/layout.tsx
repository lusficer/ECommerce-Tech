import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
                background: '#0891b2', // cyan-600
              },
            },
          }}
        />
      </body>
    </html>
  );
}
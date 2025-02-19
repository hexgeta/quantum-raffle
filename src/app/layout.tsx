'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Provider from "@/wagmiProvider/provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <main className="grid place-items-center min-h-screen bg-main/15">
            <div className="h-full w-full grid md:max-w-6xl px-6 md:px-12">
              {children}
            </div>
          </main>
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}

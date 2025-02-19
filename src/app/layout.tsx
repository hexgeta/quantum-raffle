'use client';

import { Jura } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Provider from "@/wagmiProvider/provider";

const jura = Jura({ 
  subsets: ["latin"],
  weight: "700"
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={jura.className}>
        <Provider>
          <main className="min-h-screen bg-black">
            <div className="mx-auto max-w-6xl p-10">
              {children}
            </div>
          </main>
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}

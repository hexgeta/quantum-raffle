'use client';

import { Jura } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Provider from "@/wagmiProvider/provider";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const jura = Jura({ 
  subsets: ["latin"],
  weight: "700"
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Clear UTM parameters on page load
    if (window.location.search && window.location.search.includes('utm_')) {
      router.replace(pathname);
    }
  }, [pathname, router]);

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

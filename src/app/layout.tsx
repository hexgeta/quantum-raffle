import { Jura } from "next/font/google";
import "./globals.css";
import Provider from "@/wagmiProvider/provider";
import { Toaster } from "@/components/ui/toaster";
import { NavBar } from "@/components/nav-bar";
import type { Metadata } from 'next';

const jura = Jura({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Quantum Raffle Analytics',
  description: 'Quantum Raffle Analytics',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jura.className} bg-black`}>
        <Provider>
          <NavBar />
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

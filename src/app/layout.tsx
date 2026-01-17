import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import clsx from "clsx";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: "DualReveal",
  description: "A private quiz that turns unspoken wishes into a shared reveal."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={clsx(fraunces.variable, workSans.variable)}>
      <body className="bg-mint-50 text-navy">
        <div className="min-h-screen bg-atmosphere">
          <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

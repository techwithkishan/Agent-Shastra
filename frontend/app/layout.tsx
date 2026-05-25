import type { Metadata } from "next";
import { Playfair_Display, Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: "API Failure Detection & Debugging Agent",
  description: "AI SRE telemetry diagnostics loop to detect anomalies and diagnose failures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${playfair.variable} ${inter.variable} ${outfit.variable}`}
    >
      <head>
        {/* Google Analytics tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RLM0BDQ0GF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-RLM0BDQ0GF');
          `}
        </Script>
      </head>
      <body
        className="bg-[#070708] text-neutral-200 antialiased min-h-screen"
        style={{
          fontFamily: "var(--font-sans)",
        }}
      >
        {children}
      </body>
    </html>
  );
}

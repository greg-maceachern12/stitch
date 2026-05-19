import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Visuai",
  description: "Turn words into worlds — add AI illustrations to your ebooks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <AppProviders>{children}</AppProviders>
        <div
          id="hiddenDiv"
          style={{
            position: "absolute",
            visibility: "hidden",
            overflow: "hidden",
            height: 0,
          }}
        />
      </body>
    </html>
  );
}

import "./globals.css";
import { fontVariables, openSans } from "@/lib/fonts";

export const metadata = {
  title: "Visuai",
  description: "Turn words into worlds — add AI illustrations to your ebooks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className={`${openSans.className} min-h-screen bg-background text-foreground`}>
        {children}
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

"use client";

import { Coffee } from "lucide-react";
import Navbar from "@/components/Navbar";

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/gregmac";

const MAIN_CLASS = {
  form: "mx-auto flex w-full max-w-content flex-1 flex-col items-center px-4 py-12 md:py-16",
  default: "mx-auto w-full max-w-doc flex-1 px-4 py-10 md:py-14",
  landing: "flex w-full flex-1 flex-col",
};

export default function SiteChrome({ children, variant = "default" }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className={MAIN_CLASS[variant] ?? MAIN_CLASS.default}>
        {children}
      </main>
      <footer className="border-t border-border py-4 text-center text-sm text-muted">
        <a
          href={BUY_ME_A_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
        >
          <Coffee
            className="h-4 w-4 shrink-0 text-amber-500"
            strokeWidth={2.25}
            aria-hidden="true"
          />
          Buy me a coffee
        </a>
      </footer>
    </div>
  );
}

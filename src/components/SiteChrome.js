"use client";

import Navbar from "@/components/Navbar";

export default function SiteChrome({ children, variant = "default" }) {
  const isForm = variant === "form";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main
        className={
          isForm
            ? "mx-auto flex w-full max-w-content flex-col items-center px-4 py-12 md:py-16"
            : "mx-auto w-full max-w-doc px-4 py-10 md:py-14"
        }
      >
        {children}
      </main>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initializeGoogleAnalytics, logPageView } from "@/coreFunctions/service";

export default function AppProviders({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    initializeGoogleAnalytics();
  }, []);

  useEffect(() => {
    logPageView();
  }, [pathname]);

  return children;
}

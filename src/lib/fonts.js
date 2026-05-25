import { Open_Sans } from "next/font/google";
import localFont from "next/font/local";

export const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const lovato = localFont({
  src: [
    {
      path: "../../public/fonts/Lovato Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Lovato Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Lovato Demi.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Lovato Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-lovato",
  display: "swap",
});

export const fontVariables = `${openSans.variable} ${lovato.variable}`;

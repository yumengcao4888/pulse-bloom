import localFont from "next/font/local";
import { Inter, Italianno } from "next/font/google";

export const sfPro = localFont({
  src: "./SF-Pro-Display-Medium.otf",
  variable: "--font-sf",
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const italianno = Italianno({
  variable: "--font-italianno",
  subsets: ["latin"],
  weight: "400"
});
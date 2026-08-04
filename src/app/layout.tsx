import "@/app/globals.css";
import "@fontsource-variable/geist";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata = {
  title: "UniKai · Satu Verse, Satu Komunitas",
  description: "Baca, balas, dan mulai diskusi. Obrolan dari setiap sudut komunitasmu.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

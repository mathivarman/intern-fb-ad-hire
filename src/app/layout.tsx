import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "AD Contacts | Student Admissions & Leads",
  description: "AD Contacts — E-Learning Student Admissions & Leads Portal",
  icons: {
    icon: "/apptronlogopngcircle.png",
    apple: "/apptronlogopngcircle.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

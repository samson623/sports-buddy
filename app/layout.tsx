import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import ThemeProvider from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/desktop/Sidebar";
import BottomNav from "@/components/mobile/BottomNav";
import dynamic from "next/dynamic";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineBanner from "@/components/OfflineBanner";
import QnAContainer from "@/components/QnAContainer";
const Toaster = dynamic(() => import("sonner").then(m => m.Toaster), { ssr: false })

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Sports Buddy",
  description: "Schedules, insights, and more",
  themeColor: "#1E40AF",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme === 'dark' || (theme === null && systemDark);
                if (isDark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
          <OfflineBanner />
          <Header />
          <Sidebar />
          <main className="min-h-screen lg:pl-64">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <InstallPrompt />
          <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
        {/* Global Q&A (desktop sidebar + mobile overlay) */}
        <QnAContainer />
      </body>
    </html>
  );
}

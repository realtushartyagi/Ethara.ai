import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ethara AI | Team Task Manager",
  description: "Advanced task management platform by Ethara AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster 
              position="top-right" 
              expand={false} 
              richColors 
              closeButton
              toastOptions={{
                style: {
                  borderRadius: '1rem',
                  border: '1px solid #eff2f7',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontFamily: 'var(--font-poppins)',
                },
                className: "premium-toast",
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

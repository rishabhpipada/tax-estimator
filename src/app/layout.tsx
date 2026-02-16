import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "W2 Tax Liability Estimator",
  description: "Upload your W2 and get a 2025 federal tax liability estimate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Northstar Access",
  description: "A Keycloak authentication workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <main className="app-shell">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
// import "./globals.css";

export const metadata: Metadata = {
  title: "Keycloak OIDC SSO Demo",
  description: "Minimal Next.js App Router Keycloak OIDC verification app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}

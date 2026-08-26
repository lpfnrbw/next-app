import NextAuth, { type NextAuthConfig } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/** Server-only Keycloak configuration for authentication. */
export const authConfig: NextAuthConfig = {
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  providers: [
    KeycloakProvider({
      issuer: requiredEnv("KEYCLOAK_ISSUER"),
      clientId: requiredEnv("KEYCLOAK_CLIENT_ID"),
      clientSecret: requiredEnv("KEYCLOAK_CLIENT_SECRET"),
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth(authConfig);

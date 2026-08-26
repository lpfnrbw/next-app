import NextAuth, { type NextAuthConfig } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

type KeycloakRoleProfile = {
  realm_access?: { roles?: unknown };
  resource_access?: Record<string, { roles?: unknown }>;
};

type KeycloakTokenAccount = {
  id_token?: unknown;
  access_token?: unknown;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function roleList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === "string")
    : [];
}

function rolesFromProfile(profile: unknown): string[] {
  const keycloakProfile = profile as KeycloakRoleProfile;
  const realmRoles = roleList(keycloakProfile.realm_access?.roles);
  const clientRoles = roleList(
    keycloakProfile.resource_access?.[process.env.KEYCLOAK_CLIENT_ID ?? ""]?.roles,
  );

  return [...new Set([...realmRoles, ...clientRoles])];
}

function rolesFromJwt(token: unknown): string[] {
  if (typeof token !== "string") {
    return [];
  }

  const [, payload] = token.split(".");

  if (!payload) {
    return [];
  }

  try {
    return rolesFromProfile(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
  } catch {
    return [];
  }
}

/**
 * Server-only Keycloak configuration. The client secret is never returned in
 * the browser session; only identity data and assigned client/realm roles are.
 */
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
    async jwt({ token, profile, account }) {
      if (profile) {
        // Auth.js may expose a reduced profile even though the OIDC ID token
        // contains Keycloak's standard role claims. The ID token has already
        // been validated during the authorization-code exchange.
        const keycloakAccount = account as KeycloakTokenAccount | null;
        token.roles = [...new Set([
          ...rolesFromProfile(profile),
          ...rolesFromJwt(keycloakAccount?.id_token),
          ...rolesFromJwt(keycloakAccount?.access_token),
        ])];
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.roles = roleList(token.roles);
      }

      return session;
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth(authConfig);

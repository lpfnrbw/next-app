"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return <section><h1>Keycloak SSO</h1><p>Loading your session…</p></section>;
  }

  if (!user) {
    return (
      <section>
        <h1>Keycloak SSO</h1>
        <p>You are not signed in.</p>
        <button type="button" onClick={() => signIn("keycloak", { callbackUrl: "/" })}>Sign in</button>
      </section>
    );
  }

  return (
    <section>
      <h1>Keycloak SSO</h1>
      <p>You are signed in.</p>
      <UserDetails user={user} />
      <p><Link className="button" href="/protected">Open protected page</Link></p>
      <button type="button" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
    </section>
  );
}

function UserDetails({ user }: { user: { name?: string | null; email?: string | null } }) {
  return (
    <dl>
      <dt>Name</dt><dd>{user.name ?? "Not provided"}</dd>
      <dt>Email</dt><dd>{user.email ?? "Not provided"}</dd>
    </dl>
  );
}

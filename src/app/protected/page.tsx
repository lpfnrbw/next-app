"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return <section><h1>Protected Page</h1><p>Loading your session…</p></section>;
  }

  if (!user) {
    return <section><h1>Protected Page</h1><p>Your session is unavailable. Please sign in again.</p><Link href="/">Back to home</Link></section>;
  }

  return (
    <section>
      <h1>Protected Page</h1>
      <p>You have access to this page.</p>
      <dl>
        <dt>Name</dt><dd>{user.name ?? "Not provided"}</dd>
        <dt>Email</dt><dd>{user.email ?? "Not provided"}</dd>
      </dl>
      <p><Link href="/">Back to home</Link></p>
      <button type="button" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
    </section>
  );
}

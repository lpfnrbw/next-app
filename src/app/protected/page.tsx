"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return <div className="site-frame workspace"><p className="eyebrow">Secure workspace</p><h1>Loading your session</h1></div>;
  }

  if (!user) {
    return <div className="site-frame workspace"><p className="eyebrow">Secure workspace</p><h1>Session unavailable</h1><p>Your session is unavailable. Please sign in again.</p><Link className="button primary-action" href="/">Back to home</Link></div>;
  }

  return (
    <div className="site-frame workspace">
      <header className="topbar"><Link className="brand" href="/"><span className="brand-mark">N</span>Northstar Access</Link><button className="secondary-action" type="button" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button></header>
      <section className="workspace-header"><div><p className="eyebrow">Secure workspace</p><h1>You&apos;re connected.</h1><p>Your Keycloak session gives you access to this private area.</p></div><Link className="button secondary-action" href="/">Return home</Link></section>
      <div className="workspace-grid">
        <section className="workspace-panel"><h2>Session status</h2><p>This route is protected by the application authentication middleware.</p><div className="access-state"><span />Access granted</div></section>
        <section className="workspace-panel"><h2>Signed-in identity</h2><div className="meta-grid"><div className="meta-item"><span>Name</span><strong>{user.name ?? "Not provided"}</strong></div><div className="meta-item"><span>Email</span><strong>{user.email ?? "Not provided"}</strong></div></div></section>
      </div>
    </div>
  );
}

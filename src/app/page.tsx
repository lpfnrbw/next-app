"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <div className="site-frame">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">N</span>Northstar Access</Link>
        <span className="environment">Identity workspace</span>
      </header>
      <div className="home-grid">
        <section>
          <p className="eyebrow">Secure sign-in, simplified</p>
          <h1 className="headline">A calmer way to <span className="headline-accent">connect.</span></h1>
          <p className="lead">Sign in once through your organization&apos;s Keycloak account, then continue with a private, encrypted application session.</p>
          <div className="feature-list" aria-label="Authentication features">
            <div className="feature"><span className="feature-icon">✓</span>Trusted identity provider</div>
            <div className="feature"><span className="feature-icon">✓</span>Protected application session</div>
          </div>
        </section>
        <section className="access-card" aria-live="polite">
          {status === "loading" ? <LoadingCard /> : user ? <SignedInCard user={user} /> : <SignedOutCard />}
        </section>
      </div>
    </div>
  );
}

function LoadingCard() {
  return <><div className="card-top"><span className="card-label">Account access</span></div><h2>Checking your session</h2><p>One moment while we restore your secure connection.</p></>;
}

function SignedOutCard() {
  return (
    <>
      <div className="card-top"><span className="card-label">Account access</span><span className="live-indicator"><span className="live-dot" />Ready</span></div>
      <h2>Sign in to continue</h2>
      <p>Use your organization&apos;s Keycloak account to open your private workspace.</p>
      <button className="primary-action" type="button" onClick={() => signIn("keycloak", { callbackUrl: "/" })}>Continue with Keycloak <span aria-hidden="true">→</span></button>
    </>
  );
}

function SignedInCard({ user }: { user: { name?: string | null; email?: string | null } }) {
  const displayName = user.name ?? user.email ?? "Account";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2);

  return (
    <>
      <div className="card-top"><span className="card-label">Account access</span><span className="live-indicator"><span className="live-dot" />Connected</span></div>
      <h2>Welcome back</h2>
      <p>Your identity has been verified. You can now open the protected workspace.</p>
      <div className="identity-card">
        <div className="identity-heading"><span className="avatar">{initials}</span><div><strong>{displayName}</strong><span>Verified Keycloak account</span></div></div>
        <dl className="identity-list"><div><dt>Email</dt><dd>{user.email ?? "Not provided"}</dd></div></dl>
      </div>
      <div className="card-actions"><Link className="button primary-action" href="/protected">Open workspace <span aria-hidden="true">→</span></Link><button className="secondary-action" type="button" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button></div>
    </>
  );
}

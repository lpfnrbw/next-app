"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const roles = user?.roles ?? [];

  if (status === "loading") {
    return <section><h1>Keycloak SSO 验证</h1><p>正在读取本地会话…</p></section>;
  }

  if (!user) {
    return (
      <section>
        <h1>Keycloak SSO 验证</h1>
        <p>当前未登录。</p>
        <button type="button" onClick={() => signIn("keycloak", { callbackUrl: "/" })}>登录</button>
      </section>
    );
  }

  return (
    <section>
      <h1>Keycloak SSO 验证</h1>
      <p>当前已登录。</p>
      <UserDetails user={user} roles={roles} />
      <p><Link className="button" href="/protected">进入受保护页面</Link></p>
      <button type="button" onClick={() => signOut({ callbackUrl: "/" })}>登出</button>
    </section>
  );
}

function UserDetails({ user, roles }: { user: { name?: string | null; email?: string | null; id?: string }; roles: string[] }) {
  return (
    <dl>
      <dt>姓名</dt><dd>{user.name ?? "未提供"}</dd>
      <dt>邮箱</dt><dd>{user.email ?? "未提供"}</dd>
      <dt>Subject</dt><dd>{user.id ?? "未提供"}</dd>
      <dt>角色/权限</dt><dd>{roles.length ? roles.join("、") : "无"}</dd>
    </dl>
  );
}

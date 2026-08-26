"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const roles = user?.roles ?? [];
  const can = (permission: string) => roles.includes(permission);

  if (status === "loading") {
    return <section><h1>受保护页面</h1><p>正在读取本地会话…</p></section>;
  }

  // Middleware protects this route. This fallback keeps the UI safe while the
  // capability projection is still being refreshed in the browser.
  if (!user) {
    return <section><h1>受保护页面</h1><p>会话不可用，请重新登录。</p><Link href="/">返回首页</Link></section>;
  }

  return (
    <section>
      <h1>受保护页面</h1>
      <p>受保护页面访问成功</p>
      <dl>
        <dt>姓名</dt><dd>{user.name ?? "未提供"}</dd>
        <dt>邮箱</dt><dd>{user.email ?? "未提供"}</dd>
        <dt>Subject</dt><dd>{user.id ?? "未提供"}</dd>
        <dt>角色/权限</dt><dd>{roles.length ? roles.join("、") : "无"}</dd>
      </dl>
      <h2>权限验证</h2>
      <ul>
        <li>project:create：{can("project:create") ? "允许" : "拒绝"}</li>
        <li>project:read：{can("project:read") ? "允许" : "拒绝"}</li>
        <li>project:delete：{can("project:delete") ? "允许" : "拒绝"}</li>
      </ul>
      <p><Link href="/">返回首页</Link></p>
      <button type="button" onClick={() => signOut({ callbackUrl: "/" })}>登出</button>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

type ServerResult = {
  status: "loading" | "allowed" | "denied" | "error";
  httpStatus?: number;
};

export function PermissionCheck({ action, permission, title }: { action: string; permission: string; title: string }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const roles = user?.roles ?? [];
  const can = (requiredPermission: string) => roles.includes(requiredPermission);
  const [serverResult, setServerResult] = useState<ServerResult>({ status: "loading" });

  useEffect(() => {
    if (!user) {
      return;
    }

    fetch(`/api/permission-check/${action}`, { credentials: "same-origin" })
      .then((response) => {
        setServerResult({
          status: response.ok ? "allowed" : response.status === 403 ? "denied" : "error",
          httpStatus: response.status,
        });
      })
      .catch(() => setServerResult({ status: "error" }));
  }, [action, user]);

  if (status === "loading") {
    return <section><h1>{title}</h1><p>正在读取本地会话…</p></section>;
  }

  if (!user) {
    return <section><h1>{title}</h1><p>会话不可用，请重新登录。</p><Link href="/">返回首页</Link></section>;
  }

  const clientAllowed = can(permission);
  const serverMessage = {
    loading: "正在调用服务端权限校验…",
    allowed: "允许（HTTP 200）",
    denied: "拒绝（HTTP 403）",
    error: "校验异常",
  }[serverResult.status];

  return (
    <section>
      <h1>{title}</h1>
      <p>当前权限代码：<code>{permission}</code></p>
      <dl>
        <dt>当前用户</dt><dd>{user.name ?? user.id ?? "未提供"}</dd>
        <dt>前端会话角色检查</dt><dd>{clientAllowed ? "允许" : "拒绝"}</dd>
        <dt>服务端会话角色检查</dt><dd>{serverMessage}</dd>
      </dl>
      {clientAllowed ? <p>页面访问成功。</p> : <p role="alert">403：当前用户没有该权限。</p>}
      <p><Link href="/protected">返回受保护页</Link></p>
      <button type="button" onClick={() => signOut({ callbackUrl: "/" })}>登出</button>
    </section>
  );
}

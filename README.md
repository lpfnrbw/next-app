# Keycloak Next.js OIDC 验证

一个最小的 Next.js App Router + TypeScript 示例：使用 NextAuth 通过 Keycloak
完成登录、回调、本地加密会话和页面/API 的 Client Role 鉴权。

## 配置 Keycloak

在业务 Realm 中创建一个 OpenID Connect Client，并启用 **Client authentication** 和
**Standard Flow**。当前项目的回调地址固定为：

```text
Root URL: http://192.168.20.138:3000
Valid Redirect URIs: http://192.168.20.138:3000/api/auth/callback/keycloak
Valid Post Logout Redirect URIs: http://192.168.20.138:3000/
Web Origins: http://192.168.20.138:3000
```

在该 Client 下创建 `project:create`、`project:read`、`project:delete` 等 Client
Roles，并分配给测试用户。确保角色 mapper 同时添加到 ID Token 和 Access Token。

## 配置与启动

复制 `.env.example` 为 `.env.local`，将 Realm、Client ID、Client Secret 和随机
`AUTH_SECRET` 替换为实际值。所有变量仅供服务端使用，严禁使用
`NEXT_PUBLIC_` 前缀。

```bash
cp .env.example .env.local
npm install
npm run dev
```

`KEYCLOAK_ISSUER` 必须和如下 discovery 文档中的 `issuer` 完全一致：

```text
http://192.168.20.138:8080/realms/company-dev/.well-known/openid-configuration
```

## 手工验收

1. 访问 `http://192.168.20.138:3000/protected`，应被重定向到 Keycloak 登录页。
2. 登录后，应回到 `/api/auth/callback/keycloak`，再跳回受保护页。
3. 首页和受保护页应显示 Keycloak 用户身份及 Client Roles。
4. `/api/permission-check/read` 只允许拥有 `project:read` 角色的用户访问。
5. 点击登出后，本应用的 NextAuth 会话被清除。

`signOut()` 默认只清除本应用会话；如需同时结束 Keycloak 的全局 SSO 会话，需另行
接入 discovery 文档中的 `end_session_endpoint`。

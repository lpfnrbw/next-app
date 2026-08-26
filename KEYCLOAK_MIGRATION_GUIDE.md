# 从旧统一认证平台迁移到 Keycloak

## 1. 目标与边界

目标是在下线旧统一认证平台全部代码前，将存量 Next.js 应用直接迁移到 Keycloak。

迁移后的职责划分：

```text
Keycloak       管理用户、密码、登录页、单点登录和 Token 签发
Next 应用      处理本站会话、页面保护、服务端身份读取和业务权限判定
next-auth      实现 Next 应用与 Keycloak 之间的 OIDC 授权码登录流程
```

## 2. 总体架构

```text
浏览器
  │
  │ 访问业务应用、点击登录
  ▼
Next.js 应用 ── OIDC 授权码流程 ──► Keycloak
  │                                    │
  │                                    │ 校验用户密码、签发 Token
  │                                    ▼
  └───── 建立本站加密会话 Cookie ◄──── 浏览器回调
```

Keycloak 是身份提供方（Identity Provider），不是每个业务请求都要调用的
“权限网关”。用户完成登录后，Next 应用通过本站会话读取用户信息；后续业务
接口在服务端判断是否已登录，或检查 Token 中的角色。

## 3. 迁移原则

1. **每个下游应用使用独立 Client**。不要让 CRM、OA、报表等系统共用一个
   Client ID 或 Client Secret。
2. **使用标准 OIDC 授权码模式**。服务端 Next 应用使用 Confidential Client；
   纯浏览器 SPA 使用 Public Client + PKCE，浏览器中不得保存 Client Secret。
3. **业务身份以 Keycloak `sub` 为准**。用户名可能变更，邮箱可能不唯一或未验证。
4. **认证与授权分开迁移**。先完成登录和用户关联；权限由有需要的应用逐步启用。
5. **旧平台下线前完成全部应用迁移**。旧 Cookie、旧 Session 无法直接迁移，
   切换后用户需要重新登录一次。

## 4. Keycloak 准备工作

### 4.1 Realm

为企业应用创建业务 Realm，例如 `company-prod`。不要使用 `master` Realm 接入业务应用。

### 4.2 每个应用创建独立 Client

以 CRM 为例：

```text
Client ID: crm-web
Client authentication: On（Confidential Client）
Standard flow: On
Valid Redirect URI: https://crm.example.com/api/auth/callback/keycloak
Valid Post Logout Redirect URI: https://crm.example.com/
Web Origin: https://crm.example.com
```

为每个 Client 单独保管 Secret，Secret 只放在应用服务端环境变量中，不能提交到 Git，
也不能暴露给浏览器。

### 4.3 用户数据迁移

迁移前需要确认旧平台用户的来源和密码策略。

| 原数据 | Keycloak 对应项 | 建议 |
|---|---|---|
| 旧平台用户 ID | 自定义属性 `legacy_user_id` | 保留，用于历史关联 |
| 用户名 | `username` | 保证 Realm 内唯一 |
| 姓名 | `firstName` / `lastName` 或 `name` | 按现有数据规则迁移 |
| 邮箱 | `email` | 标记已验证的真实邮箱 |
| 密码哈希 | Keycloak Credential | 仅在哈希算法兼容且经过安全评审时导入 |

如果密码哈希不能安全导入，使用“首次登录重置密码”流程。不要导出明文密码。

业务系统已有自己的用户表时，应增加 `keycloak_sub` 字段。首次 Keycloak 登录时，
用已验证邮箱或企业员工号匹配旧用户，随后写入 `keycloak_sub`；之后一律以
`keycloak_sub` 关联业务数据。

## 5. Next.js 应用接入标准

本项目中的实现可作为基线：

```text
src/auth.ts                         Keycloak Provider、角色投影、auth()
src/app/api/auth/[...slug]/route.ts 登录、回调、登出、会话路由
src/app/layout.tsx                  SessionProvider
src/middleware.ts                   受保护路由的登录校验
```

### 5.1 安装依赖

```bash
npm install next-auth
```

当前示例使用 Auth.js / next-auth v5，以适配 Next.js App Router、Next.js 15 和 React 19。

### 5.2 应用环境变量

每个应用配置自己的 `.env.local` 或部署环境变量：

```dotenv
KEYCLOAK_ISSUER=https://sso.example.com/realms/company-prod
KEYCLOAK_CLIENT_ID=crm-web
KEYCLOAK_CLIENT_SECRET=<只在服务端保存>
AUTH_SECRET=<随机生成的高强度值>
AUTH_TRUST_HOST=true
AUTH_URL=https://crm.example.com
```

`KEYCLOAK_ISSUER` 必须包含 Realm 名称。`AUTH_URL` 必须与用户实际访问的应用地址一致，
否则 Keycloak 会拒绝回调地址并显示 `Invalid parameter: redirect_uri`。

### 5.3 业务代码替换关系

| 旧 SDK 功能 | next-auth / Keycloak 替换方式 |
|---|---|
| 发起登录 | `signIn("keycloak")` |
| 处理认证回调 | `/api/auth/callback/keycloak` |
| 前端读取用户 | `useSession()` |
| 服务端读取用户 | `auth()` |
| 登出 | `signOut()` |
| 路由登录保护 | `middleware.ts` + `auth()` |

应用内可以封装一层 `auth-service`，让业务页面只使用 `login()`、`logout()`、
`getCurrentUser()` 等公司级接口，避免以后业务代码直接绑定某个认证库。

### 5.4 服务端必须校验身份

页面上的按钮隐藏不能替代服务端校验。即使第一期不做角色权限，所有需要登录的 API
也应在服务端检查会话：

```ts
const session = await auth();

if (!session?.user) {
  return Response.json({ error: "Unauthenticated" }, { status: 401 });
}
```

需要权限时，再检查角色：

```ts
if (!session.user.roles.includes("project:create")) {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

## 6. 存量项目迁移步骤

对每一个旧 Next 项目执行以下步骤：

1. 盘点旧 SDK 的调用点：登录、登出、回调、当前用户、路由守卫、服务端接口。
2. 在 Keycloak 创建该应用专属 Client，并配置精确的 Redirect URI。
3. 加入 `next-auth`，配置 Keycloak Provider 和环境变量。
4. 新增 Auth.js 回调路由与 SessionProvider。
5. 替换旧 SDK 调用：登录改为 `signIn`，用户读取改为 `useSession` / `auth`，
   登出改为 `signOut`。
6. 删除旧 SDK 的回调路由、客户端初始化和旧平台环境变量。
7. 执行登录、回调、登出、刷新页面、未登录访问保护、已有用户关联测试。
8. 发布到测试环境并配置对应测试域名的 Keycloak Redirect URI。

如果应用仅需要登录，角色创建和角色映射可以留到后续业务权限改造时再做。

## 7. 切换与下线计划

### 阶段一：准备

- 完成 Keycloak Realm、用户和应用 Client 配置。
- 完成用户数据迁移或密码重置策略。
- 为每个应用建立迁移清单和测试账号。

### 阶段二：试点

- 选择一个低风险 Next 应用迁移。
- 验证登录、登出、会话读取、刷新、跨浏览器和异常回调。
- 验证旧业务用户与 `keycloak_sub` 的关联正确。

### 阶段三：批量迁移

- 复用试点的标准代码结构或公司内部接入模板。
- 分批发布，每批完成验证后再进入下一批。
- 每个应用独立保留发布回滚能力。

### 阶段四：旧平台下线

下线前必须确认：

- 所有生产应用已不再访问旧认证域名和旧 SDK 接口。
- 所有应用的 Redirect URI 已切换到 Keycloak 回调地址。
- 用户数据迁移、密码重置和账号申诉渠道已经就绪。
- 已通知用户：切换后需要重新登录。
- 旧平台日志、审计数据和用户映射数据已按合规要求归档。

## 8. 验收清单

- [ ] 未登录用户访问受保护页面会跳转 Keycloak。
- [ ] 正确登录后回到原业务页面。
- [ ] 页面刷新后会话仍可读取。
- [ ] 服务端 API 能返回 401（未登录）和 200（已登录）。
- [ ] 登出后不能继续访问受保护页面和接口。
- [ ] 回调 URI、Web Origin、Post Logout URI 均使用真实域名且足够精确。
- [ ] Client Secret、`AUTH_SECRET` 未出现在 Git、浏览器代码或日志中。
- [ ] 用户业务记录已正确关联 `keycloak_sub`。
- [ ] 切换公告和重登录提示已准备完成。

## 9. 常见问题

### `Invalid parameter: redirect_uri`

应用实际生成的回调地址未在 Keycloak Client 的 `Valid Redirect URIs` 白名单中。
检查 `AUTH_URL`、协议（HTTP/HTTPS）、端口和路径是否完全一致。

### 已登录但应用显示无角色

先在 Keycloak Client 的 `Client scopes → Evaluate` 中选择测试用户，确认生成的
ID Token 包含角色；然后退出应用并重新登录，使本站会话重新生成。

### 下线旧平台后能否保留旧登录状态

不能可靠保留。旧平台 Session 的签名密钥、Cookie 域和协议与 Keycloak 不同，
切换后应统一要求用户重新登录。


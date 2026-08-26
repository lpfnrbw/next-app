import { notFound } from "next/navigation";
import { PermissionCheck } from "./permission-check";

const pages = {
  create: { permission: "project:create", title: "创建项目权限测试" },
  read: { permission: "project:read", title: "查看项目权限测试" },
  delete: { permission: "project:delete", title: "删除项目权限测试" },
} as const;

export default async function PermissionPage({ params }: { params: Promise<{ action: string }> }) {
  const action = (await params).action as keyof typeof pages;
  const page = pages[action];

  if (!page) {
    notFound();
  }

  return <PermissionCheck action={action} permission={page.permission} title={page.title} />;
}

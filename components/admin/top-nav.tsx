"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/protected", label: "概览" },
  { href: "/protected/categories", label: "工具分类" },
  { href: "/protected/tools", label: "AI 工具管理" },
  { href: "/admin/submissions", label: "审核中心" },
  { href: "/protected/users", label: "用户管理" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/protected" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              isActive
                ? "border-white bg-white text-black"
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Users, LogOut, Home, BookOpen, Database, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth, signOut, onAuthStateChanged, User } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { ItemsProvider, useItems } from "@/contexts/ItemsContext";

const ADMIN_EMAILS = ["sabrimexfg@gmail.com", "admin@sabrimex.us"];

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Catalog",
    href: "/dashboard/catalog",
    icon: BookOpen,
  },
  {
    title: "Admin Dash",
    href: "/dashboard/admin",
    icon: Shield,
    className: "text-red-500",
    adminOnly: true,
  },
];

function FirebaseStats() {
  const { stats } = useItems();

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Database className="h-3 w-3" />
      <span className="tabular-nums">{stats.reads}r</span>
      <span className="text-muted-foreground/50">|</span>
      <span className="tabular-nums">{stats.writes}w</span>
      <span className="text-muted-foreground/50">|</span>
      <span className="tabular-nums text-green-600">{stats.fromCache}c</span>
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/images/posup1.png" alt="PosUp" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-bold">PosUp</span>
            </Link>
            <FirebaseStats />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems
              .filter((item) => {
                // Hide admin-only items from non-admin users
                if ("adminOnly" in item && item.adminOnly) {
                  return user?.email && ADMIN_EMAILS.includes(user.email);
                }
                return true;
              })
              .map((item) => {
                const isActive = pathname === item.href;
                const hasCustomClass = "className" in item;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      hasCustomClass && item.className,
                      !hasCustomClass && (isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
          </nav>

          {/* Bottom section */}
          <div className="border-t p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Home className="h-4 w-4" />
              Back to Website
            </Link>

            {user && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-accent/50 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || ""} />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pl-64">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  return (
    <ItemsProvider>
      <DashboardContent>{children}</DashboardContent>
    </ItemsProvider>
  );
}

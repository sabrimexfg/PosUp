"use client";

import { useEffect, useState } from "react";
import { auth, db, provider, signInWithPopup, signOut, onAuthStateChanged, User, doc, getDoc, collection, getDocs } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogOut, LayoutDashboard, Store, Package, Users } from "lucide-react";
import Link from "next/link";

interface BusinessData {
  name: string;
  phone: string;
}

interface DashboardStats {
  businessName: string;
  itemCount: number;
  customerCount: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    businessName: "Loading...",
    itemCount: 0,
    customerCount: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchDashboardData(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async (uid: string) => {
    try {
      // 1. Fetch Business Info (from users/{uid}.business field)
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      let businessName = "No Business Setup";

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.business && userData.business.name) {
          businessName = userData.business.name;
        }
      }

      // 2. Fetch Item Count (users/{uid}/items)
      const itemsColRef = collection(db, `users/${uid}/items`);
      const itemsSnapshot = await getDocs(itemsColRef);
      const itemCount = itemsSnapshot.size;

      // 3. Fetch Customer Count (users/{uid}/customers)
      const customersColRef = collection(db, `users/${uid}/customers`);
      const customersSnapshot = await getDocs(customersColRef);
      const customerCount = customersSnapshot.size;

      setStats({
        businessName,
        itemCount,
        customerCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats(prev => ({ ...prev, businessName: "Error loading data" }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your PosUp dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleLogin}>
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mx-auto max-w-6xl">
          <div className="flex items-center gap-2 font-bold text-xl">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span>PosUp Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden sm:inline-block">
                {user.displayName}
              </span>
              <Avatar>
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="p-6 mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Business Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Business
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.businessName}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Connected
              </p>
            </CardContent>
          </Card>

          {/* Items */}
          <Link href="/inventory" className="block transition-transform hover:scale-105">
            <Card className="cursor-pointer hover:bg-accent/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.itemCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Items in inventory
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Customers */}
          <Link href="/customers" className="block transition-transform hover:scale-105">
            <Card className="cursor-pointer hover:bg-accent/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customerCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered profiles
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}

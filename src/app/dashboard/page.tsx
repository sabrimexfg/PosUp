"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { auth, db, onAuthStateChanged, User, doc, collection, onSnapshot } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Store, Package, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BusinessData {
  name: string;
  phone: string;
}

interface DashboardStats {
  businessName: string;
  itemCount: number;
  customerCount: number;
  source: "Loading..." | "Server ☁️" | "Cache ⚡️" | "Live 🟢" | "Mixed";
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    businessName: "Loading...",
    itemCount: 0,
    customerCount: 0,
    source: "Loading...",
  });

  useEffect(() => {
    let unsubscribeBusiness: () => void = () => { };
    let unsubscribeItems: () => void = () => { };
    let unsubscribeCustomers: () => void = () => { };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set loading to false once auth state is known

      if (currentUser) {
        // 1. Subscribe to Business Info
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeBusiness = onSnapshot(userDocRef, (docSnap) => {
          const source = docSnap.metadata.fromCache ? "Cache ⚡️" : "Live 🟢";
          let businessName = "No Business Setup";
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.business && userData.business.name) {
              businessName = userData.business.name;
            }
          }
          setStats(prev => ({ ...prev, businessName, source }));
        });

        // 2. Subscribe to Item Count
        const itemsColRef = collection(db, `users/${currentUser.uid}/items`);
        unsubscribeItems = onSnapshot(itemsColRef, (snapshot) => {
          const source = snapshot.metadata.fromCache ? "Cache ⚡️" : "Live 🟢";
          setStats(prev => ({
            ...prev,
            itemCount: snapshot.size,
            source
          }));
        });

        // 3. Subscribe to Customer Count
        const customersColRef = collection(db, `users/${currentUser.uid}/customers`);
        unsubscribeCustomers = onSnapshot(customersColRef, (snapshot) => {
          const source = snapshot.metadata.fromCache ? "Cache ⚡️" : "Live 🟢";
          setStats(prev => ({
            ...prev,
            customerCount: snapshot.size,
            source
          }));
        });

      } else {
        // If no user, reset stats or handle accordingly
        setStats({
          businessName: "Loading...",
          itemCount: 0,
          customerCount: 0,
          source: "Loading...",
        });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBusiness();
      unsubscribeItems();
      unsubscribeCustomers();
    };
  }, []);

  const { push } = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      push('/dashboard/login');
    }
  }, [user, loading, push]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2 text-sm bg-white px-3 py-1 rounded-full border shadow-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-semibold ${stats.source.includes("Cache") ? "text-orange-500" : "text-green-600"}`}>
              {stats.source}
            </span>
          </div>
        </div>

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
          <Link href="/dashboard/inventory" className="block transition-transform hover:scale-105">
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
          <Link href="/dashboard/customers" className="block transition-transform hover:scale-105">
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
      </div>
    </div>
  );
}

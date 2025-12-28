"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, getCountFromServer } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAILS = ["sabrimexfg@gmail.com", "admin@sabrimex.us"];

export default function AdminDashPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [usersLoading, setUsersLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // Redirect non-admin users
            if (!currentUser || !currentUser.email || !ADMIN_EMAILS.includes(currentUser.email)) {
                router.push("/dashboard");
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Fetch total users count only (not the full list)
    useEffect(() => {
        if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return;

        const fetchUserCount = async () => {
            try {
                const usersRef = collection(db, "users");
                const countSnapshot = await getCountFromServer(usersRef);
                setTotalUsers(countSnapshot.data().count);
            } catch (error) {
                console.error("Error fetching user count:", error);
            } finally {
                setUsersLoading(false);
            }
        };

        fetchUserCount();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6">
                <div className="max-w-6xl space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-32 w-64" />
                </div>
            </div>
        );
    }

    // Don't render content for non-admin users (they'll be redirected)
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-6xl space-y-6">
                <h1 className="text-3xl font-bold tracking-tight text-red-500">Admin Dash</h1>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/dashboard/admin/users">
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {usersLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <div className="text-2xl font-bold">{totalUsers ?? 0}</div>
                                )}
                                <p className="text-xs text-muted-foreground">Click to view list</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, getDocs, getCountFromServer } from "@/lib/firebase";
import { useItems } from "@/contexts/ItemsContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAILS = ["sabrimexfg@gmail.com", "admin@sabrimex.us"];

interface AppUser {
    id: string;
    email?: string;
    business?: {
        name?: string;
        phone?: string;
        address?: string;
    };
    orderCount?: number;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { addReads } = useItems();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersList, setUsersList] = useState<AppUser[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

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

    // Fetch users list
    useEffect(() => {
        if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return;

        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, "users");
                const snapshot = await getDocs(usersRef);

                // Track reads (users list is never cached for admin)
                addReads(snapshot.size, false);

                const users: AppUser[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    orderCount: undefined // Will be loaded after
                } as AppUser));
                setUsersList(users);
                setUsersLoading(false);

                // Fetch order counts immediately after users load
                fetchOrderCounts(users);
            } catch (error) {
                console.error("Error fetching users:", error);
                setUsersLoading(false);
            }
        };

        fetchUsers();
    }, [user, addReads]);

    // Fetch order counts
    const fetchOrderCounts = async (users: AppUser[]) => {
        if (loadingOrders) return;

        setLoadingOrders(true);
        try {
            const updatedUsers = await Promise.all(
                users.map(async (appUser) => {
                    try {
                        // Orders are at: users/{userId}/orders/{orderId}
                        const ordersRef = collection(db, `users/${appUser.id}/orders`);
                        const countSnapshot = await getCountFromServer(ordersRef);
                        return { ...appUser, orderCount: countSnapshot.data().count };
                    } catch (error) {
                        console.error(`Error fetching orders for user ${appUser.id}:`, error);
                        return { ...appUser, orderCount: 0 };
                    }
                })
            );
            // Note: getCountFromServer uses aggregation queries, not document reads
            setUsersList(updatedUsers);
        } catch (error) {
            console.error("Error fetching order counts:", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6">
                <div className="max-w-4xl space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-64 w-full" />
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
            <div className="max-w-4xl space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        All Users ({usersList.length})
                        {loadingOrders && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </h1>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead className="text-right">Total Orders</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-5 w-32" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-5 w-8 ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : usersList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                usersList.map((appUser) => (
                                    <TableRow key={appUser.id}>
                                        <TableCell className="font-medium">
                                            {appUser.business?.name || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {appUser.orderCount === undefined ? (
                                                <Skeleton className="h-4 w-8 ml-auto" />
                                            ) : (
                                                appUser.orderCount
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}

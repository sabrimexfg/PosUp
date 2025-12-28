"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, getDocs, getCountFromServer } from "@/lib/firebase";
import { useItems } from "@/contexts/ItemsContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Package, Users as UsersIcon, ShoppingCart } from "lucide-react";
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
    customerCount?: number;
    itemCount?: number;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { addReads } = useItems();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersList, setUsersList] = useState<AppUser[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

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

    // Fetch users list and counts
    useEffect(() => {
        if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return;

        const fetchData = async () => {
            try {
                const usersRef = collection(db, "users");
                const snapshot = await getDocs(usersRef);

                // Track reads (users list is never cached for admin)
                addReads(snapshot.size, false);

                const users: AppUser[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    orderCount: undefined,
                    customerCount: undefined,
                    itemCount: undefined
                } as AppUser));
                setUsersList(users);
                setUsersLoading(false);

                // Fetch order and customer counts
                setLoadingOrders(true);
                const updatedUsers = await Promise.all(
                    users.map(async (appUser) => {
                        try {
                            // Orders are at: users/{userId}/orders/{orderId}
                            const ordersRef = collection(db, `users/${appUser.id}/orders`);
                            const orderCountSnapshot = await getCountFromServer(ordersRef);

                            // Customers are at: users/{userId}/customers/{customerId}
                            const customersRef = collection(db, `users/${appUser.id}/customers`);
                            const customerCountSnapshot = await getCountFromServer(customersRef);

                            // Items are at: users/{userId}/items/{itemId}
                            const itemsRef = collection(db, `users/${appUser.id}/items`);
                            const itemCountSnapshot = await getCountFromServer(itemsRef);

                            return {
                                ...appUser,
                                orderCount: orderCountSnapshot.data().count,
                                customerCount: customerCountSnapshot.data().count,
                                itemCount: itemCountSnapshot.data().count
                            };
                        } catch (error) {
                            console.error(`Error fetching counts for user ${appUser.id}:`, error);
                            return { ...appUser, orderCount: 0, customerCount: 0, itemCount: 0 };
                        }
                    })
                );
                setUsersList(updatedUsers);
                setLoadingOrders(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setUsersLoading(false);
                setLoadingOrders(false);
            }
        };

        fetchData();
    }, [user, addReads]);

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
                                <TableHead className="text-right">Items</TableHead>
                                <TableHead className="text-right">Customers</TableHead>
                                <TableHead className="text-right">Orders</TableHead>
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
                                        <TableCell className="text-right">
                                            <Skeleton className="h-5 w-8 ml-auto" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-5 w-8 ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : usersList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                usersList.map((appUser) => (
                                    <TableRow
                                        key={appUser.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => {
                                            setSelectedUser(appUser);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        <TableCell className="font-medium">
                                            {appUser.business?.name || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {appUser.itemCount === undefined ? (
                                                <Skeleton className="h-4 w-8 ml-auto" />
                                            ) : (
                                                appUser.itemCount
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {appUser.customerCount === undefined ? (
                                                <Skeleton className="h-4 w-8 ml-auto" />
                                            ) : (
                                                appUser.customerCount
                                            )}
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

                {/* User Details Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{selectedUser?.business?.name || "User Details"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-3 gap-4 py-4">
                            <Card
                                className="cursor-pointer hover:shadow-md transition-shadow p-4 flex flex-col items-center justify-center gap-2"
                                onClick={() => {
                                    setDialogOpen(false);
                                    router.push(`/dashboard/admin/users/${selectedUser?.id}/items`);
                                }}
                            >
                                <Package className="h-8 w-8 text-blue-500" />
                                <span className="text-2xl font-bold">{selectedUser?.itemCount ?? 0}</span>
                                <span className="text-sm text-muted-foreground">Items</span>
                            </Card>
                            <Card
                                className="cursor-pointer hover:shadow-md transition-shadow p-4 flex flex-col items-center justify-center gap-2"
                                onClick={() => {
                                    setDialogOpen(false);
                                    router.push(`/dashboard/admin/users/${selectedUser?.id}/customers`);
                                }}
                            >
                                <UsersIcon className="h-8 w-8 text-green-500" />
                                <span className="text-2xl font-bold">{selectedUser?.customerCount ?? 0}</span>
                                <span className="text-sm text-muted-foreground">Customers</span>
                            </Card>
                            <Card
                                className="cursor-pointer hover:shadow-md transition-shadow p-4 flex flex-col items-center justify-center gap-2"
                                onClick={() => {
                                    setDialogOpen(false);
                                    router.push(`/dashboard/admin/users/${selectedUser?.id}/orders`);
                                }}
                            >
                                <ShoppingCart className="h-8 w-8 text-orange-500" />
                                <span className="text-2xl font-bold">{selectedUser?.orderCount ?? 0}</span>
                                <span className="text-sm text-muted-foreground">Orders</span>
                            </Card>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

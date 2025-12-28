"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, getDocs, getDoc, doc, query, orderBy } from "@/lib/firebase";
import { useItems } from "@/contexts/ItemsContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAILS = ["sabrimexfg@gmail.com", "admin@sabrimex.us"];

interface Order {
    id: string;
    orderNumber?: string;
    total?: number;
    subtotal?: number;
    discount?: number;
    tax?: number;
    paymentMethod?: string;
    status?: string;
    timestamp?: number;  // milliseconds since epoch
    customerName?: string;
    notes?: string;
}

interface BusinessInfo {
    name?: string;
}

export default function UserOrdersPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;
    const { addReads } = useItems();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [businessName, setBusinessName] = useState<string>("");

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

    // Fetch business name and orders
    useEffect(() => {
        if (!user?.email || !ADMIN_EMAILS.includes(user.email) || !userId) return;

        const fetchData = async () => {
            try {
                // Fetch business name
                const userDoc = await getDoc(doc(db, "users", userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setBusinessName(userData.business?.name || "Unknown Business");
                    addReads(1, false);
                }

                // Fetch orders
                const ordersRef = collection(db, `users/${userId}/orders`);
                const q = query(ordersRef, orderBy("timestamp", "desc"));
                const snapshot = await getDocs(q);

                const ordersList: Order[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Order));

                setOrders(ordersList);
                addReads(snapshot.size, false);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchData();
    }, [user, userId, addReads]);

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return "-";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    };

    const formatPaymentMethod = (method: string | undefined) => {
        if (!method) return "-";
        // Capitalize first letter
        return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    };

    const formatDate = (timestampMs: number | undefined) => {
        if (!timestampMs) return "-";
        // timestamp is in milliseconds
        return new Date(timestampMs).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
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
                    <Link href="/dashboard/admin/users">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {businessName || <Skeleton className="h-8 w-48 inline-block" />}
                        </h1>
                        <p className="text-muted-foreground">
                            {orders.length} orders
                        </p>
                    </div>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Order #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ordersLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-5 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-24" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-5 w-16 ml-auto" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-16" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">
                                            {order.customerName || "-"}
                                        </TableCell>
                                        <TableCell className="font-mono text-muted-foreground">
                                            {order.orderNumber || order.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(order.timestamp)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(order.total)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                order.paymentMethod === "cash"
                                                    ? "bg-green-100 text-green-800"
                                                    : order.paymentMethod === "card"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : order.paymentMethod === "credit"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}>
                                                {formatPaymentMethod(order.paymentMethod)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                order.status === "completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : order.status === "pending"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : order.status === "cancelled"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}>
                                                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "-"}
                                            </span>
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

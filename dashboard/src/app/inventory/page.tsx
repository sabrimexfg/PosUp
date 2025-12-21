"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, getDocs, query, orderBy, limit, startAfter, DocumentSnapshot } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, ImageOff } from "lucide-react";
import Link from "next/link";

interface Item {
    id: string;
    name: string;
    category: string;
    price: number;
    currentStock: number;
    imageUrl?: string;
}

export default function InventoryPage() {
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/");
            } else {
                setUser(currentUser);
                fetchItems(currentUser.uid, true); // Initial load
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchItems = async (uid: string, isInitial: boolean = false) => {
        try {
            if (isInitial) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const itemsRef = collection(db, `users/${uid}/items`);

            let q = query(itemsRef, orderBy("name"), limit(ITEMS_PER_PAGE));

            if (!isInitial && lastDoc) {
                q = query(itemsRef, orderBy("name"), startAfter(lastDoc), limit(ITEMS_PER_PAGE));
            }

            const snapshot = await getDocs(q);
            const newItems: Item[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Item));

            if (isInitial) {
                setItems(newItems);
            } else {
                setItems(prev => [...prev, ...newItems]);
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (user && !loadingMore && hasMore) {
            fetchItems(user.uid);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col p-8 space-y-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <div className="border rounded-md p-4">
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Products ({items.length} {hasMore ? "+" : ""})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No items found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Avatar className="h-10 w-10 rounded-lg">
                                                    <AvatarImage src={item.imageUrl} alt={item.name} className="object-cover" />
                                                    <AvatarFallback className="rounded-lg">
                                                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>${item.price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <span className={item.currentStock <= 0 ? "text-red-500 font-medium" : ""}>
                                                    {item.currentStock}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {hasMore && (
                            <div className="mt-6 flex justify-center">
                                <Button onClick={handleLoadMore} disabled={loadingMore} variant="secondary">
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            </div>
                        )}

                        {!hasMore && items.length > 0 && (
                            <p className="text-center text-xs text-muted-foreground mt-6">All items loaded.</p>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, getDocs, query, orderBy, limit, startAfter, DocumentSnapshot } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ImageOff } from "lucide-react";

interface Item {
    id: string;
    name: string;
    category: string;
    price: number;
    currentStock: number;
    imageUrl?: string;
}

export default function CatalogPage() {
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
                router.push("/dashboard/login");
            } else {
                setUser(currentUser);
                fetchItems(currentUser.uid, true);
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
            <div className="min-h-screen bg-gray-50/50 p-6">
                <div className="max-w-6xl space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <CardContent className="p-4 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
                    <span className="text-sm text-muted-foreground">
                        {items.length} {hasMore ? "+" : ""} products
                    </span>
                </div>

                {items.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center text-muted-foreground">
                            <ImageOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No products found</p>
                            <p className="text-sm">Add items to your inventory to see them here.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square bg-gray-100 relative">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageOff className="h-12 w-12 text-muted-foreground/40" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4 space-y-1">
                                    <h3 className="font-semibold text-lg truncate" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <p className="text-xl font-bold text-primary">
                                        ${item.price.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.category}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {hasMore && items.length > 0 && (
                    <div className="flex justify-center pt-4">
                        <Button onClick={handleLoadMore} disabled={loadingMore} variant="secondary" size="lg">
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
                    <p className="text-center text-xs text-muted-foreground">All products loaded.</p>
                )}
            </div>
        </div>
    );
}

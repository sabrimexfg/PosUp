"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useItems, Item } from "@/contexts/ItemsContext";
import { db, collection, query, where, orderBy, onSnapshot } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

export default function CatalogPage() {
    const { user, userLoading, addReads } = useItems();
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            router.push("/dashboard/login");
            return;
        }

        // Query only items where inCustomerCatalog is true
        const itemsRef = collection(db, `users/${user.uid}/items`);
        const q = query(
            itemsRef,
            where("inCustomerCatalog", "==", true),
            orderBy("name")
        );

        let isFirstSnapshot = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const catalogItems: Item[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Item));

            setItems(catalogItems);

            // Only count reads on initial load, not on real-time updates
            if (isFirstSnapshot) {
                const fromCache = snapshot.metadata.fromCache;
                addReads(snapshot.docs.length, fromCache);
                isFirstSnapshot = false;
            }

            setLoading(false);
        }, (error) => {
            console.error("Error listening to catalog items:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userLoading, router, addReads]);

    if (userLoading || loading) {
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
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            {items.length} products
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live sync
                        </div>
                    </div>
                </div>

                {items.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center text-muted-foreground">
                            <ImageOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No products in catalog</p>
                            <p className="text-sm">Enable &quot;In Customer Catalog&quot; on items in Inventory to show them here.</p>
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
            </div>
        </div>
    );
}

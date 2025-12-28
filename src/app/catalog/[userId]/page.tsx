"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, collection, query, where, getDocs, doc, getDoc } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, Store, Apple } from "lucide-react";

interface Item {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
    inCustomerCatalog?: boolean;
    isDeleted?: boolean;
}

interface Business {
    name: string;
    phone?: string;
    address?: string;
}

export default function PublicCatalogPage() {
    const params = useParams();
    const userId = params.userId as string;

    const [items, setItems] = useState<Item[]>([]);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [catalogDisabled, setCatalogDisabled] = useState(false);

    useEffect(() => {
        // Detect iOS device
        const userAgent = navigator.userAgent || navigator.vendor;
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        if (!userId) {
            setError("Invalid catalog link");
            setLoading(false);
            return;
        }

        async function fetchCatalog() {
            try {
                // Fetch business info and check if public catalog is enabled
                const userDoc = await getDoc(doc(db, `users/${userId}`));
                if (userDoc.exists()) {
                    const userData = userDoc.data();

                    // Check if public catalog is enabled (defaults to false if not set)
                    if (userData.publicCatalogEnabled !== true) {
                        setCatalogDisabled(true);
                        setLoading(false);
                        return;
                    }

                    if (userData.business) {
                        setBusiness({
                            name: userData.business.name || "Store",
                            phone: userData.business.phone,
                            address: userData.business.address
                        });
                    }
                } else {
                    setError("Store not found");
                    setLoading(false);
                    return;
                }

                // Fetch catalog items (only filter by inCustomerCatalog to avoid needing composite index)
                const itemsRef = collection(db, `users/${userId}/items`);
                const q = query(
                    itemsRef,
                    where("inCustomerCatalog", "==", true)
                );

                const snapshot = await getDocs(q);
                const catalogItems: Item[] = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Item))
                    .filter(item => !item.isDeleted)
                    .sort((a, b) => a.name.localeCompare(b.name));

                setItems(catalogItems);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching catalog:", err);
                setError("Unable to load catalog");
                setLoading(false);
            }
        }

        fetchCatalog();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="aspect-square w-full" />
                                <CardContent className="p-3 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-5 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="p-8 text-center max-w-md">
                    <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-xl font-semibold mb-2">Catalog Not Available</h1>
                    <p className="text-muted-foreground">{error}</p>
                </Card>
            </div>
        );
    }

    if (catalogDisabled) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="p-8 text-center max-w-md">
                    <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-xl font-semibold mb-2">Catalog Not Available</h1>
                    <p className="text-muted-foreground">This store&apos;s public catalog is currently disabled.</p>
                </Card>
            </div>
        );
    }

    // iOS users see a coming soon message
    if (isIOS) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-6">
                <Card className="p-8 text-center max-w-md">
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                        <Store className="h-8 w-8 text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{business?.name || "Welcome!"}</h1>
                    <p className="text-muted-foreground mb-6">
                        Our iOS ordering experience is coming soon! In the meantime, browse our catalog on your desktop or Android device.
                    </p>
                    <div className="text-xs text-muted-foreground">
                        Powered by PosUp
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Store className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg">{business?.name || "Catalog"}</h1>
                            <p className="text-xs text-muted-foreground">{items.length} products</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="max-w-6xl mx-auto p-4">
                {items.length === 0 ? (
                    <Card className="p-12 mt-8">
                        <div className="text-center text-muted-foreground">
                            <ImageOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No products available</p>
                            <p className="text-sm">Check back later for updates.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {items.map((item) => (
                            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-square bg-gray-100 relative">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-3">
                                    <h3 className="font-medium text-sm truncate" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <p className="text-lg font-bold text-purple-600">
                                        ${item.price.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.category}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center py-8 text-xs text-muted-foreground">
                Powered by PosUp
            </div>
        </div>
    );
}

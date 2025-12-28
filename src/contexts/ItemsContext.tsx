"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth, db, onAuthStateChanged, User, updateDoc, doc } from "@/lib/firebase";

export interface Item {
    id: string;
    name: string;
    category: string;
    price: number;
    cost: number;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    unit: string;
    trackInventory: boolean;
    trackProfit: boolean;
    inCustomerCatalog?: boolean;
    imageUrl?: string;
    isDeleted?: boolean;
    updatedAt?: number;
}

export interface FirebaseStats {
    reads: number;
    writes: number;
    fromCache: number;
}

interface ItemsContextType {
    user: User | null;
    userLoading: boolean;
    updateItem: (itemId: string, data: Partial<Item>) => Promise<void>;
    stats: FirebaseStats;
    addReads: (count: number, fromCache: boolean) => void;
}

const ItemsContext = createContext<ItemsContextType | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [stats, setStats] = useState<FirebaseStats>({ reads: 0, writes: 0, fromCache: 0 });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setUserLoading(false);
        });

        return () => unsubscribeAuth();
    }, []);

    const updateItem = useCallback(async (itemId: string, data: Partial<Item>) => {
        if (!user) throw new Error("No user logged in");

        const itemRef = doc(db, `users/${user.uid}/items`, itemId);
        await updateDoc(itemRef, {
            ...data,
            updatedAt: Date.now(),
        });
        setStats(prev => ({ ...prev, writes: prev.writes + 1 }));
    }, [user]);

    const addReads = useCallback((count: number, fromCache: boolean) => {
        setStats(prev => ({
            ...prev,
            reads: prev.reads + (fromCache ? 0 : count),
            fromCache: prev.fromCache + (fromCache ? count : 0),
        }));
    }, []);

    return (
        <ItemsContext.Provider value={{ user, userLoading, updateItem, stats, addReads }}>
            {children}
        </ItemsContext.Provider>
    );
}

export function useItems() {
    const context = useContext(ItemsContext);
    if (!context) {
        throw new Error("useItems must be used within an ItemsProvider");
    }
    return context;
}

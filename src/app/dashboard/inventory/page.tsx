"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, getDocs, updateDoc, doc, query, orderBy, limit, startAfter, DocumentSnapshot } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ImageOff } from "lucide-react";

interface Item {
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
    imageUrl?: string;
    isDeleted?: boolean;
    updatedAt?: number;
}

export default function InventoryPage() {
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        category: "",
        price: "",
        cost: "",
        currentStock: "",
        minStockLevel: "",
        maxStockLevel: "",
        unit: "unit",
        trackInventory: false,
        trackProfit: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    const ITEMS_PER_PAGE = 20;

    // Extract unique categories from items
    const updateCategories = (itemsList: Item[]) => {
        const uniqueCategories = [...new Set(itemsList.map(item => item.category).filter(Boolean))].sort();
        setCategories(uniqueCategories);
    };

    const unitOptions = [
        { value: "unit", label: "Unit" },
        { value: "lb", label: "Pound (lb)" },
        { value: "oz", label: "Ounce (oz)" },
        { value: "kg", label: "Kilogram (kg)" },
        { value: "g", label: "Gram (g)" },
        { value: "each", label: "Each" },
        { value: "pack", label: "Pack" },
        { value: "box", label: "Box" },
        { value: "case", label: "Case" },
    ];

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
                updateCategories(newItems);
            } else {
                const allItems = [...items, ...newItems];
                setItems(prev => [...prev, ...newItems]);
                updateCategories(allItems);
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

    const handleRowClick = (item: Item) => {
        setEditingItem(item);
        setEditForm({
            name: item.name || "",
            category: item.category || "",
            price: (item.price || 0).toString(),
            cost: (item.cost || 0).toString(),
            currentStock: (item.currentStock || 0).toString(),
            minStockLevel: (item.minStockLevel || 0).toString(),
            maxStockLevel: (item.maxStockLevel || 0).toString(),
            unit: item.unit || "unit",
            trackInventory: item.trackInventory ?? false,
            trackProfit: item.trackProfit ?? false,
        });
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingItem || !user) return;

        setIsSaving(true);
        try {
            const itemRef = doc(db, `users/${user.uid}/items`, editingItem.id);
            const updatedData = {
                name: editForm.name,
                category: editForm.category,
                price: parseFloat(editForm.price) || 0,
                cost: parseFloat(editForm.cost) || 0,
                currentStock: parseInt(editForm.currentStock) || 0,
                minStockLevel: parseInt(editForm.minStockLevel) || 0,
                maxStockLevel: parseInt(editForm.maxStockLevel) || 0,
                unit: editForm.unit,
                trackInventory: editForm.trackInventory,
                trackProfit: editForm.trackProfit,
                updatedAt: Date.now(),
            };

            // Update in Firebase
            await updateDoc(itemRef, updatedData);

            // Update local state (cached data)
            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === editingItem.id
                        ? { ...item, ...updatedData }
                        : item
                )
            );

            setEditDialogOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error updating item:", error);
        } finally {
            setIsSaving(false);
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
            <div className="max-w-6xl space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>

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
                                        <TableRow
                                            key={item.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(item)}
                                        >
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
                                            <TableCell>${item.price?.toFixed(2) || "0.00"}</TableCell>
                                            <TableCell>
                                                <span className={item.currentStock <= 0 ? "text-red-500 font-medium" : ""}>
                                                    {item.currentStock || 0}
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

            {/* Edit Item Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Item</DialogTitle>
                        <DialogDescription>
                            Update the item details below. Click save when you&apos;re done.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Item Image Preview */}
                    {editingItem?.imageUrl && (
                        <div className="flex justify-center py-2">
                            <Avatar className="h-20 w-20 rounded-lg">
                                <AvatarImage src={editingItem.imageUrl} alt={editingItem.name} className="object-cover" />
                                <AvatarFallback className="rounded-lg">
                                    <ImageOff className="h-8 w-8 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}

                    <div className="space-y-6 py-4">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">
                                    Price ($)
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">
                                    Category
                                </Label>
                                <Select
                                    value={editForm.category}
                                    onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Inventory Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-t pt-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Inventory</h4>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="trackInventory" className="text-right">
                                    Track Inventory
                                </Label>
                                <div className="col-span-3">
                                    <Switch
                                        id="trackInventory"
                                        checked={editForm.trackInventory}
                                        onCheckedChange={(checked) => setEditForm({ ...editForm, trackInventory: checked })}
                                    />
                                </div>
                            </div>
                            {editForm.trackInventory && (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="currentStock" className="text-right">
                                            Current Stock
                                        </Label>
                                        <Input
                                            id="currentStock"
                                            type="number"
                                            value={editForm.currentStock}
                                            onChange={(e) => setEditForm({ ...editForm, currentStock: e.target.value })}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="minStockLevel" className="text-right">
                                            Min Stock Level
                                        </Label>
                                        <Input
                                            id="minStockLevel"
                                            type="number"
                                            value={editForm.minStockLevel}
                                            onChange={(e) => setEditForm({ ...editForm, minStockLevel: e.target.value })}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="maxStockLevel" className="text-right">
                                            Max Stock Level
                                        </Label>
                                        <Input
                                            id="maxStockLevel"
                                            type="number"
                                            value={editForm.maxStockLevel}
                                            onChange={(e) => setEditForm({ ...editForm, maxStockLevel: e.target.value })}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="unit" className="text-right">
                                            Unit
                                        </Label>
                                        <Select
                                            value={editForm.unit}
                                            onValueChange={(value) => setEditForm({ ...editForm, unit: value })}
                                        >
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {unitOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Profit Tracking Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-t pt-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Profit Tracking</h4>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="trackProfit" className="text-right">
                                    Track Profit
                                </Label>
                                <div className="col-span-3">
                                    <Switch
                                        id="trackProfit"
                                        checked={editForm.trackProfit}
                                        onCheckedChange={(checked) => setEditForm({ ...editForm, trackProfit: checked })}
                                    />
                                </div>
                            </div>
                            {editForm.trackProfit && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="cost" className="text-right">
                                        Cost per Unit ($)
                                    </Label>
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        value={editForm.cost}
                                        onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

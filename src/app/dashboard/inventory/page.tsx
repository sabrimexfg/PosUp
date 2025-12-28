"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useItems, Item } from "@/contexts/ItemsContext";
import { db, collection, query, orderBy, limit, where, onSnapshot } from "@/lib/firebase";
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
import { Loader2, ImageOff, Search, X } from "lucide-react";

const PAGE_SIZE = 50;

export default function InventoryPage() {
    const { user, userLoading, updateItem, addReads } = useItems();
    const router = useRouter();

    // Items state
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);

    // Search/filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Pagination state
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

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
        inCustomerCatalog: false,
    });
    const [isSaving, setIsSaving] = useState(false);

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

    // Track current page for pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Main data fetching effect
    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            router.push("/");
            return;
        }

        setLoading(true);
        const itemsRef = collection(db, `users/${user.uid}/items`);
        const constraints: Parameters<typeof query>[1][] = [];

        // Category filter
        if (selectedCategory && selectedCategory !== "all") {
            constraints.push(where("category", "==", selectedCategory));
        }

        // Search filter (prefix search on name)
        if (searchTerm.trim()) {
            const term = searchTerm.trim();
            constraints.push(where("name", ">=", term));
            constraints.push(where("name", "<=", term + "\uf8ff"));
        } else {
            constraints.push(orderBy("name"));
        }

        // Apply limit based on current page
        constraints.push(limit(PAGE_SIZE * currentPage));

        const q = query(itemsRef, ...constraints);

        let isFirstSnapshot = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allItems: Item[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Item));

            setItems(allItems);

            // Extract unique categories from results
            const uniqueCategories = [...new Set(allItems.map(item => item.category).filter(Boolean))].sort();
            setCategories(uniqueCategories);

            // Track pagination - has more if we got exactly what we asked for
            setHasMore(snapshot.docs.length >= PAGE_SIZE * currentPage);

            // Only count reads on initial load, not on real-time updates
            if (isFirstSnapshot) {
                const fromCache = snapshot.metadata.fromCache;
                addReads(snapshot.docs.length, fromCache);
                isFirstSnapshot = false;
            }

            setLoading(false);
        }, (error) => {
            console.error("Error listening to items:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userLoading, router, selectedCategory, searchTerm, addReads, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchTerm]);

    const handleLoadMore = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        setCurrentPage(prev => prev + 1);
        // loadingMore will be set to false when the effect completes
        setTimeout(() => setLoadingMore(false), 500);
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
            inCustomerCatalog: item.inCustomerCatalog ?? false,
        });
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingItem || !user) return;

        setIsSaving(true);
        try {
            await updateItem(editingItem.id, {
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
                inCustomerCatalog: editForm.inCustomerCatalog,
            });

            setEditDialogOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error updating item:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
        setSelectedCategory("all");
    };

    if (userLoading || loading) {
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
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-6xl space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(searchTerm || selectedCategory !== "all") && (
                        <Button variant="ghost" onClick={clearSearch} className="sm:w-auto">
                            Clear filters
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Products ({items.length}{hasMore ? "+" : ""})</CardTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live sync
                            </div>
                        </div>
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
                                            {searchTerm || selectedCategory !== "all"
                                                ? "No items match your search."
                                                : "No items found."}
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

                        {/* Load More Button */}
                        {hasMore && items.length > 0 && (
                            <div className="mt-4 flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
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

                    <div className="space-y-4 py-2">
                        {/* Basic Information */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-xs">Name</Label>
                                <Input
                                    id="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="h-9"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="price" className="text-xs">Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={editForm.price}
                                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="category" className="text-xs">Category</Label>
                                    <Select
                                        value={editForm.category}
                                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select" />
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
                        </div>

                        {/* Inventory Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="text-xs font-medium text-muted-foreground">Inventory</span>
                                <Switch
                                    id="trackInventory"
                                    checked={editForm.trackInventory}
                                    onCheckedChange={(checked) => setEditForm({ ...editForm, trackInventory: checked })}
                                />
                            </div>
                            {editForm.trackInventory && (
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="currentStock" className="text-xs">Stock</Label>
                                        <Input
                                            id="currentStock"
                                            type="number"
                                            value={editForm.currentStock}
                                            onChange={(e) => setEditForm({ ...editForm, currentStock: e.target.value })}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="minStockLevel" className="text-xs">Min</Label>
                                        <Input
                                            id="minStockLevel"
                                            type="number"
                                            value={editForm.minStockLevel}
                                            onChange={(e) => setEditForm({ ...editForm, minStockLevel: e.target.value })}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="maxStockLevel" className="text-xs">Max</Label>
                                        <Input
                                            id="maxStockLevel"
                                            type="number"
                                            value={editForm.maxStockLevel}
                                            onChange={(e) => setEditForm({ ...editForm, maxStockLevel: e.target.value })}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="unit" className="text-xs">Unit</Label>
                                        <Select
                                            value={editForm.unit}
                                            onValueChange={(value) => setEditForm({ ...editForm, unit: value })}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Unit" />
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
                                </div>
                            )}
                        </div>

                        {/* Profit Tracking Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="text-xs font-medium text-muted-foreground">Profit Tracking</span>
                                <Switch
                                    id="trackProfit"
                                    checked={editForm.trackProfit}
                                    onCheckedChange={(checked) => setEditForm({ ...editForm, trackProfit: checked })}
                                />
                            </div>
                            {editForm.trackProfit && (
                                <div className="space-y-1">
                                    <Label htmlFor="cost" className="text-xs">Cost per Unit ($)</Label>
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        value={editForm.cost}
                                        onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                                        className="h-9 w-32"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Customer Catalog Section */}
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-xs font-medium text-muted-foreground">In Customer Catalog</span>
                            <Switch
                                id="inCustomerCatalog"
                                checked={editForm.inCustomerCatalog}
                                onCheckedChange={(checked) => setEditForm({ ...editForm, inCustomerCatalog: checked })}
                            />
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

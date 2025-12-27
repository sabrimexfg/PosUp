"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged, User, collection, updateDoc, doc, query, orderBy, onSnapshot } from "@/lib/firebase";
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
    inCustomerCatalog?: boolean;
    imageUrl?: string;
    isDeleted?: boolean;
    updatedAt?: number;
}

export default function InventoryPage() {
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
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
        inCustomerCatalog: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

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
        let unsubscribeItems: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/");
            } else {
                setUser(currentUser);

                // Set up real-time listener for items
                const itemsRef = collection(db, `users/${currentUser.uid}/items`);
                const q = query(itemsRef, orderBy("name"));

                unsubscribeItems = onSnapshot(q, (snapshot) => {
                    const allItems: Item[] = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Item));

                    setItems(allItems);
                    updateCategories(allItems);
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to items:", error);
                    setLoading(false);
                });
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeItems) {
                unsubscribeItems();
            }
        };
    }, [router]);

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
                inCustomerCatalog: editForm.inCustomerCatalog,
                updatedAt: Date.now(),
            };

            // Update in Firebase - real-time listener will update local state automatically
            await updateDoc(itemRef, updatedData);

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
                        <div className="flex items-center justify-between">
                            <CardTitle>Products ({items.length})</CardTitle>
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

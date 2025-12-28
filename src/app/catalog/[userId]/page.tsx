"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth, provider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, collection, query, where, getDocs, doc, getDoc, setDoc } from "@/lib/firebase";
import { User } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImageOff, Store, ShoppingCart, Loader2, User as UserIcon, LogOut, Package, Settings } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface CartItem {
    item: Item;
    quantity: number;
}

interface OnlineCustomerAddress {
    recipientName: string;
    streetAddress: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export default function PublicCatalogPage() {
    const params = useParams();
    const userId = params.userId as string;

    const [items, setItems] = useState<Item[]>([]);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [catalogDisabled, setCatalogDisabled] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Auth and customer registration state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [addressFormOpen, setAddressFormOpen] = useState(false);
    const [signingIn, setSigningIn] = useState(false);
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [addressForm, setAddressForm] = useState<OnlineCustomerAddress>({
        recipientName: "",
        streetAddress: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
    });
    const [existingCustomer, setExistingCustomer] = useState(false);
    const [isReturningUser, setIsReturningUser] = useState(false);
    const [pendingRedirect, setPendingRedirect] = useState(false);
    const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    // Handle redirect result on page load (for incognito/mobile where popup doesn't work)
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user && userId) {
                    // User just signed in via redirect
                    const customerDoc = await getDoc(doc(db, `users/${userId}/online_customers/${result.user.uid}`));
                    if (customerDoc.exists()) {
                        setExistingCustomer(true);
                    } else {
                        // Pre-fill name from Google account and show address form
                        setAddressForm(prev => ({
                            ...prev,
                            recipientName: result.user.displayName || ""
                        }));
                        setAddressFormOpen(true);
                    }
                }
            } catch (err) {
                console.error("Error handling redirect result:", err);
            }
        };

        handleRedirectResult();
    }, [userId]);

    useEffect(() => {
        // Detect iOS and Android devices
        const userAgent = navigator.userAgent || navigator.vendor;
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isAndroidDevice = /android/i.test(userAgent);
        setIsIOS(isIOSDevice);
        setIsAndroid(isAndroidDevice);

        // Check if returning user (has completed registration before)
        const returningKey = `posup_customer_${userId}`;
        if (localStorage.getItem(returningKey)) {
            setIsReturningUser(true);
        }

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

    // Listen to auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user && userId) {
                // Check if this user is already an online customer for this store
                try {
                    const customerDoc = await getDoc(doc(db, `users/${userId}/online_customers/${user.uid}`));
                    if (customerDoc.exists()) {
                        setExistingCustomer(true);
                    }
                } catch (err) {
                    console.error("Error checking customer:", err);
                }
            }
        });
        return () => unsubscribe();
    }, [userId]);

    const handleCartClick = () => {
        if (!currentUser) {
            setAuthDialogOpen(true);
        } else if (!existingCustomer) {
            setAddressFormOpen(true);
        } else {
            // TODO: Show cart contents
            console.log("Show cart");
        }
    };

    const handleGoogleSignIn = async () => {
        setSigningIn(true);
        try {
            // Try popup first
            const result = await signInWithPopup(auth, provider);
            setAuthDialogOpen(false);
            // Check if customer exists
            const customerDoc = await getDoc(doc(db, `users/${userId}/online_customers/${result.user.uid}`));
            if (customerDoc.exists()) {
                setExistingCustomer(true);
            } else {
                // Pre-fill name from Google account
                setAddressForm(prev => ({
                    ...prev,
                    recipientName: result.user.displayName || ""
                }));
                setAddressFormOpen(true);
            }
        } catch (err: any) {
            console.error("Popup sign-in failed, trying redirect:", err);
            // If popup fails (COOP issues, incognito, popup blocked), use redirect
            if (err.code === 'auth/popup-closed-by-user' ||
                err.code === 'auth/popup-blocked' ||
                err.message?.includes('Cross-Origin-Opener-Policy')) {
                try {
                    setAuthDialogOpen(false);
                    setPendingRedirect(true);
                    await signInWithRedirect(auth, provider);
                } catch (redirectErr) {
                    console.error("Redirect sign-in also failed:", redirectErr);
                    setPendingRedirect(false);
                }
            }
        } finally {
            setSigningIn(false);
        }
    };

    const handleSaveCustomer = async () => {
        if (!currentUser) return;

        // Validate required fields
        if (!addressForm.recipientName.trim() || !addressForm.streetAddress.trim() ||
            !addressForm.city.trim() || !addressForm.state.trim() ||
            !addressForm.postalCode.trim() || !addressForm.country.trim()) {
            return;
        }

        setSavingCustomer(true);
        try {
            const customerData = {
                id: currentUser.uid,
                email: currentUser.email,
                name: addressForm.recipientName.trim(),
                address: {
                    streetAddress: addressForm.streetAddress.trim(),
                    addressLine2: addressForm.addressLine2.trim(),
                    city: addressForm.city.trim(),
                    state: addressForm.state.trim(),
                    postalCode: addressForm.postalCode.trim(),
                    country: addressForm.country.trim()
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await setDoc(doc(db, `users/${userId}/online_customers/${currentUser.uid}`), customerData);
            setExistingCustomer(true);
            setAddressFormOpen(false);
            // Mark as returning user for future visits
            localStorage.setItem(`posup_customer_${userId}`, "true");
            setIsReturningUser(true);
        } catch (err) {
            console.error("Error saving customer:", err);
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setExistingCustomer(false);
            setCurrentUser(null);
        } catch (err) {
            console.error("Error signing out:", err);
        }
    };

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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Store className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-lg">{business?.name || "Catalog"}</h1>
                                <p className="text-xs text-muted-foreground">{items.length} products</p>
                            </div>
                        </div>
                        {/* Show cart and user menu on Android and desktop (not iOS) */}
                        {!isIOS && (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="relative" onClick={handleCartClick}>
                                    <ShoppingCart className="h-5 w-5" />
                                    {cart.length > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                        </span>
                                    )}
                                </Button>

                                {/* User Menu */}
                                {currentUser ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="rounded-full">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
                                                    <AvatarFallback>
                                                        {currentUser.displayName?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <div className="px-2 py-1.5 text-sm font-medium truncate">
                                                {currentUser.displayName || currentUser.email}
                                            </div>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setOrdersDialogOpen(true)}>
                                                <Package className="mr-2 h-4 w-4" />
                                                View Orders
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Account Settings
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Button variant="outline" size="icon" onClick={() => setAuthDialogOpen(true)}>
                                        <UserIcon className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        )}
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

            {/* Auth Dialog */}
            <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isReturningUser ? "Welcome Back!" : "Create an Account"}</DialogTitle>
                        <DialogDescription>
                            {isReturningUser
                                ? "Sign in to continue with your order"
                                : "You must create an account to place an order"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Button
                            onClick={handleGoogleSignIn}
                            disabled={signingIn}
                            className="w-full flex items-center justify-center gap-2"
                            variant="outline"
                        >
                            {signingIn ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            )}
                            {signingIn ? "Signing in..." : isReturningUser ? "Sign in with Google" : "Continue with Google"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Address Form Dialog */}
            <Dialog open={addressFormOpen} onOpenChange={setAddressFormOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Shipping Address</DialogTitle>
                        <DialogDescription>
                            Enter your shipping information to complete your account
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipientName">Recipient Name *</Label>
                            <Input
                                id="recipientName"
                                value={addressForm.recipientName}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, recipientName: e.target.value }))}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="streetAddress">Street Address *</Label>
                            <Input
                                id="streetAddress"
                                value={addressForm.streetAddress}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, streetAddress: e.target.value }))}
                                placeholder="123 Main St"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="addressLine2">Apt / Suite / Unit (optional)</Label>
                            <Input
                                id="addressLine2"
                                value={addressForm.addressLine2}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                                placeholder="Apt 4B"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    value={addressForm.city}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="New York"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State / Province *</Label>
                                <Input
                                    id="state"
                                    value={addressForm.state}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                    placeholder="NY"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal / Zip Code *</Label>
                                <Input
                                    id="postalCode"
                                    value={addressForm.postalCode}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                                    placeholder="10001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country *</Label>
                                <Input
                                    id="country"
                                    value={addressForm.country}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                                    placeholder="United States"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveCustomer}
                            disabled={savingCustomer || !addressForm.recipientName.trim() || !addressForm.streetAddress.trim() ||
                                !addressForm.city.trim() || !addressForm.state.trim() ||
                                !addressForm.postalCode.trim() || !addressForm.country.trim()}
                            className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                        >
                            {savingCustomer ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                "Complete"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Orders Dialog */}
            <Dialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your Orders</DialogTitle>
                        <DialogDescription>
                            View your order history
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="text-center text-muted-foreground py-8">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No orders yet</p>
                            <p className="text-sm">Your order history will appear here</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Account Settings Dialog */}
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Account Settings</DialogTitle>
                        <DialogDescription>
                            Manage your account information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {currentUser && (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={currentUser.photoURL || undefined} />
                                        <AvatarFallback>
                                            {currentUser.displayName?.charAt(0).toUpperCase() || <UserIcon className="h-6 w-6" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{currentUser.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setSettingsDialogOpen(false);
                                        setAddressFormOpen(true);
                                    }}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Update Shipping Address
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

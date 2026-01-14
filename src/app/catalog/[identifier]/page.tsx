"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { db, auth, provider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, orderBy, onSnapshot, updateDoc, requestNotificationPermission, onForegroundMessage, functions, httpsCallable } from "@/lib/firebase";
import { User } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ImageOff, Store, ShoppingCart, Loader2, User as UserIcon, LogOut, Package, Settings, Plus, Minus, Trash2, CheckCircle, Clock, PartyPopper, ClipboardCheck, ArrowRight, RefreshCw, XCircle, MapPin } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StripeCheckoutDialog } from "@/components/StripeCheckout";
import { StripePaymentAuthDialog } from "@/components/StripePaymentAuth";

interface Item {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
    inCustomerCatalog?: boolean;
    isDeleted?: boolean;
}

interface BusinessAddress {
    streetAddress: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

interface Business {
    name: string;
    phone?: string;
    address?: BusinessAddress | string; // Support both structured and legacy string format
    logoUrl?: string;
}

interface CartItem {
    item: Item;
    quantity: number;
}

interface OnlineCustomerAddress {
    recipientName: string;
    phone: string;
    streetAddress: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

interface SubstituteItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    imageUrl?: string;
}

interface OnlineOrderItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    imageUrl?: string | null;
    category: string;
    allowSubstitution?: boolean;
    substitutedWith?: SubstituteItem[];
    adjustedTotal?: number;
}

interface OnlineOrder {
    id: string;
    orderNumber: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    shippingAddress?: OnlineCustomerAddress | null;
    items: OnlineOrderItem[];
    subtotal: number;
    total: number;
    originalTotal?: number;
    status: string;
    paymentMethod: string;
    source: string;
    timestamp: number;
    createdAt: number;
}

function CatalogPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const identifier = params.identifier as string; // Can be userId or slug

    // Resolved userId (from identifier lookup)
    const [userId, setUserId] = useState<string | null>(null);
    const [resolving, setResolving] = useState(true);

    const [items, setItems] = useState<Item[]>([]);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [catalogDisabled, setCatalogDisabled] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Resolve identifier to userId (supports both slugs and direct userIds)
    useEffect(() => {
        const resolveIdentifier = async () => {
            if (!identifier) {
                setError("Invalid catalog URL");
                setResolving(false);
                return;
            }

            try {
                // First, try looking up as a slug (publicly readable)
                const slugDoc = await getDoc(doc(db, `business_slugs/${identifier}`));
                if (slugDoc.exists()) {
                    const resolvedUserId = slugDoc.data()?.userId;
                    if (resolvedUserId) {
                        setUserId(resolvedUserId);
                        setResolving(false);
                        return;
                    }
                }

                // Not a slug, check if it's a direct userId
                // This requires the user doc to exist and be accessible
                // We check public_profile instead since users collection isn't publicly readable
                const publicProfileDoc = await getDoc(doc(db, `users/${identifier}/public_profile/info`));
                if (publicProfileDoc.exists()) {
                    // It's a valid userId with a public profile
                    setUserId(identifier);
                    setResolving(false);
                    return;
                }

                // Neither a valid slug nor a userId with public profile
                setError("Business not found");
                setResolving(false);
            } catch (err) {
                console.error("Error resolving identifier:", err);
                setError("Failed to load business");
                setResolving(false);
            }
        };

        resolveIdentifier();
    }, [identifier]);

    // Auth and customer registration state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [addressFormOpen, setAddressFormOpen] = useState(false);
    const [signingIn, setSigningIn] = useState(false);
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [addressForm, setAddressForm] = useState<OnlineCustomerAddress>({
        recipientName: "",
        phone: "",
        streetAddress: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
    });
    const [existingCustomer, setExistingCustomer] = useState(false);
    const [isReturningUser, setIsReturningUser] = useState(false);
    const [distanceToStore, setDistanceToStore] = useState<number | null>(null);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [pendingRedirect, setPendingRedirect] = useState(false);
    const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [cartDialogOpen, setCartDialogOpen] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccessDialogOpen, setOrderSuccessDialogOpen] = useState(false);
    const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);
    const [pendingOrders, setPendingOrders] = useState<OnlineOrder[]>([]);
    const [pendingOrdersDialogOpen, setPendingOrdersDialogOpen] = useState(false);
    const [waitingApprovalOrders, setWaitingApprovalOrders] = useState<OnlineOrder[]>([]);
    const [waitingApprovalDialogOpen, setWaitingApprovalDialogOpen] = useState(false);
    const [orderCompletedDialogOpen, setOrderCompletedDialogOpen] = useState(false);
    const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);
    const [approvedOrders, setApprovedOrders] = useState<OnlineOrder[]>([]);
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OnlineOrder | null>(null);
    const [itemSubstitutions, setItemSubstitutions] = useState<Record<string, boolean>>({});

    // Pre-authorization payment state (pay upfront, capture later)
    const [paymentAuthDialogOpen, setPaymentAuthDialogOpen] = useState(false);
    const [pendingOrderForPayment, setPendingOrderForPayment] = useState<{
        orderId: string;
        orderNumber: string;
        total: number;
    } | null>(null);

    // Order cancellation state
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<OnlineOrder | null>(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    // Handle payment success from Stripe redirect
    useEffect(() => {
        const paymentStatus = searchParams.get("payment_status");
        const orderId = searchParams.get("order_id");

        if (paymentStatus === "success" && orderId && currentUser) {
            // Update order status to approved after successful payment
            const updateOrderStatus = async () => {
                try {
                    console.log("Processing payment success for order:", orderId);
                    const orderRef = doc(db, `users/${userId}/online_orders`, orderId);
                    await updateDoc(orderRef, {
                        status: "approved",
                        paidAt: Date.now()
                    });
                    console.log("Order status updated to approved");

                    // Clear the URL params without refreshing the page
                    window.history.replaceState({}, "", `/catalog/${identifier}`);
                } catch (err: any) {
                    console.error("Error updating order after payment:", err);
                }
            };
            updateOrderStatus();
        }
    }, [searchParams, currentUser, userId]);

    // Track if we've handled the approve action to prevent duplicate opens
    const approveActionHandled = useRef(false);
    // Store the pending action if user isn't logged in yet
    const pendingApproveAction = useRef(false);

    // Handle notification click action to open approval dialog
    useEffect(() => {
        const action = searchParams.get("action");

        if (action === "approve") {
            console.log("[Catalog] Approve action detected, currentUser:", !!currentUser, "orders:", waitingApprovalOrders.length);

            if (!currentUser) {
                // User not logged in yet, store the action for later
                pendingApproveAction.current = true;
                console.log("[Catalog] User not logged in, storing approve action for later");
                return;
            }

            if (!approveActionHandled.current) {
                // If we have orders waiting for approval, open the dialog
                if (waitingApprovalOrders.length > 0) {
                    console.log("[Catalog] Opening approval dialog from notification");
                    approveActionHandled.current = true;
                    pendingApproveAction.current = false;
                    setWaitingApprovalDialogOpen(true);
                    // Clear the URL params without refreshing the page
                    window.history.replaceState({}, "", `/catalog/${identifier}`);
                } else {
                    // Orders might still be loading, keep waiting
                    console.log("[Catalog] Waiting for approval orders to load...");
                }
            }
        }
    }, [searchParams, currentUser, waitingApprovalOrders, identifier]);

    // Handle pending approve action after user logs in
    useEffect(() => {
        if (currentUser && pendingApproveAction.current && waitingApprovalOrders.length > 0 && !approveActionHandled.current) {
            console.log("[Catalog] Handling pending approve action after login");
            approveActionHandled.current = true;
            pendingApproveAction.current = false;
            setWaitingApprovalDialogOpen(true);
        }
    }, [currentUser, waitingApprovalOrders]);

    // Request notification permission and register FCM token when user logs in
    useEffect(() => {
        if (!currentUser || !userId) return;

        const registerFCMToken = async () => {
            try {
                // Request permission and get FCM token
                const token = await requestNotificationPermission();

                if (token) {
                    // Create a hash of the token to use as document ID (tokens are too long for doc IDs)
                    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
                    const tokenId = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

                    // Save FCM token with tokenId as document ID (supports multiple devices per customer)
                    const tokenRef = doc(db, `users/${userId}/customer_fcm_tokens`, tokenId);
                    await setDoc(tokenRef, {
                        token,
                        customerId: currentUser.uid,
                        customerEmail: currentUser.email,
                        updatedAt: Date.now(),
                        platform: 'web'
                    }, { merge: true });
                    console.log("📱 FCM token registered for push notifications (tokenId:", tokenId + ")");
                } else {
                    console.log("📵 No FCM token obtained - permission may have been denied or FCM not supported");
                }
            } catch (err) {
                console.error("Error registering FCM token:", err);
            }
        };

        // Always try to register FCM token when user logs in
        // (will request permission if not granted, or just get token if already granted)
        registerFCMToken();
    }, [currentUser, userId]);

    // Listen for foreground push notifications
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onForegroundMessage((payload) => {
            console.log("[Catalog] Foreground message received:", payload);

            // Get title/body from data (data-only messages) or notification
            const title = payload.data?.title || payload.notification?.title || "Order Update";
            const body = payload.data?.body || payload.notification?.body || "You have a new notification";
            const orderNumber = payload.data?.orderNumber || "notification";
            const notificationType = payload.data?.type;

            // Show browser notification
            sendBrowserNotification(title, body, orderNumber);

            // If this is an awaiting approval notification, open the dialog
            if (notificationType === "order_awaiting_approval") {
                console.log("[Catalog] Opening approval dialog from foreground notification");
                // Small delay to allow the order data to sync from Firestore
                setTimeout(() => {
                    setWaitingApprovalDialogOpen(true);
                }, 1000);
            }
        });

        return unsubscribe;
    }, [currentUser]);

    // Helper function to send browser notification
    const sendBrowserNotification = (title: string, body: string, orderNumber: string) => {
        try {
            if (typeof window === "undefined" || !("Notification" in window)) return;

            if (Notification.permission === "granted") {
                const notification = new Notification(title, {
                    body: body,
                    icon: "/favicon.ico",
                    tag: `order-${orderNumber}`, // Prevents duplicate notifications
                    requireInteraction: true, // Keep notification until user interacts
                });

                // Focus the window when notification is clicked
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            }
        } catch (err) {
            // Some browsers (especially mobile) may throw when creating notifications
            console.error("Failed to send browser notification:", err);
        }
    };

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
                        // Load customer address for distance calculation
                        const data = customerDoc.data();
                        if (data.address) {
                            setAddressForm(prev => ({
                                ...prev,
                                recipientName: data.name || "",
                                phone: data.phone || "",
                                streetAddress: data.address?.streetAddress || "",
                                addressLine2: data.address?.addressLine2 || "",
                                city: data.address?.city || "",
                                state: data.address?.state || "",
                                postalCode: data.address?.postalCode || "",
                                country: data.address?.country || ""
                            }));
                        }
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

        // Wait for identifier resolution to complete before checking userId
        if (resolving) {
            return;
        }

        if (!userId) {
            // Only set error if resolving is done and userId is still null
            // (the resolveIdentifier effect will have already set an appropriate error)
            if (!error) {
                setError("Invalid catalog link");
            }
            setLoading(false);
            return;
        }

        async function fetchCatalog() {
            // Step 1: Fetch public profile info
            let profileData;
            try {
                console.log(`[Catalog] Step 1: Fetching public_profile/info for userId: ${userId}`);
                const publicProfileDoc = await getDoc(doc(db, `users/${userId}/public_profile/info`));

                if (!publicProfileDoc.exists()) {
                    console.log("[Catalog] public_profile/info document does not exist");
                    setError("Store not found - no public profile");
                    setLoading(false);
                    return;
                }

                profileData = publicProfileDoc.data();
                console.log("[Catalog] Step 1 SUCCESS: Got public profile", profileData);

                // Check if public catalog is enabled (defaults to false if not set)
                if (profileData.publicCatalogEnabled !== true) {
                    console.log("[Catalog] Catalog is disabled (publicCatalogEnabled !== true)");
                    setCatalogDisabled(true);
                    setLoading(false);
                    return;
                }

                console.log("[Catalog] Business address from Firestore:", profileData.businessAddress, "Type:", typeof profileData.businessAddress);
                setBusiness({
                    name: profileData.businessName || "Store",
                    phone: profileData.businessPhone,
                    address: profileData.businessAddress,
                    logoUrl: profileData.businessLogoUrl
                });
            } catch (err: any) {
                console.error("[Catalog] Step 1 FAILED: Error fetching public_profile/info:", err);
                console.error("[Catalog] Error code:", err.code);
                console.error("[Catalog] Error message:", err.message);
                setError(`Permission denied reading public profile (${err.code || 'unknown'})`);
                setLoading(false);
                return;
            }

            // Step 2: Fetch catalog items
            try {
                console.log(`[Catalog] Step 2: Fetching items for userId: ${userId}`);
                const itemsRef = collection(db, `users/${userId}/items`);
                const q = query(
                    itemsRef,
                    where("inCustomerCatalog", "==", true)
                );

                const snapshot = await getDocs(q);
                console.log(`[Catalog] Step 2 SUCCESS: Got ${snapshot.docs.length} items`);

                const catalogItems: Item[] = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Item))
                    .filter(item => !item.isDeleted)
                    .sort((a, b) => a.name.localeCompare(b.name));

                setItems(catalogItems);
                setLoading(false);
            } catch (err: any) {
                console.error("[Catalog] Step 2 FAILED: Error fetching items:", err);
                console.error("[Catalog] Error code:", err.code);
                console.error("[Catalog] Error message:", err.message);
                setError(`Permission denied reading items (${err.code || 'unknown'})`);
                setLoading(false);
            }
        }

        fetchCatalog();
    }, [userId, resolving, error]);

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
                        // Load customer address for distance calculation
                        const data = customerDoc.data();
                        if (data.address) {
                            setAddressForm(prev => ({
                                ...prev,
                                recipientName: data.name || "",
                                phone: data.phone || "",
                                streetAddress: data.address?.streetAddress || "",
                                addressLine2: data.address?.addressLine2 || "",
                                city: data.address?.city || "",
                                state: data.address?.state || "",
                                postalCode: data.address?.postalCode || "",
                                country: data.address?.country || ""
                            }));
                        }
                    } else {
                        // New user - pre-fill name and show address form immediately
                        setAddressForm(prev => ({
                            ...prev,
                            recipientName: user.displayName || ""
                        }));
                        setAddressFormOpen(true);
                    }
                } catch (err) {
                    console.error("Error checking customer:", err);
                }
            }
        });
        return () => unsubscribe();
    }, [userId]);

    // Single consolidated listener for active customer orders (reduces Firestore reads from 3 to 1)
    // Uses "in" filter to only fetch relevant statuses, excluding completed/cancelled orders
    useEffect(() => {
        if (!currentUser || !userId) {
            setPendingOrders([]);
            setWaitingApprovalOrders([]);
            setApprovedOrders([]);
            return;
        }

        const ordersRef = collection(db, `users/${userId}/online_orders`);
        const q = query(
            ordersRef,
            where("customerId", "==", currentUser.uid),
            where("status", "in", ["pending", "awaiting_approval", "approved"]),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allOrders: OnlineOrder[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as OnlineOrder));

            // Filter orders by status client-side
            const pending = allOrders.filter(o => o.status === "pending");
            const awaiting = allOrders.filter(o => o.status === "awaiting_approval");
            const approved = allOrders.filter(o => o.status === "approved");

            // Check for completed orders (orders that were pending but now have status "completed")
            setPendingOrders(prevOrders => {
                const currentPendingIds = new Set(pending.map(o => o.id));

                prevOrders.forEach(prevOrder => {
                    if (!currentPendingIds.has(prevOrder.id)) {
                        // Check if this order is now completed (in the full list with completed status)
                        const completedOrder = allOrders.find(o => o.id === prevOrder.id && o.status === "completed");
                        if (completedOrder) {
                            setCompletedOrderNumber(prevOrder.orderNumber);
                            setOrderCompletedDialogOpen(true);

                            sendBrowserNotification(
                                "🎉 Order Ready!",
                                `Your order ${prevOrder.orderNumber} has been completed and is ready!`,
                                prevOrder.orderNumber
                            );
                        }
                    }
                });

                return pending;
            });

            // Check for new awaiting approval orders
            setWaitingApprovalOrders(prevOrders => {
                const prevIds = new Set(prevOrders.map(o => o.id));

                awaiting.forEach(order => {
                    if (!prevIds.has(order.id) && prevOrders.length > 0) {
                        sendBrowserNotification(
                            "Order Ready for Approval!",
                            `Your order ${order.orderNumber} has been picked and is waiting for your approval.`,
                            order.orderNumber
                        );
                    }
                });

                return awaiting;
            });

            setApprovedOrders(approved);
        }, (error) => {
            console.error("Error listening to customer orders:", error);
        });

        return () => unsubscribe();
    }, [currentUser, userId]);

    const handleCartClick = () => {
        if (!currentUser) {
            setAuthDialogOpen(true);
        } else if (!existingCustomer) {
            setAddressFormOpen(true);
        } else {
            setCartDialogOpen(true);
        }
    };

    const addToCart = (item: Item) => {
        setCart(prev => {
            const existing = prev.find(ci => ci.item.id === item.id);
            if (existing) {
                return prev.map(ci =>
                    ci.item.id === item.id
                        ? { ...ci, quantity: ci.quantity + 1 }
                        : ci
                );
            }
            return [...prev, { item, quantity: 1 }];
        });
    };

    const updateCartQuantity = (itemId: string, delta: number) => {
        setCart(prev => {
            return prev
                .map(ci => {
                    if (ci.item.id === itemId) {
                        const newQty = ci.quantity + delta;
                        return newQty > 0 ? { ...ci, quantity: newQty } : null;
                    }
                    return ci;
                })
                .filter((ci): ci is CartItem => ci !== null);
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(ci => ci.item.id !== itemId));
    };

    const getCartTotal = () => {
        return cart.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
    };

    const getItemQuantityInCart = (itemId: string) => {
        const cartItem = cart.find(ci => ci.item.id === itemId);
        return cartItem?.quantity || 0;
    };

    const generateOrderNumber = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ONL-${timestamp}-${random}`;
    };

    const handlePlaceOrder = async () => {
        if (!currentUser || !userId || cart.length === 0) return;

        setPlacingOrder(true);
        try {
            // Fetch customer data for the order
            const customerDoc = await getDoc(doc(db, `users/${userId}/online_customers/${currentUser.uid}`));
            const customerData = customerDoc.exists() ? customerDoc.data() : null;

            const orderNumber = generateOrderNumber();
            const orderTotal = getCartTotal();
            const orderItems = cart.map(ci => ({
                itemId: ci.item.id,
                name: ci.item.name,
                price: ci.item.price,
                quantity: ci.quantity,
                total: ci.item.price * ci.quantity,
                imageUrl: ci.item.imageUrl || null,
                category: ci.item.category,
                allowSubstitution: itemSubstitutions[ci.item.id] || false
            }));

            const orderData = {
                orderNumber,
                customerId: currentUser.uid,
                customerEmail: currentUser.email,
                customerName: customerData?.name || currentUser.displayName || "Unknown",
                shippingAddress: customerData?.address || null,
                items: orderItems,
                subtotal: orderTotal,
                total: orderTotal,
                status: "pending_payment", // New status: waiting for payment authorization
                paymentMethod: "online",
                paymentStatus: "pending", // Track payment separately
                source: "web_catalog",
                timestamp: Date.now(),
                createdAt: Date.now()
            };

            // Save to online_orders subcollection
            const orderRef = await addDoc(collection(db, `users/${userId}/online_orders`), orderData);

            // Close cart dialog and open payment authorization dialog
            setCartDialogOpen(false);
            setPendingOrderForPayment({
                orderId: orderRef.id,
                orderNumber,
                total: orderTotal
            });
            setPaymentAuthDialogOpen(true);
        } catch (err) {
            console.error("Error placing order:", err);
        } finally {
            setPlacingOrder(false);
        }
    };

    // Handle successful payment authorization (card authorized, not yet captured)
    const handlePaymentAuthSuccess = async (paymentIntentId: string, authorizedAmount: number) => {
        if (!pendingOrderForPayment || !userId) return;

        try {
            // Update order with payment intent ID and change status to pending (ready for merchant)
            const orderRef = doc(db, `users/${userId}/online_orders`, pendingOrderForPayment.orderId);
            await updateDoc(orderRef, {
                status: "pending", // Now ready for merchant to pick
                paymentStatus: "authorized",
                paymentIntentId,
                authorizedAmount,
            });

            // Show success and clear state
            setLastOrderNumber(pendingOrderForPayment.orderNumber);
            setCart([]);
            setPendingOrderForPayment(null);
            setPaymentAuthDialogOpen(false);
            setOrderSuccessDialogOpen(true);
        } catch (err) {
            console.error("Error updating order after payment auth:", err);
        }
    };

    // Handle payment auth dialog close (cleanup if cancelled)
    const handlePaymentAuthDialogClose = async (open: boolean) => {
        setPaymentAuthDialogOpen(open);
        if (!open && pendingOrderForPayment && userId) {
            // User closed dialog without completing payment - cancel the order
            try {
                const orderRef = doc(db, `users/${userId}/online_orders`, pendingOrderForPayment.orderId);
                await updateDoc(orderRef, {
                    status: "cancelled",
                    paymentStatus: "cancelled",
                    cancelledAt: Date.now(),
                    cancelReason: "Payment not completed"
                });
            } catch (err) {
                console.error("Error cancelling order:", err);
            }
            setPendingOrderForPayment(null);
        }
    };

    const handlePaymentAuthError = (error: string) => {
        console.error("Payment authorization error:", error);
    };

    const handleApproveOrder = (order: OnlineOrder) => {
        setSelectedOrderForPayment(order);
        setWaitingApprovalDialogOpen(false); // Close the waiting approval dialog
        setCheckoutDialogOpen(true);
    };

    // Opens the cancel confirmation dialog
    const handleCancelOrderClick = (order: OnlineOrder) => {
        setOrderToCancel(order);
        setCancelDialogOpen(true);
    };

    // Actually cancels the order after confirmation
    const handleConfirmCancelOrder = async () => {
        if (!userId || !orderToCancel) return;

        setCancelDialogOpen(false);
        setCancellingOrderId(orderToCancel.id);

        try {
            const cancelOrder = httpsCallable(functions, 'customerCancelOrder');
            await cancelOrder({
                orderId: orderToCancel.id,
                merchantUserId: userId
            });

            // Order will be removed from pendingOrders automatically via the onSnapshot listener
            toast.success("Order cancelled", {
                description: "Any payment hold has been released back to your card."
            });
        } catch (err: any) {
            console.error("Error cancelling order:", err);
            toast.error("Failed to cancel order", {
                description: err.message || "Please try again."
            });
        } finally {
            setCancellingOrderId(null);
            setOrderToCancel(null);
        }
    };

    const handlePaymentSuccess = async () => {
        if (!selectedOrderForPayment) {
            console.error("No selected order for payment");
            return;
        }

        console.log("Payment success, updating order:", selectedOrderForPayment.id);

        try {
            const orderRef = doc(db, `users/${userId}/online_orders`, selectedOrderForPayment.id);
            await updateDoc(orderRef, {
                status: "approved",
                paidAt: Date.now()
            });
            console.log("Order status updated successfully to approved");
        } catch (err: any) {
            console.error("Error updating order status:", err);
            console.error("Error code:", err.code);
            console.error("Error message:", err.message);
            alert(`Failed to update order status: ${err.message}`);
        }
        // Don't close the dialog here - let the user see the success screen and click "Done"
    };

    // Called when the checkout dialog is closed (either by user clicking Done or closing)
    const handleCheckoutDialogClose = (open: boolean) => {
        setCheckoutDialogOpen(open);
        if (!open) {
            // Clean up when dialog closes
            setTimeout(() => {
                setSelectedOrderForPayment(null);
            }, 300);
        }
    };

    const handlePaymentError = (error: string) => {
        console.error("Payment error:", error);
    };

    // Calculate distance between customer and business using Firebase Cloud Function
    const calculateDistance = async (customerAddr: OnlineCustomerAddress, businessAddr: BusinessAddress) => {
        setCalculatingDistance(true);
        try {
            const calculateDistanceFn = httpsCallable(functions, "calculateDistance");
            const result = await calculateDistanceFn({
                customerAddress: {
                    streetAddress: customerAddr.streetAddress,
                    city: customerAddr.city,
                    state: customerAddr.state,
                    postalCode: customerAddr.postalCode,
                    country: customerAddr.country,
                },
                businessAddress: {
                    streetAddress: businessAddr.streetAddress,
                    city: businessAddr.city,
                    state: businessAddr.state,
                    postalCode: businessAddr.postalCode,
                    country: businessAddr.country,
                },
            });

            const data = result.data as { success: boolean; distance?: number; error?: string };
            if (data.success && data.distance !== undefined) {
                setDistanceToStore(data.distance);
            } else {
                console.error("Distance calculation failed:", data.error);
            }
        } catch (err) {
            console.error("Distance calculation error:", err);
        } finally {
            setCalculatingDistance(false);
        }
    };

    // Calculate distance when customer address and business address are available
    useEffect(() => {
        console.log("[Distance] Checking conditions:", {
            existingCustomer,
            customerStreet: addressForm.streetAddress,
            businessAddress: business?.address,
            businessAddressType: typeof business?.address
        });

        if (existingCustomer && addressForm.streetAddress && business?.address) {
            // Handle both structured address and legacy string format
            if (typeof business.address === "string") {
                // Legacy string format - skip distance calculation
                console.log("[Distance] Business address is legacy string format, skipping");
            } else {
                console.log("[Distance] Calculating distance...");
                calculateDistance(addressForm, business.address);
            }
        }
    }, [existingCustomer, addressForm.streetAddress, business?.address]);

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
                // Load customer address for distance calculation
                const data = customerDoc.data();
                if (data.address) {
                    setAddressForm(prev => ({
                        ...prev,
                        recipientName: data.name || "",
                        phone: data.phone || "",
                        streetAddress: data.address?.streetAddress || "",
                        addressLine2: data.address?.addressLine2 || "",
                        city: data.address?.city || "",
                        state: data.address?.state || "",
                        postalCode: data.address?.postalCode || "",
                        country: data.address?.country || ""
                    }));
                }
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
        if (!addressForm.recipientName.trim() || !addressForm.phone.trim() ||
            !addressForm.streetAddress.trim() ||
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
                phone: addressForm.phone.trim(),
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

    const handleUpdateShippingAddress = async () => {
        if (!currentUser || !userId) return;

        try {
            // Fetch existing customer data to pre-fill the form
            const customerDoc = await getDoc(doc(db, `users/${userId}/online_customers/${currentUser.uid}`));
            if (customerDoc.exists()) {
                const data = customerDoc.data();
                setAddressForm({
                    recipientName: data.name || "",
                    phone: data.phone || "",
                    streetAddress: data.address?.streetAddress || "",
                    addressLine2: data.address?.addressLine2 || "",
                    city: data.address?.city || "",
                    state: data.address?.state || "",
                    postalCode: data.address?.postalCode || "",
                    country: data.address?.country || ""
                });
            }
        } catch (err) {
            console.error("Error fetching customer data:", err);
        }

        setSettingsDialogOpen(false);
        setAddressFormOpen(true);
    };

    // Show loading while resolving slug/userId or loading catalog data
    if (resolving || loading) {
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

    // TODO: Re-enable iOS coming soon message after testing
    // if (isIOS) {
    //     return (
    //         <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-6">
    //             <Card className="p-8 text-center max-w-md">
    //                 <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
    //                     <Store className="h-8 w-8 text-purple-600" />
    //                 </div>
    //                 <h1 className="text-2xl font-bold mb-2">{business?.name || "Welcome!"}</h1>
    //                 <p className="text-muted-foreground mb-6">
    //                     Our iOS ordering experience is coming soon! In the meantime, browse our catalog on your desktop or Android device.
    //                 </p>
    //                 <div className="text-xs text-muted-foreground">
    //                     Powered by PosUp
    //                 </div>
    //             </Card>
    //         </div>
    //     );
    // }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {business?.logoUrl ? (
                                <img
                                    src={business.logoUrl}
                                    alt={business.name || "Business logo"}
                                    className="h-14 w-14 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                                    <Store className="h-7 w-7 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <h1 className="font-semibold text-lg">{business?.name || "Catalog"}</h1>
                                <p className="text-xs text-muted-foreground">{items.length} products</p>
                            </div>
                        </div>
                        {/* Show cart and user menu on Android and desktop (not iOS) */}
                        {/* TODO: Re-enable iOS check after testing: {!isIOS && ( */}
                        {(
                            <div className="flex items-center gap-2">
                                {/* Distance indicator - shown when customer is logged in with address */}
                                {distanceToStore !== null && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        <MapPin className="h-3 w-3" />
                                        <span>{distanceToStore} mi</span>
                                    </div>
                                )}
                                {calculatingDistance && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    </div>
                                )}
                                <Button variant="outline" size="icon" className="relative" onClick={handleCartClick}>
                                    <ShoppingCart className="h-6 w-6" />
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
                                            {pendingOrders.length > 0 && (
                                                <DropdownMenuItem onClick={() => setPendingOrdersDialogOpen(true)} className="text-orange-600">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Pending Orders ({pendingOrders.length})
                                                </DropdownMenuItem>
                                            )}
                                            {waitingApprovalOrders.length > 0 && (
                                                <DropdownMenuItem onClick={() => setWaitingApprovalDialogOpen(true)} className="text-blue-600">
                                                    <ClipboardCheck className="mr-2 h-4 w-4" />
                                                    Waiting Approval ({waitingApprovalOrders.length})
                                                </DropdownMenuItem>
                                            )}
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
                                        <UserIcon className="h-6 w-6" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="max-w-6xl mx-auto p-4">
                {/* Welcome/Info Section */}
                {items.length > 0 && (
                    <div className="border rounded-xl p-6 mb-4 bg-card">
                        <h2 className="text-xl font-bold mb-2">
                            {currentUser ? `Welcome back!` : `Welcome to ${business?.name || 'our store'}!`}
                        </h2>
                        <p className="text-muted-foreground text-sm mb-3">
                            Browse our catalog and place your order online. We'll prepare your items and notify you when they're ready for pickup or delivery.
                        </p>
                        {!currentUser && (
                            <p className="text-muted-foreground text-xs">
                                Sign in to start shopping and track your orders.
                            </p>
                        )}
                        {currentUser && !existingCustomer && (
                            <p className="text-muted-foreground text-xs">
                                Complete your profile to start placing orders.
                            </p>
                        )}
                    </div>
                )}

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
                        {items.map((item) => {
                            const qtyInCart = getItemQuantityInCart(item.id);
                            return (
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
                                        {qtyInCart > 0 && (
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                                {qtyInCart}
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
                                        <p className="text-xs text-muted-foreground truncate mb-2">
                                            {item.category}
                                        </p>
                                        {currentUser && existingCustomer && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => addToCart(item)}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add to Cart
                                                </Button>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                                    <Label htmlFor={`sub-${item.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                                        Replace if unavailable
                                                    </Label>
                                                    <Switch
                                                        id={`sub-${item.id}`}
                                                        checked={itemSubstitutions[item.id] || false}
                                                        onCheckedChange={(checked) => setItemSubstitutions(prev => ({ ...prev, [item.id]: checked }))}
                                                        className="scale-75"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center py-8 text-xs text-muted-foreground">
                <p>Powered by PosUp</p>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Privacy Policy
                </a>
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
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={addressForm.phone}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="(555) 123-4567"
                            />
                            <p className="text-xs text-muted-foreground">
                                We&apos;ll text you order status updates. Msg & data rates may apply. Reply STOP to opt out.
                            </p>
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
                            disabled={savingCustomer || !addressForm.recipientName.trim() || !addressForm.phone.trim() ||
                                !addressForm.streetAddress.trim() ||
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
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Your Orders</DialogTitle>
                        <DialogDescription>
                            {approvedOrders.length === 0
                                ? "View your order history"
                                : `${approvedOrders.length} approved order${approvedOrders.length !== 1 ? 's' : ''}`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {approvedOrders.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No orders yet</p>
                                <p className="text-sm">Your order history will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {approvedOrders.map((order) => (
                                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                Approved
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageOff className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ${item.price.toFixed(2)} × {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-purple-600">
                                                        ${item.total.toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t pt-3 flex justify-between items-center">
                                            <span className="font-medium">Total</span>
                                            <span className="text-lg font-bold text-purple-600">
                                                ${order.total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                    onClick={handleUpdateShippingAddress}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Update Shipping Address
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cart Dialog */}
            <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Your Cart</DialogTitle>
                        <DialogDescription>
                            {cart.length === 0
                                ? "Your cart is empty"
                                : `${cart.reduce((sum, ci) => sum + ci.quantity, 0)} item${cart.reduce((sum, ci) => sum + ci.quantity, 0) !== 1 ? 's' : ''} in your cart`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No items in cart</p>
                                <p className="text-sm">Add items from the catalog to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((cartItem) => (
                                    <div key={cartItem.item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="h-12 w-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                            {cartItem.item.imageUrl ? (
                                                <img
                                                    src={cartItem.item.imageUrl}
                                                    alt={cartItem.item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{cartItem.item.name}</p>
                                            <p className="text-sm text-purple-600 font-semibold">
                                                ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {itemSubstitutions[cartItem.item.id] && (
                                                <p className="text-xs text-blue-600 font-medium">
                                                    Replace if unavailable
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateCartQuantity(cartItem.item.id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center text-sm font-medium">
                                                    {cartItem.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateCartQuantity(cartItem.item.id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => removeFromCart(cartItem.item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div className="border-t pt-4 mt-4">
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-purple-600">${getCartTotal().toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Place Order Button */}
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700 mt-4"
                                    size="lg"
                                    onClick={handlePlaceOrder}
                                    disabled={placingOrder}
                                >
                                    {placingOrder ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Placing Order...
                                        </>
                                    ) : (
                                        "Place Order"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Order Success Dialog */}
            <Dialog open={orderSuccessDialogOpen} onOpenChange={setOrderSuccessDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="text-center py-6">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl mb-2">Order Placed!</DialogTitle>
                        <DialogDescription className="text-base">
                            Your order has been successfully placed.
                        </DialogDescription>
                        {lastOrderNumber && (
                            <p className="mt-4 text-sm text-muted-foreground">
                                Order Number: <span className="font-mono font-semibold">{lastOrderNumber}</span>
                            </p>
                        )}
                        <Button
                            className="mt-6 bg-purple-600 hover:bg-purple-700"
                            onClick={() => setOrderSuccessDialogOpen(false)}
                        >
                            Continue Shopping
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Pending Orders Dialog */}
            <Dialog open={pendingOrdersDialogOpen} onOpenChange={setPendingOrdersDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Pending Orders
                        </DialogTitle>
                        <DialogDescription>
                            {pendingOrders.length === 0
                                ? "No pending orders"
                                : `${pendingOrders.length} order${pendingOrders.length !== 1 ? 's' : ''} awaiting confirmation`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {pendingOrders.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No pending orders</p>
                                <p className="text-sm">Your pending orders will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingOrders.map((order) => (
                                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                                        {/* Order Header */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                                </span>
                                                Pending Confirmation
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="space-y-2">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                                                    <div className="h-10 w-10 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ${item.price.toFixed(2)} × {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-purple-600">
                                                        ${item.total.toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Order Total and Cancel Button */}
                                        <div className="border-t pt-3 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Total</span>
                                                <span className="text-lg font-bold text-purple-600">
                                                    ${order.total.toFixed(2)}
                                                </span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleCancelOrderClick(order)}
                                                disabled={cancellingOrderId === order.id}
                                            >
                                                {cancellingOrderId === order.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Cancel Order
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Waiting Approval Orders Dialog */}
            <Dialog open={waitingApprovalDialogOpen} onOpenChange={setWaitingApprovalDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 text-blue-500" />
                            Waiting Approval
                        </DialogTitle>
                        <DialogDescription>
                            {waitingApprovalOrders.length === 0
                                ? "No orders waiting for approval"
                                : `${waitingApprovalOrders.length} order${waitingApprovalOrders.length !== 1 ? 's' : ''} picked and waiting for your approval`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {waitingApprovalOrders.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No orders waiting for approval</p>
                                <p className="text-sm">Orders picked by the business will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {waitingApprovalOrders.map((order) => (
                                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                                        {/* Order Header */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                <ClipboardCheck className="h-3 w-3" />
                                                Waiting Approval
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="space-y-2">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="p-2 bg-gray-50 rounded-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                            {item.imageUrl ? (
                                                                <img
                                                                    src={item.imageUrl}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium text-sm truncate ${item.substitutedWith && item.substitutedWith.length > 0 ? 'line-through text-muted-foreground' : ''}`}>
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                ${item.price.toFixed(2)} × {item.quantity}
                                                            </p>
                                                        </div>
                                                        <p className={`text-sm font-semibold ${item.substitutedWith && item.substitutedWith.length > 0 ? 'line-through text-muted-foreground' : 'text-purple-600'}`}>
                                                            ${item.total.toFixed(2)}
                                                        </p>
                                                    </div>

                                                    {/* Show substituted items */}
                                                    {item.substitutedWith && item.substitutedWith.length > 0 && (
                                                        <div className="mt-2 pl-2 border-l-2 border-orange-300 space-y-1">
                                                            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                                                                <RefreshCw className="h-3 w-3" />
                                                                Replaced with:
                                                            </div>
                                                            {item.substitutedWith.map((sub, subIdx) => (
                                                                <div key={subIdx} className="flex items-center gap-2 text-sm">
                                                                    <ArrowRight className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                                                    <span className="flex-1 truncate text-orange-700 font-medium">
                                                                        {sub.quantity}× {sub.name}
                                                                    </span>
                                                                    <span className="text-orange-600 font-semibold">
                                                                        ${sub.total.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Order Total */}
                                        <div className="border-t pt-3 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">Total</span>
                                                {order.originalTotal && order.originalTotal !== order.total ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm line-through text-muted-foreground">
                                                            ${order.originalTotal.toFixed(2)}
                                                        </span>
                                                        <span className="text-lg font-bold text-purple-600">
                                                            ${order.total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-bold text-purple-600">
                                                        ${order.total.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleApproveOrder(order)}
                                            >
                                                Approve & Pay
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Order Completed Notification Dialog */}
            <Dialog open={orderCompletedDialogOpen} onOpenChange={setOrderCompletedDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="text-center py-6">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <PartyPopper className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl mb-2">Order Ready!</DialogTitle>
                        <DialogDescription className="text-base">
                            Great news! Your order has been completed and is ready.
                        </DialogDescription>
                        {completedOrderNumber && (
                            <p className="mt-4 text-sm text-muted-foreground">
                                Order Number: <span className="font-mono font-semibold">{completedOrderNumber}</span>
                            </p>
                        )}
                        <Button
                            className="mt-6 bg-green-600 hover:bg-green-700"
                            onClick={() => setOrderCompletedDialogOpen(false)}
                        >
                            Awesome!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Cancel Order?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel order{" "}
                            <span className="font-mono font-semibold">{orderToCancel?.orderNumber}</span>?
                            Any payment hold will be released back to your card.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOrderToCancel(null)}>
                            Keep Order
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCancelOrder}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Cancel Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stripe Checkout Dialog (for approving orders after merchant picks) */}
            {selectedOrderForPayment && userId && (
                <StripeCheckoutDialog
                    open={checkoutDialogOpen}
                    onOpenChange={handleCheckoutDialogClose}
                    merchantUserId={userId}
                    orderId={selectedOrderForPayment.id}
                    orderNumber={selectedOrderForPayment.orderNumber}
                    amount={selectedOrderForPayment.total}
                    customerEmail={currentUser?.email || undefined}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                />
            )}

            {/* Stripe Payment Authorization Dialog (pay upfront when placing order) */}
            {pendingOrderForPayment && userId && (
                <StripePaymentAuthDialog
                    open={paymentAuthDialogOpen}
                    onOpenChange={handlePaymentAuthDialogClose}
                    merchantUserId={userId}
                    orderId={pendingOrderForPayment.orderId}
                    orderNumber={pendingOrderForPayment.orderNumber}
                    amount={pendingOrderForPayment.total}
                    bufferPercent={0.10}
                    customerEmail={currentUser?.email || undefined}
                    onSuccess={handlePaymentAuthSuccess}
                    onError={handlePaymentAuthError}
                />
            )}
        </div>
    );
}

// Wrap with Suspense to handle useSearchParams on client-side navigation
export default function PublicCatalogPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading catalog...</p>
                </div>
            </div>
        }>
            <CatalogPageContent />
        </Suspense>
    );
}

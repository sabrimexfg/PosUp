"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { db, auth, provider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, orderBy, onSnapshot, updateDoc, requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { User } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImageOff, Store, ShoppingCart, Loader2, User as UserIcon, LogOut, Package, Settings, Plus, Minus, Trash2, CheckCircle, Clock, PartyPopper, ClipboardCheck } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StripeCheckoutDialog } from "@/components/StripeCheckout";

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

interface OnlineOrderItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    imageUrl?: string | null;
    category: string;
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
    const [allowSubstitutions, setAllowSubstitutions] = useState(false);

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

                setBusiness({
                    name: profileData.businessName || "Store",
                    phone: profileData.businessPhone,
                    address: profileData.businessAddress
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
            const orderItems = cart.map(ci => ({
                itemId: ci.item.id,
                name: ci.item.name,
                price: ci.item.price,
                quantity: ci.quantity,
                total: ci.item.price * ci.quantity,
                imageUrl: ci.item.imageUrl || null,
                category: ci.item.category
            }));

            const orderData = {
                orderNumber,
                customerId: currentUser.uid,
                customerEmail: currentUser.email,
                customerName: customerData?.name || currentUser.displayName || "Unknown",
                shippingAddress: customerData?.address || null,
                items: orderItems,
                subtotal: getCartTotal(),
                total: getCartTotal(),
                status: "pending",
                paymentMethod: "online",
                source: "web_catalog",
                timestamp: Date.now(),
                createdAt: Date.now()
            };

            // Save to online_orders subcollection
            await addDoc(collection(db, `users/${userId}/online_orders`), orderData);

            // Clear cart and show success
            setCart([]);
            setCartDialogOpen(false);
            setLastOrderNumber(orderNumber);
            setOrderSuccessDialogOpen(true);
        } catch (err) {
            console.error("Error placing order:", err);
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleApproveOrder = (order: OnlineOrder) => {
        setSelectedOrderForPayment(order);
        setWaitingApprovalDialogOpen(false); // Close the waiting approval dialog
        setCheckoutDialogOpen(true);
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

    const handleUpdateShippingAddress = async () => {
        if (!currentUser || !userId) return;

        try {
            // Fetch existing customer data to pre-fill the form
            const customerDoc = await getDoc(doc(db, `users/${userId}/online_customers/${currentUser.uid}`));
            if (customerDoc.exists()) {
                const data = customerDoc.data();
                setAddressForm({
                    recipientName: data.name || "",
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
                {/* Global Substitution Toggle */}
                {currentUser && existingCustomer && items.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-lg mb-4">
                        <div className="flex-1">
                            <Label htmlFor="global-substitution" className="text-sm font-medium cursor-pointer">
                                Allow substitutions for all items
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Replace any unavailable items with similar alternatives
                            </p>
                        </div>
                        <Switch
                            id="global-substitution"
                            checked={allowSubstitutions}
                            onCheckedChange={setAllowSubstitutions}
                        />
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
                                                {!allowSubstitutions && (
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                                        <Label htmlFor={`sub-${item.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                                            Replace if unavailable
                                                        </Label>
                                                        <Switch
                                                            id={`sub-${item.id}`}
                                                            checked={false}
                                                            onCheckedChange={() => {}}
                                                            className="scale-75"
                                                            disabled
                                                        />
                                                    </div>
                                                )}
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

                                        {/* Order Total */}
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

                                        {/* Order Total */}
                                        <div className="border-t pt-3 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">Total</span>
                                                <span className="text-lg font-bold text-purple-600">
                                                    ${order.total.toFixed(2)}
                                                </span>
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

            {/* Stripe Checkout Dialog */}
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

"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { functions, httpsCallable } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// Initialize Stripe with the publishable key
// For connected accounts, we need to get this dynamically
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    merchantUserId: string;
    orderId: string;
    orderNumber: string;
    amount: number;
    customerEmail?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

interface CheckoutResponse {
    clientSecret: string;
    sessionId: string;
}

export function StripeCheckoutDialog({
    open,
    onOpenChange,
    merchantUserId,
    orderId,
    orderNumber,
    amount,
    customerEmail,
    onSuccess,
    onError
}: StripeCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);

    // Fetch the client secret when dialog opens
    const fetchClientSecret = useCallback(async () => {
        if (!merchantUserId || !orderId || !amount) return null;

        setLoading(true);
        setError(null);

        try {
            const createCheckout = httpsCallable<{
                merchantUserId: string;
                orderId: string;
                orderNumber: string;
                amount: number;
                customerEmail?: string;
            }, CheckoutResponse>(functions, "createCustomerOrderCheckout");

            const result = await createCheckout({
                merchantUserId,
                orderId,
                orderNumber,
                amount,
                customerEmail
            });

            setClientSecret(result.data.clientSecret);
            return result.data.clientSecret;
        } catch (err: any) {
            console.error("Error creating checkout session:", err);
            const errorMessage = err.message || "Failed to initialize payment";
            setError(errorMessage);
            onError?.(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [merchantUserId, orderId, orderNumber, amount, customerEmail, onError]);

    // Get connected account ID from merchant
    const getConnectedAccountId = useCallback(async () => {
        // We need to fetch the merchant's Stripe account ID
        // This is done in the Firebase function, but for the Stripe.js we need it client-side
        // For now, we'll use the platform's publishable key
        // The checkout session is created on the connected account, so payments go there
        return null;
    }, []);

    const handleComplete = useCallback(() => {
        onSuccess?.();
        onOpenChange(false);
        setClientSecret(null);
    }, [onSuccess, onOpenChange]);

    // Reset state when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setClientSecret(null);
            setError(null);
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
                <div className="p-6">
                    {loading && !clientSecret && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                            <p className="text-muted-foreground">Preparing secure checkout...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                                <p className="font-medium">Payment Error</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && open && (
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{
                                fetchClientSecret,
                                onComplete: handleComplete
                            }}
                        >
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

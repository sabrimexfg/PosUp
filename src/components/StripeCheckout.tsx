"use client";

import { useCallback, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { functions, httpsCallable } from "@/lib/firebase";
import { Loader2, CreditCard } from "lucide-react";

// Initialize Stripe with the publishable key
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
    const [error, setError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Fetch client secret when dialog opens
    useEffect(() => {
        if (open && !clientSecret && !error) {
            const fetchSecret = async () => {
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
                    setIsReady(true);
                } catch (err: any) {
                    console.error("Error creating checkout session:", err);
                    const errorMessage = err.message || "Failed to initialize payment";
                    setError(errorMessage);
                    onError?.(errorMessage);
                }
            };
            fetchSecret();
        }
    }, [open, clientSecret, error, merchantUserId, orderId, orderNumber, amount, customerEmail, onError]);

    const handleComplete = useCallback(() => {
        onSuccess?.();
        onOpenChange(false);
        // Reset state after closing
        setTimeout(() => {
            setClientSecret(null);
            setIsReady(false);
            setError(null);
        }, 300);
    }, [onSuccess, onOpenChange]);

    // Reset state when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Delay reset to allow dialog animation to complete
            setTimeout(() => {
                setClientSecret(null);
                setIsReady(false);
                setError(null);
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Complete Payment
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {!isReady && !error && (
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

                    {isReady && clientSecret && (
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{
                                clientSecret,
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { functions, httpsCallable } from "@/lib/firebase";
import { Loader2, CreditCard, CheckCircle2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const [paymentComplete, setPaymentComplete] = useState(false);

    // Fetch client secret when dialog opens
    useEffect(() => {
        if (open && !clientSecret && !error && !paymentComplete) {
            const fetchSecret = async () => {
                try {
                    const createCheckout = httpsCallable<{
                        merchantUserId: string;
                        orderId: string;
                        orderNumber: string;
                        amount: number;
                        customerEmail?: string;
                        returnUrl?: string;
                    }, CheckoutResponse>(functions, "createCustomerOrderCheckout");

                    // Build return URL from current origin (fallback if redirect is needed)
                    const returnUrl = `${window.location.origin}/catalog/${merchantUserId}?payment_status=success&order_id=${orderId}`;

                    const result = await createCheckout({
                        merchantUserId,
                        orderId,
                        orderNumber,
                        amount,
                        customerEmail,
                        returnUrl
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
    }, [open, clientSecret, error, paymentComplete, merchantUserId, orderId, orderNumber, amount, customerEmail, onError]);

    // Handle payment completion
    const handleComplete = useCallback(() => {
        setPaymentComplete(true);
        onSuccess?.();
    }, [onSuccess]);

    // Reset state when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Delay reset to allow dialog animation to complete
            setTimeout(() => {
                setClientSecret(null);
                setIsReady(false);
                setError(null);
                setPaymentComplete(false);
            }, 300);
        }
    };

    // Close dialog after viewing success message
    const handleDone = () => {
        handleOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                {!paymentComplete ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Complete Payment
                            </DialogTitle>
                            <DialogDescription>
                                Securely pay for your order using Stripe
                            </DialogDescription>
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
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                Payment Successful!
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                Order #{orderNumber}
                            </DialogDescription>
                        </DialogHeader>

                        <Card className="border-green-200 bg-green-50/50">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <Truck className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-800">
                                            Your order will be out for delivery shortly
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Thank you for your purchase!
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <DialogFooter className="sm:justify-center">
                            <Button onClick={handleDone} className="w-full sm:w-auto">
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

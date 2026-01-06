"use client";

import { useState, useEffect, useMemo } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { functions, httpsCallable } from "@/lib/firebase";
import { Loader2, CreditCard, CheckCircle2, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

// Cache for Stripe instances per connected account
const stripePromiseCache: Map<string, Promise<Stripe | null>> = new Map();

// Get or create Stripe instance for a connected account
function getStripePromise(connectedAccountId?: string): Promise<Stripe | null> {
    const cacheKey = connectedAccountId || "platform";

    if (!stripePromiseCache.has(cacheKey)) {
        const options = connectedAccountId
            ? { stripeAccount: connectedAccountId }
            : undefined;
        stripePromiseCache.set(
            cacheKey,
            loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, options)
        );
    }

    return stripePromiseCache.get(cacheKey)!;
}

interface PaymentAuthResponse {
    clientSecret: string;
    paymentIntentId: string;
    authorizedAmount: number;
    baseAmount: number;
    stripeAccountId: string;
}

interface StripePaymentAuthProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    merchantUserId: string;
    orderId: string;
    orderNumber: string;
    amount: number;
    bufferPercent?: number;
    customerEmail?: string;
    onSuccess?: (paymentIntentId: string, authorizedAmount: number) => void;
    onError?: (error: string) => void;
}

// Inner form component that uses Stripe hooks
function PaymentForm({
    onSuccess,
    onError,
    orderNumber,
    amount,
    authorizedAmount,
}: {
    onSuccess: () => void;
    onError: (error: string) => void;
    orderNumber: string;
    amount: number;
    authorizedAmount: number;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isElementReady, setIsElementReady] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements || !isElementReady) {
            setErrorMessage("Payment form is still loading. Please wait a moment.");
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            // Submit the form first to ensure all fields are validated
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setErrorMessage(submitError.message || "Please check your payment details");
                setIsProcessing(false);
                return;
            }

            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href,
                },
                redirect: "if_required",
            });

            if (error) {
                setErrorMessage(error.message || "Payment failed");
                onError(error.message || "Payment failed");
            } else {
                // Payment succeeded (or requires no action)
                onSuccess();
            }
        } catch (err: any) {
            setErrorMessage(err.message || "An unexpected error occurred");
            onError(err.message || "An unexpected error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment hold notice */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-4 pb-3">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Temporary payment hold</p>
                            <p className="text-blue-700">
                                We&apos;ll authorize <span className="font-semibold">${authorizedAmount.toFixed(2)}</span> (your order total of ${amount.toFixed(2)} + 10% buffer for substitutions).
                                You&apos;ll only be charged for the final amount when your order ships.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PaymentElement
                options={{
                    layout: "tabs",
                }}
                onReady={() => setIsElementReady(true)}
                onLoadError={(event) => {
                    console.error("PaymentElement load error:", event);
                    setErrorMessage("Failed to load payment form. Please refresh and try again.");
                }}
            />

            {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || !isElementReady || isProcessing}
                className="w-full"
                size="lg"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                    </>
                ) : !isElementReady ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                    </>
                ) : (
                    <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Authorize ${authorizedAmount.toFixed(2)}
                    </>
                )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                Your card will be charged only when your order is ready
            </p>
        </form>
    );
}

export function StripePaymentAuthDialog({
    open,
    onOpenChange,
    merchantUserId,
    orderId,
    orderNumber,
    amount,
    bufferPercent = 0.10,
    customerEmail,
    onSuccess,
    onError
}: StripePaymentAuthProps) {
    const [error, setError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [authorizedAmount, setAuthorizedAmount] = useState<number>(0);
    const [isReady, setIsReady] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

    // Get the Stripe promise for this connected account (only when we have the stripeAccountId)
    const stripePromise = useMemo(() => {
        if (!stripeAccountId) return null;
        return getStripePromise(stripeAccountId);
    }, [stripeAccountId]);

    // Fetch client secret and stripeAccountId when dialog opens
    useEffect(() => {
        if (open && !clientSecret && !error && !paymentComplete) {
            const fetchSecret = async () => {
                try {
                    const createAuth = httpsCallable<{
                        merchantUserId: string;
                        orderId: string;
                        orderNumber: string;
                        amount: number;
                        bufferPercent: number;
                        customerEmail?: string;
                    }, PaymentAuthResponse>(functions, "createOrderPaymentAuthorization");

                    const result = await createAuth({
                        merchantUserId,
                        orderId,
                        orderNumber,
                        amount,
                        bufferPercent,
                        customerEmail,
                    });

                    setClientSecret(result.data.clientSecret);
                    setPaymentIntentId(result.data.paymentIntentId);
                    setAuthorizedAmount(result.data.authorizedAmount);
                    setStripeAccountId(result.data.stripeAccountId);
                    setIsReady(true);
                } catch (err: any) {
                    console.error("Error creating payment authorization:", err);
                    const errorMessage = err.message || "Failed to initialize payment";
                    setError(errorMessage);
                    onError?.(errorMessage);
                }
            };
            fetchSecret();
        }
    }, [open, clientSecret, error, paymentComplete, merchantUserId, orderId, orderNumber, amount, bufferPercent, customerEmail, onError]);

    // Handle payment completion
    const handleComplete = () => {
        setPaymentComplete(true);
        if (paymentIntentId) {
            onSuccess?.(paymentIntentId, authorizedAmount);
        }
    };

    // Handle payment error
    const handleError = (errorMsg: string) => {
        setError(errorMsg);
        onError?.(errorMsg);
    };

    // Reset state when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Delay reset to allow dialog animation to complete
            setTimeout(() => {
                setClientSecret(null);
                setPaymentIntentId(null);
                setAuthorizedAmount(0);
                setIsReady(false);
                setError(null);
                setPaymentComplete(false);
                setStripeAccountId(null);
            }, 300);
        }
    };

    // Close dialog after viewing success message
    const handleDone = () => {
        handleOpenChange(false);
    };

    const stripeOptions = clientSecret ? {
        clientSecret,
        appearance: {
            theme: 'stripe' as const,
            variables: {
                colorPrimary: '#6366f1',
                borderRadius: '8px',
            },
        },
    } : undefined;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                {!paymentComplete ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Secure Payment
                            </DialogTitle>
                            <DialogDescription>
                                Order #{orderNumber}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-2">
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

                            {isReady && clientSecret && stripePromise && stripeOptions && (
                                <Elements stripe={stripePromise} options={stripeOptions}>
                                    <PaymentForm
                                        onSuccess={handleComplete}
                                        onError={handleError}
                                        orderNumber={orderNumber}
                                        amount={amount}
                                        authorizedAmount={authorizedAmount}
                                    />
                                </Elements>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                Payment Authorized!
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                Order #{orderNumber}
                            </DialogDescription>
                        </DialogHeader>

                        <Card className="border-green-200 bg-green-50/50">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <ShieldCheck className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-800">
                                            Your order has been placed!
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            We&apos;ve authorized ${authorizedAmount.toFixed(2)} on your card.
                                            You&apos;ll only be charged for the final amount when your order ships.
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

"use client";

import { useEffect, useState } from "react";
import { auth, provider, signInWithPopup } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckCircle2, LayoutDashboard } from "lucide-react";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
            // Auth state listener will handle redirect
        } catch (error) {
            console.error("Login failed", error);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
            <div className="mb-8 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                    <LayoutDashboard className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-gray-900">PosUp</span>
            </div>

            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in to your account to manage your business
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Button
                            className="w-full h-11 text-base relative overflow-hidden transition-all hover:scale-[1.02]"
                            onClick={handleLogin}
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Sign in with Google
                                </span>
                            )}
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">
                                Protected by Google
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>Secure</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>Fast</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>Reliable</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

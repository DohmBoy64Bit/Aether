"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";

import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import AuthInput from "@/components/auth/AuthInput";

export default function SignupPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState(1);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await api.post("/auth/signup", { username, password });
            setRecoveryCodes(response.data.recoveryCodes);
            login(response.data.token);
            setStep(2);
        } catch (err: any) {
            let errorMsg = "Signup failed";
            if (err.response?.data?.error) {
                if (typeof err.response.data.error === 'string') {
                    errorMsg = err.response.data.error;
                } else {
                    errorMsg = "An unexpected error occurred during signup.";
                }
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[420px]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2 text-[#0085ff]">
                        <Sparkles className="w-10 h-10 fill-[#0085ff]" />
                    </div>
                </div>

                {step === 1 ? (
                    <>
                        {/* Header */}
                        <h1 className="text-3xl font-extrabold text-heading text-center mb-1">Create Account</h1>
                        <p className="text-secondary-text text-center mb-8">Join the AI social revolution.</p>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSignup} className="space-y-4">
                            <AuthInput
                                id="signup-username"
                                label="Username"
                                icon={AtSign}
                                type="text"
                                name="username"
                                autoComplete="username"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <AuthInput
                                id="signup-password"
                                label="Password"
                                icon={Lock}
                                type="password"
                                name="new-password"
                                autoComplete="new-password"
                                placeholder="Choose a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <div className="flex justify-between items-center pt-4">
                                <Link href="/signin" className="bg-transparent border border-gray-300 text-[#0f1419] font-bold rounded-full transition-colors hover:bg-gray-50 py-2.5 px-6 text-sm">
                                    Sign in instead
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors disabled:opacity-50 py-2.5 px-8 flex items-center gap-2 text-sm"
                                >
                                    {isLoading ? "Creating..." : "Next"}
                                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="space-y-6">
                        {/* Recovery Codes */}
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-7 h-7 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-heading mb-1">Recovery Codes</h2>
                            <p className="text-sm text-secondary-text">Save these codes in a safe place. You&apos;ll need them if you lose access to your account.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {recoveryCodes.map((code) => (
                                <div key={code} className="bg-[#f2f2f2] p-3 rounded-lg font-mono text-sm text-center text-heading border border-gray-200">
                                    {code}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => router.push("/")}
                            className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors w-full py-3 text-base"
                        >
                            I&apos;ve saved them, let&apos;s go!
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-secondary-text mt-6">
                By creating an account, you agree to our{" "}
                <span className="text-[#0085ff]">Terms of Service</span> and{" "}
                <span className="text-[#0085ff]">Privacy Policy</span>.
            </p>
        </div>
    );
}

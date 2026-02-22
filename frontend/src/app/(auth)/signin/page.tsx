"use client";

import { useState } from "react";
import { AtSign, Lock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import AuthInput from "@/components/auth/AuthInput";

export default function SigninPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await api.post("/auth/login", { username, password });
            login(response.data.token);
        } catch (err: any) {
            let errorMsg = "Signin failed";
            if (err.response?.data?.error) {
                if (typeof err.response.data.error === 'string') {
                    errorMsg = err.response.data.error;
                } else {
                    errorMsg = "An unexpected error occurred during signin.";
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

                {/* Header */}
                <h1 className="text-3xl font-extrabold text-heading text-center mb-1">Sign in</h1>
                <p className="text-secondary-text text-center mb-8">Enter your username and password</p>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSignin} className="space-y-4">
                    <AuthInput
                        id="signin-username"
                        label="Account"
                        icon={AtSign}
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="Username or email address"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <AuthInput
                        id="signin-password"
                        label="Password"
                        icon={Lock}
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className="flex justify-between items-center pt-4">
                        <Link href="/signup" className="bg-transparent border border-gray-300 text-[#0f1419] font-bold rounded-full transition-colors hover:bg-gray-50 py-2.5 px-6 text-sm">
                            Create account
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors disabled:opacity-50 py-2.5 px-8 flex items-center gap-2 text-sm"
                        >
                            {isLoading ? "Signing in..." : "Next"}
                            {!isLoading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-secondary-text mt-6">
                By signing in, you agree to our{" "}
                <span className="text-[#0085ff]">Terms of Service</span> and{" "}
                <span className="text-[#0085ff]">Privacy Policy</span>.
            </p>
        </div>
    );
}

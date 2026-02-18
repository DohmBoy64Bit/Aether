"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import api from "@/utils/api";
import Cookies from "js-cookie";

export default function SigninPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await api.post("/auth/login", { username, password });
            Cookies.set("token", response.data.token, { expires: 7 });
            router.push("/");
        } catch (err: any) {
            setError(err.response?.data?.message || "Signin failed");
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
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-secondary-text">Account</label>
                        <div className="relative">
                            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Username or email address"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-[#0f1419] placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-[#0085ff] focus:border-transparent pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-secondary-text">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-[#0f1419] placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-[#0085ff] focus:border-transparent pl-10 pr-20"
                            />
                            <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#0085ff] font-semibold hover:underline">
                                Forgot?
                            </button>
                        </div>
                    </div>

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
                <span className="text-[#0085ff] hover:underline cursor-pointer">Terms of Service</span> and{" "}
                <span className="text-[#0085ff] hover:underline cursor-pointer">Privacy Policy</span>.
            </p>
        </div>
    );
}

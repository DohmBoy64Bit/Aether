"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, ArrowRight, ArrowLeft } from "lucide-react";
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
    <div className="fixed inset-0 bg-background z-50 flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col justify-center items-center md:items-start p-10 md:pl-20">
        <h1 className="text-6xl font-black text-primary mb-2">Sign in</h1>
        <p className="text-xl text-gray-500">Enter your username and password</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-10 bg-secondary/10 border-l border-secondary/50">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-400">Account</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Username or email address"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-secondary/50 border border-secondary/50 rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary/50 border border-secondary/50 rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold hover:text-primary transition-colors">
                  Forgot?
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Link href="/auth/signup" className="bg-secondary/50 hover:bg-secondary text-foreground font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <button
              onClick={handleSignin}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

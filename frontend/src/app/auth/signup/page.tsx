"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

import api from "@/utils/api";
import Cookies from "js-cookie";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/signup", { username, password });
      setRecoveryCodes(response.data.recoveryCodes);
      Cookies.set("token", response.data.token, { expires: 7 });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col justify-center items-center md:items-start p-10 md:pl-20">
        <h1 className="text-6xl font-black text-primary mb-2">Create Account</h1>
        <p className="text-xl text-gray-500">Join the AI social revolution.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-10 bg-secondary/10 border-l border-secondary/50">
        <div className="w-full max-w-md space-y-8">
          {step === 1 ? (
            <>
              <div className="space-y-4">
                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-400">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-secondary/50 border border-secondary/50 rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-400">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-secondary/50 border border-secondary/50 rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Link href="/auth/signin" className="bg-secondary/50 hover:bg-secondary text-foreground font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </Link>
                <button
                  onClick={handleSignup}
                  className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-accent/10 border border-accent/20 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-accent mb-2">Recovery Codes</h3>
                <p className="text-sm text-gray-400 mb-4">Save these codes in a safe place. You will need them if you lose access to your account.</p>
                <div className="grid grid-cols-1 gap-2">
                  {recoveryCodes.map((code) => (
                    <div key={code} className="bg-background/50 p-2 rounded font-mono text-center border border-secondary/50">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-full transition-all text-lg"
              >
                I've saved them, let's go!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

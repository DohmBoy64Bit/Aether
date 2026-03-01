"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X, AlertTriangle } from "lucide-react";

// If generic cn doesn't exist, we can use standard tailwind classes or copy cn
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function clnx(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ----------------------------------------
// Toast System
// ----------------------------------------
export type ToastType = "success" | "error" | "info";

export interface ToastProps {
    message: string;
    type: ToastType;
    id: string;
}

export function ToastContainer({ toasts, removeToast }: { toasts: ToastProps[], removeToast: (id: string) => void }) {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={clnx(
                        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300",
                        toast.type === "success" ? "bg-white border-green-100 text-green-800" :
                            toast.type === "error" ? "bg-white border-red-100 text-red-800" :
                                "bg-white border-gray-100 text-gray-800"
                    )}
                >
                    {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {toast.type === "info" && <AlertCircle className="w-5 h-5 text-blue-500" />}

                    <span className="text-sm font-bold">{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="ml-2 hover:bg-gray-100 p-1 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// ----------------------------------------
// Confirm Modal
// ----------------------------------------
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    isDanger?: boolean;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isLoading, isDanger }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[90] animate-in fade-in duration-300" onClick={onCancel} />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-white z-[100] animate-in slide-in-from-right duration-500 flex flex-col pt-safe-top pb-safe-bottom" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1 overflow-y-auto w-full p-8 flex flex-col justify-center">
                    <div className={clnx("w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm border", isDanger ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100")}>
                        {isDanger ? <AlertTriangle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    </div>

                    <h3 className="text-3xl font-black text-heading mb-4 tracking-tight leading-tight">{title}</h3>
                    <p className="text-secondary-text text-[15px] mb-12 leading-relaxed opacity-80">{message}</p>

                    <div className="mt-auto flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={clnx(
                                "w-full py-4 rounded-2xl text-[15px] font-black tracking-widest uppercase text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg active:scale-[0.98]",
                                isDanger ? "bg-red-500 hover:bg-red-400 shadow-red-500/30" : "bg-[#0085ff] hover:bg-blue-400 shadow-[#0085ff]/30"
                            )}
                        >
                            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                            Confirm Action
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl text-[15px] font-black tracking-widest uppercase text-secondary-text bg-gray-100/80 hover:bg-gray-200 transition-colors disabled:opacity-50 active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ----------------------------------------
// Prompt Modal
// ----------------------------------------
interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function PromptModal({ isOpen, title, message, placeholder, onConfirm, onCancel, isLoading }: PromptModalProps) {
    const [value, setValue] = useState("");

    useEffect(() => {
        if (isOpen) setValue("");
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[90] animate-in fade-in duration-300" onClick={onCancel} />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-white z-[100] animate-in slide-in-from-right duration-500 flex flex-col pt-safe-top pb-safe-bottom" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1 overflow-y-auto w-full p-8 flex flex-col min-h-full">

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm border bg-purple-50 text-purple-600 border-purple-100">
                            <AlertCircle className="w-8 h-8" />
                        </div>

                        <h3 className="text-3xl font-black text-heading mb-4 tracking-tight leading-tight">{title}</h3>
                        <p className="text-secondary-text text-[15px] mb-8 leading-relaxed opacity-80">{message}</p>

                        <div className="space-y-2 mb-12">
                            <label className="text-[11px] font-black uppercase text-secondary-text tracking-widest ml-4">Input Required</label>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[#0085ff]/10 focus:border-[#0085ff] text-[15px] font-medium transition-all shadow-inner bg-gray-50/50"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            onClick={() => onConfirm(value)}
                            disabled={isLoading || !value.trim()}
                            className="w-full py-4 rounded-2xl text-[15px] font-black tracking-widest uppercase text-white bg-[#0085ff] hover:bg-blue-400 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-[#0085ff]/30 active:scale-[0.98]"
                        >
                            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                            Submit Input
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl text-[15px] font-black tracking-widest uppercase text-secondary-text bg-gray-100/80 hover:bg-gray-200 transition-colors disabled:opacity-50 active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ----------------------------------------
// Custom Hook for Admin UI
// ----------------------------------------
export function useAdminUI() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const showToast = (message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return {
        toasts,
        showToast,
        removeToast,
    };
}

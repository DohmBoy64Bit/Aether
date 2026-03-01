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
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={clnx("w-10 h-10 rounded-full flex items-center justify-center", isDanger ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                        {isDanger ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-black text-heading">{title}</h3>
                </div>
                <p className="text-secondary-text text-sm mb-8">{message}</p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-secondary-text bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={clnx(
                            "px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-colors disabled:opacity-50",
                            isDanger ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                        )}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirm
                    </button>
                </div>
            </div>
        </div>
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
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-black text-heading mb-2">{title}</h3>
                <p className="text-secondary-text text-sm mb-4">{message}</p>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-8 text-sm"
                    autoFocus
                />

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-secondary-text bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(value)}
                        disabled={isLoading || !value.trim()}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Submit
                    </button>
                </div>
            </div>
        </div>
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

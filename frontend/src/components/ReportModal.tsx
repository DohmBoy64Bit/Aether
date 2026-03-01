"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import api from "@/utils/api";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

export default function ReportModal({ isOpen, onClose, postId }: ReportModalProps) {
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            await api.post(`/social/posts/${postId}/report`, { reason });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setReason("");
            }, 2000);
        } catch (err: any) {
            console.error("Failed to report post", err);
            setError(err.response?.data?.error || "Failed to submit report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-lg text-heading">Report Post</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-secondary-text" />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-bold text-heading">Report Submitted</h4>
                        <p className="text-secondary-text mt-2">Thank you for helping keep Aether safe.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4">
                        <p className="text-sm text-secondary-text mb-4">
                            Help us understand what's wrong with this post. Your report is anonymous.
                        </p>

                        <textarea
                            autoFocus
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Tell us more (e.g. spam, harassment, hate speech...)"
                            className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0085ff] focus:border-transparent outline-none resize-none text-[15px]"
                            disabled={isLoading}
                        />

                        {error && (
                            <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-full font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!reason.trim() || isLoading}
                                className="flex-1 px-4 py-2.5 rounded-full font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit Report
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

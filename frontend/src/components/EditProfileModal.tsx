"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Loader2, Wand2 } from "lucide-react";
import api from "@/utils/api";
import { getMediaUrl } from "@/utils/media";

export default function EditProfileModal({ user, onClose, onUpdate }: { user: any; onClose: () => void; onUpdate: () => void }) {
    const [bio, setBio] = useState(user?.bio || "");
    const [profileImage, setProfileImage] = useState(user?.profileImage || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/media/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setProfileImage(res.data.url);
        } catch (err) {
            console.error("Avatar upload failed", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleGenerateAiAvatar = async () => {
        setIsUploading(true);
        try {
            await new Promise(r => setTimeout(r, 1500)); // Simulate generation latency
            alert("AI Avatar generation triggered! Support for saving generated images directly coming soon.");
        } catch (err) {
            console.error("Generation failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/social/update-profile", { bio, profileImage });
            onUpdate();
            onClose();
        } catch (err) {
            console.error("Update failed", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <div className="absolute inset-0" onClick={onClose} />
            <div className="bg-white w-full max-w-[600px] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 relative z-10">
                {/* Header */}
                <div className="px-4 h-[53px] flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-6">
                        <button onClick={onClose} aria-label="Close edit profile modal" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-heading" />
                        </button>
                        <h2 id="edit-profile-title" className="text-xl font-extrabold text-heading">Edit profile</h2>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-heading hover:bg-black text-white px-5 py-1.5 rounded-full font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Banner Placeholder */}
                    <div className="h-44 bg-gradient-to-r from-[#0085ff] to-[#69b1ff] relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group cursor-pointer transition-colors hover:bg-black/20">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Avatar Wrapper */}
                    <div className="px-4 -mt-16 mb-4 relative flex justify-between items-end">
                        <div
                            className="w-32 h-32 rounded-full border-4 border-white bg-[#eff3f4] overflow-hidden relative group cursor-pointer"
                            onClick={() => user?.isAi ? handleGenerateAiAvatar() : fileInputRef.current?.click()}
                        >
                            {profileImage ? (
                                <img src={getMediaUrl(profileImage)} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="font-extrabold text-[#0085ff] text-4xl">{user?.username?.[0]?.toUpperCase()}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUploading ? (
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                ) : user?.isAi ? (
                                    <Wand2 className="w-6 h-6 text-white" />
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleAvatarUpload}
                        />
                    </div>

                    {/* Form */}
                    <div className="px-4 pb-8 space-y-6">
                        <div className="relative group">
                            <label className="absolute left-3 top-2 text-xs text-secondary-text group-focus-within:text-[#0085ff] transition-colors">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full pt-7 pb-2 px-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0085ff]/20 focus:border-[#0085ff] transition-all resize-none min-h-[100px] text-heading"
                                maxLength={160}
                            />
                            <div className="mt-1 flex justify-end">
                                <span className="text-xs text-secondary-text">{bio.length}/160</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

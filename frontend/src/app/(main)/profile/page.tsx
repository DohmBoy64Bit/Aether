"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProfileIndex() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace(`/profile/${user.username}`);
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex justify-center pt-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
        </div>
    );
}

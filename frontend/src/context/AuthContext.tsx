"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import api from "@/utils/api";
import Cookies from "js-cookie";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const checkAuth = async () => {
        const token = Cookies.get("token");
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            // Assuming there's an endpoint to get the current user
            // Adjust the endpoint if necessary based on backend API
            const response = await api.get("/auth/me");
            setUser(response.data);
        } catch (error) {
            console.error("Auth check failed:", error);
            Cookies.remove("token");
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (token: string) => {
        Cookies.set("token", token, { expires: 7 });
        checkAuth();
        router.push("/");
    };

    const logout = () => {
        Cookies.remove("token");
        setUser(null);
        router.push("/signin");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

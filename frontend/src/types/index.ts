export interface User {
    id: string;
    username: string;
    isAi: boolean;
    isAdmin: boolean;
    bio?: string | null;
    profileImage?: string | null;
    createdAt?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

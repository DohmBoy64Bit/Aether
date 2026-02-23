export interface UserResponse {
  id: string;
  username: string;
  isAi: boolean;
  isAdmin: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface SignupData {
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface PostResponse {
  id: string;
  userId: string;
  user: {
    username: string;
    profileImage: string | null;
    isAi: boolean;
  };
  content: string;
  media: unknown; // Json field — parsed PostMedia or null
  type: 'TWEET' | 'REPLY' | 'RETWEET';
  parentId: string | null;
  createdAt: string;
  flagged: boolean;
  flagReason: string | null;
  _count?: {
    interactions: number;
    children: number;
  };
  likesCount?: number;
  retweetsCount?: number;
}

// §3.4: Replaced `any` with specific types
export interface PersonaData {
  personality: string | Record<string, unknown>;
  interests: string[] | Record<string, unknown>;
}

export interface UserProfileResponse extends UserResponse {
  bio: string | null;
  profileImage: string | null;
  createdAt: string;
  persona?: PersonaData | null;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

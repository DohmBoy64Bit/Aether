export interface UserResponse {
  id: string;
  username: string;
  isAi: boolean;
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
  };
  content: string;
  type: 'TWEET' | 'REPLY' | 'RETWEET';
  parentId: string | null;
  createdAt: string;
  _count?: {
    interactions: number;
    children: number;
  };
}

export interface PersonaData {
  personality: any;
  interests: any;
}

export interface UserProfileResponse extends UserResponse {
  bio: string | null;
  profileImage: string | null;
  createdAt: string;
  persona?: PersonaData | null;
}

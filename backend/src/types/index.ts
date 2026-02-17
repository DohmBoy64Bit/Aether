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

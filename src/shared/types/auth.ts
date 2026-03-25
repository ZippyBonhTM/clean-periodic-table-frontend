type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  message: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  accessToken: string;
  message: string;
};

type RefreshResponse = {
  accessToken: string;
  message: string;
};

type ValidateTokenResponse = {
  valid: boolean;
  userId: string;
  message: string;
};

type AuthUserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

type ProfileResponse = {
  userProfile: AuthUserProfile;
  accessToken: string;
  message: string;
};

type AuthSessionResponse = {
  authenticated: true;
  accessToken: string;
  userProfile: AuthUserProfile;
  message: string;
};

export type {
  AuthSessionResponse,
  AuthUserProfile,
  LoginInput,
  LoginResponse,
  ProfileResponse,
  RefreshResponse,
  RegisterInput,
  RegisterResponse,
  ValidateTokenResponse,
};

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

export type {
  LoginInput,
  LoginResponse,
  RefreshResponse,
  RegisterInput,
  RegisterResponse,
  ValidateTokenResponse,
};

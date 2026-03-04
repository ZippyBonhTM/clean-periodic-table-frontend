type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  message: string;
};

export type { LoginInput, LoginResponse };

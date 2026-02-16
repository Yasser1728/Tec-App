export interface PiUser {
  uid: string;
  username: string;
}

export interface PiAuthResult {
  accessToken: string;
  user: PiUser;
}

export interface TecUser {
  id: string;
  piId: string;
  piUsername: string;
  role: string;
  subscriptionPlan: string | null;
  createdAt: string;
}

export interface TecAuthResponse {
  success: boolean;
  isNewUser: boolean;
  user: TecUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

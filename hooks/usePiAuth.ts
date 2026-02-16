import { initPi } from "@/lib/pi/piClient";

export const usePiAuth = () => {

  const login = async () => {
    const Pi = initPi();

    const scopes = ["username", "payments"];

    const auth = await Pi.authenticate(scopes);

    return auth;
  };

  return { login };
};

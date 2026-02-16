"use client";

import { usePiAuth } from "@/hooks/usePiAuth";

export default function AuthPage() {

  const { login } = usePiAuth();

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={login}
        className="bg-purple-600 text-white px-6 py-3 rounded"
      >
        Login with Pi
      </button>
    </div>
  );
}

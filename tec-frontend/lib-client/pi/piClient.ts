"use client";

declare global {
  interface Window {
    Pi?: any;
  }
}

export interface InitPiOptions {
  version?: string;
  sandbox?: boolean;
}

export const initPi = (options?: InitPiOptions) => {
  if (typeof window === "undefined") {
    console.warn("initPi called on server — ignored.");
    return null;
  }

  if (!window.Pi) {
    console.warn("Pi SDK not found on window.");
    return null;
  }

  const Pi = window.Pi;

  Pi.init({
    version: options?.version ?? "2.0",
    sandbox: options?.sandbox ?? true,
  });

  return Pi;
};

export const initPi = () => {
  if (typeof window !== "undefined") {
    const Pi = (window as any).Pi;

    Pi.init({
      version: "2.0",
      sandbox: true
    });

    return Pi;
  }
};

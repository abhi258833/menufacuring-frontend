import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthTokenContextProps {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
}

const AuthTokenContext = createContext<AuthTokenContextProps | undefined>(undefined);

export const AuthTokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);

  return (
    <AuthTokenContext.Provider value={{ authToken, setAuthToken }}>
      {children}
    </AuthTokenContext.Provider>
  );
};

export const useAuthToken = () => {
  const context = useContext(AuthTokenContext);
  if (!context) {
    throw new Error("useAuthToken must be used within an AuthTokenProvider");
  }
  return context;
};

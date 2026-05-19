import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCsrfToken } from "../api/csrf";

interface CsrfContextType {
  csrfToken: string | null;
  refreshCsrfToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

export const useCsrf = () => {
  const context = useContext(CsrfContext);
  if (!context) {
    throw new Error("useCsrf must be used within a CsrfProvider");
  }
  return context;
};

export const CsrfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const refreshCsrfToken = async () => {
    const token = await fetchCsrfToken();
    setCsrfToken(token);
  };

  useEffect(() => {
    refreshCsrfToken();
  }, []);

  return (
    <CsrfContext.Provider value={{ csrfToken, refreshCsrfToken }}>
      {children}
    </CsrfContext.Provider>
  );
};

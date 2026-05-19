import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { login as authLogin, getAuthStatus } from "../api/authApi";
import { showToast } from "./ToastProvider";
import { fetchUserGroupsList } from "../api/accessManagement";

interface AuthContextType {
    isAuthenticated: boolean;
    isAdmin?: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        const stored = localStorage.getItem("isAdmin");
        return stored ? JSON.parse(stored) : false;
    });

    // Memoized auth check to prevent recreating on every render
    const checkAuth = useCallback(async () => {
        try {
            const authToken = localStorage.getItem("authToken");

            if (authToken && !isTokenExpired(authToken)) {
                setIsAuthenticated(true);

                // Fetch user groups asynchronously without blocking initial render
                getAuthStatus()
                    .then((userId) => {
                        if (userId) {
                            return fetchUserGroupsList(userId);
                        }
                        return null;
                    })
                    .then((groupsData) => {
                        if (groupsData?.groups) {
                            const adminGroup = groupsData.groups.some(
                                (group: any) => group.name === "Administrator"
                            );
                            setIsAdmin(!!adminGroup);
                            localStorage.setItem("isAdmin", JSON.stringify(!!adminGroup));
                        }
                    })
                    .catch((error) => {
                        console.error("Failed to fetch user groups:", error);
                    });
            } else {
                localStorage.removeItem("authToken");
                localStorage.removeItem("isAdmin");
                setIsAuthenticated(false);
                setIsAdmin(false);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        try {
            const response = await authLogin(email, password);
            if (response) {
                setIsAuthenticated(true);
            }
        } catch (error) {
            showToast("Invalid credentials. Please try again.", "error");
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem("authToken");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

const parseJwt = (token: string): { exp?: number } | null => {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = JSON.parse(atob(base64));
        return decodedPayload;
    } catch (error) {
        showToast("Error decoding JWT", "error");
        return null;
    }
};

const isTokenExpired = (token: string): boolean => {
    const decoded = parseJwt(token);
    return decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
};

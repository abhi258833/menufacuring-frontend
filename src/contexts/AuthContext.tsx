import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAuthStatus } from "../api/authApi";
import { showToast } from "./ToastProvider";
import { fetchUserGroupsList } from "../api/accessManagement";
import * as AuthService from "../services/AuthService";
import { isProtectedRoute } from "../utils/routeUtils";

interface AuthContextType {
    isAuthenticated: boolean;
    currentUser: string | null;
    isAdmin?: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        const stored = localStorage.getItem("isAdmin");
        return stored ? JSON.parse(stored) : false;
    });

    const checkAuth = useCallback(async () => {
        try {
            const authToken = localStorage.getItem("authToken");

            if (authToken && !isTokenExpired(authToken)) {
                setIsAuthenticated(true);

                const userId = await getAuthStatus();
                if (userId) {
                    setCurrentUser(userId);
                    const groupsData = await fetchUserGroupsList(userId);
                    if (groupsData?.groups) {
                        const adminGroup = groupsData.groups.some(
                            (group: any) => group.name === "Administrator"
                        );
                        setIsAdmin(!!adminGroup);
                        localStorage.setItem("isAdmin", JSON.stringify(!!adminGroup));
                    }
                }
            } else {
                localStorage.removeItem("authToken");
                localStorage.removeItem("isAdmin");
                setIsAuthenticated(false);
                setIsAdmin(false);
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            // If checking fails and token is expired/invalid, clear it
            localStorage.removeItem("authToken");
            localStorage.removeItem("isAdmin");
            setIsAuthenticated(false);
            setIsAdmin(false);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        try {
            const response = await AuthService.login(email, password);
            if (response.status === 200) {
                setIsAuthenticated(true);
                const userId = await getAuthStatus();
                if (userId) {
                    setCurrentUser(userId);
                    const groupsData = await fetchUserGroupsList(userId);
                    if (groupsData?.groups) {
                        const adminGroup = groupsData.groups.some(
                            (group: any) => group.name === "Administrator"
                        );
                        setIsAdmin(!!adminGroup);
                        localStorage.setItem("isAdmin", JSON.stringify(!!adminGroup));
                    }
                }
                
                showToast("Login successful!", "success");
                const searchParams = new URLSearchParams(window.location.search);
                const redirectUrl = searchParams.get("redirect") || "/";
                window.location.href = redirectUrl;
            }
        } catch (error) {
            showToast("Invalid credentials. Please try again.", "error");
            throw error;
        }
    };

    const logout = async () => {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;

        try {
            await AuthService.logout();
        } catch (error) {
            console.error("AuthService logout failed:", error);
        } finally {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setCurrentUser(null);

            if (isProtectedRoute(currentPath)) {
                const redirectUrl = encodeURIComponent(currentPath + currentSearch);
                window.location.href = `/login?redirect=${redirectUrl}`;
            } else {
                window.location.reload();
            }
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, currentUser, isAdmin, login, logout, loading }}>
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
        const parts = token.split(".");
        const base64Url = parts[1] || parts[0]; // fallback to first part if not a standard 3-part JWT
        if (!base64Url) return null;
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
            base64 += "=";
        }
        const decodedPayload = JSON.parse(atob(base64));
        return decodedPayload;
    } catch (error) {
        return null;
    }
};

const isTokenExpired = (token: string): boolean => {
    const decoded = parseJwt(token);
    return decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
};

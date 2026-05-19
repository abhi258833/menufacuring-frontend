let authToken: string | null = null;

export const setAuthToken = (token: string) => {
    authToken = token;
};

export const getAuthToken = (): string | null => {
    return authToken;
};

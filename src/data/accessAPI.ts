export interface Metadata {
    [key: string]: { value: string }[];
}

export interface Community {
    id: string;
    metadata: Metadata;
}

export interface Collection {
    id: string;
    metadata: Metadata;
}

export interface APIResponse<T> {
    _embedded?: {
        communities?: Community[];
        collections?: Collection[];
    };
}

export interface AuthStatusResponse {
    id: string | null;
    okay: boolean;
    authenticated: boolean;
    authenticationMethod: string;
    type: string;
    _links: {
        eperson?: {
            href: string;
        };
        specialGroups?: {
            href: string;
        };
        self?: {
            href: string;
        };
    };
}


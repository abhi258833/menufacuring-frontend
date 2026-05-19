interface MetadataValue {
    value: string;
    language: string | null;
    authority: string | null;
    confidence: number;
    place: number;
}

export interface Community {
    uuid: string;
    metadata: {
        "dc.title": MetadataValue[];
    };
    isEditing?: boolean;
    editedTitle?: string;
}

export interface CommunityResponse {
    _embedded: {
        communities: Community[];
    };
}

export interface Collection {
    id: string;
    uuid: string;
    name: string;
    metadata: {
        "dc.title": MetadataValue[];
    };
    isEditing?: boolean;
    editedTitle?: string;
}

export interface EmbeddedCollections {
    _embedded: {
        collections: Collection[];
    };
}
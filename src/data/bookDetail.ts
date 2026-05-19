export interface MetadataEntry {
    value: string;
    language?: string | null;
    authority?: string | null;
    confidence?: number;
    place?: number;
  }
  
  export interface BookDetailsData {
    metadata: {
        'dc.contributor.author'?: MetadataEntry[];
        'dc.date.issued'?: MetadataEntry[];
        'dc.description'?: MetadataEntry[];
        'dc.description.abstract'?: MetadataEntry[];
        'dc.identifier.uri'?: MetadataEntry[];
        'dc.publisher'?: MetadataEntry[];
        'dc.title'?: MetadataEntry[];
        [key: string]: MetadataEntry[] | undefined;
    };
  }
  
  
  interface Metadata {
    [key: string]: {value: string}[];
  }
  export interface Bundle {
    uuid: string;
    name: string;
    metadata: Metadata;
  }
  
  export interface BundlesResponse {
    _embedded: {
        bundles: Bundle[];
    };
  }
  
  export interface Bitstream {
    uuid: string;
    name: string;
    metadata: {
        'dc.title'?: MetadataEntry[];
        'dc.description'?: MetadataEntry[];
    };
    _links: {
        content: {
            href: string;
        };
    };
  }
  
  export interface BitstreamsResponse {
    _embedded: {
        bitstreams: Bitstream[];
    };
  }

 export interface BitstreamUploadResponse {
    uuid: string;
    name: string;
  } 

  export interface PatchOperation {
    op: 'replace' | 'remove' | 'add';
    path: string;
    value?: any; 
    from?: string; 
  }
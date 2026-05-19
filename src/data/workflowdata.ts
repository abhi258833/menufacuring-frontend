export interface workflowSearchResult {
  id: string | null;
  scope: string | null;
  query: string | null;
  type: string;
  _embedded: {
    searchResult: {
      _embedded: {
        objects: WorkspaceItem[];
      };
      page: {
        number: number;
        size: number;
        totalPages: number;
        totalElements: number;
      };

    };
  };
}

export interface WorkspaceItem {
  type: string;
  _embedded: {
    indexableObject: {
      id: number;
      sections: {
        license: {
          url: string | null;
          acceptanceDate: string | null;
          granted: boolean;
        };
        upload: {
          primary: any | null;
          files: FileMetadata[];
        };
        collection: string;
        traditionalpagetwo: Record<string, any>;
        traditionalpageone: Record<string, any> & {
          "dc.publisher"?: MetadataValue[];
          "dc.contributor.author"?: MetadataValue[];
          "dc.type"?: MetadataValue[];
          "dc.title"?: MetadataValue[];
          "dc.date.issued"?: MetadataValue[];
        };
      };
      type: string;
      _embedded: {
        item: {
          id: string;
          uuid: string;
          metadata: Record<string, MetadataValue[]>;
          entityType: string | null;
          type: string;
        };
      };
    };
  };
}

interface FileMetadata {
  uuid: string;
  metadata: {
    "dc.source": MetadataValue[];
    "dc.title": MetadataValue[];
  };


}

export interface MetadataValue {
  value: string;
  language: string | null;
  authority: string | null;
  confidence: number;
  place: number;
}

export interface Filtervalue {
  id: string;
  label: string;
  defaultExpanded: boolean;
  fieldName: string;
  filterType: 'checkbox' | 'range';
}

export const FilterOption: Filtervalue[] = [
  {
    id: 'namedresourcetype',
    label: 'Status',
    defaultExpanded: true,
    fieldName: 'namedresourcetype',
    filterType: 'checkbox'
  },
  {
    id: 'submitter',
    label: 'Submitter',
    defaultExpanded: false,
    fieldName: 'submitter',
    filterType: 'checkbox'
  },
  {
    id: 'itemType',
    label: 'Item Type',
    defaultExpanded: false,
    fieldName: 'itemtype',
    filterType: 'checkbox'
  },
  {
    id: 'date',
    label: 'Date',
    defaultExpanded: false,
    fieldName: 'dateIssued',
    filterType: 'range'
  },
  {
    id: 'supervisedBy',
    label: 'Supervised By',
    defaultExpanded: false,
    fieldName: 'supervisedBy',
    filterType: 'checkbox'
  }
];

export interface workflowFilters {
  [key: string]: string[] | boolean | null | undefined;
  namedresourcetype?: string[];
  submitter?: string[];
  itemType?: string[];
  date?: string[];
  supervisedBy?: string[];
}

export interface FacetValue {
  id: string;
  label: string;
  count: number;
}

export interface FacetResult {
  _embedded: {
    values: Array<{ label: string; count: number }>;
  };
  page?: {
    totalElements: number;
  };
}

export interface SortOption {
  value: string;
  label: string;
  apiValue: string;
}

export const sortOptions: SortOption[] = [
  { value: 'relevant', label: 'Most Relevant', apiValue: 'score,DESC' },
  { value: 'title-asc', label: 'Title Ascending', apiValue: 'dc.title,ASC' },
  { value: 'title-desc', label: 'Title Descending', apiValue: 'dc.title,DESC' },
  { value: 'date-asc', label: 'Date Issued Ascending', apiValue: 'dc.date.issued,ASC' },
  { value: 'date-desc', label: 'Date Issued Descending', apiValue: 'dc.date.issued,DESC' },
];

interface policyOption {
  id: string;
  value: string;
}
export const policies: policyOption[] = [
  { id: 'TYPE_SUBMISSION', value: 'TYPE_SUBMISSION' },
  { id: 'TYPE_WORKFLOW', value: 'TYPE_WORKFLOW' },
  { id: 'TYPE_INHERITED', value: 'TYPE_INHERITED' },
  { id: 'TYPE_CUSTOM', value: 'TYPE_CUSTOM' }
]


export const actionType: policyOption[] = [
  { id: 'READ', value: 'READ' },
  { id: 'WRITE', value: 'WRITE' },
  { id: 'REMOVE', value: 'REMOVE' },
  { id: 'ADMIN', value: 'ADMIN' },
  { id: 'DELETE', value: 'DELETE' },
  { id: 'WITHDRAWN_READ', value: 'WITHDRAWN_READ' },
  { id: 'DEFAULT_BITSTREAM_READ', value: 'DEFAULT_BITSTREAM_READ' },
  { id: 'DEFAULT_ITEM_READ', value: 'DEFAULT_ITEM_READ' }
]


export interface Policy {
    id: string,
    name: string,
    policyType: string,
    action: string,
    _embedded: {
        eperson?: {
            uuid: string,
            metadata: {
                'eperson.firstname': [{ value: string }],
                'eperson.lastname': [{ value: string }],
            }
        },
        group?: {
            uuid: string,
            name: string,
        }
    }
}


export interface ResourcePolicyData {
    name: string | null;
    description: string | null;
    policyType: string;
    action: string;
    startDate: string | null;
    endDate: string | null;
    type: {
        value: string;
    };
}


export interface SearchParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
  scope?: string;
  filters?: workflowFilters;
}



export interface WorkspaceMetedata {
  metadata: {
    "dc.description": MetadataValue[];
    "dc.description.abstract": MetadataValue[];
    "dc.identifier.uri": MetadataValue[];
    "dc.rights": MetadataValue[];
    "dc.rights.license": MetadataValue[];
    "dc.title": MetadataValue[];
    "dspace.entity.type": MetadataValue[];
  };
}

export interface Policies {
  id: string,
  name: string,
  policyType: string,
  action: string,
  _embedded: {
    epersons?: {
      uuid: string,
      metadata: {
        'eperson.firstname': [{ value: string }],
        'eperson.lastname': [{ value: string }],
      }
    },
    group?: {
      uuid: string,
      name: string,
    }
  }
}

export interface ResourcePolicy {
  _embedded: {
    resourcepolicies: Policies[]
  }
}

// Workflow Task Types
export interface WorkflowTaskSearchParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
  taskStatus?: string;
  filters?: Record<string, string[] | boolean | null | undefined>;
}

export interface WorkflowTask {
  id: number;
  type: string;
  taskType: 'TASK_POOL' | 'TASK_CLAIMED';
  _embedded: {
    workflowitem?: {
      id: number;
      sections: {
        traditionalpageone: Record<string, any>;
        upload: {
          files: FileMetadata[];
        };
      };
      _embedded: {
        item: {
          id: string;
          uuid: string;
          metadata: Record<string, MetadataValue[]>;
          type: string;
        };
        submitter?: {
          uuid: string;
          name: string;
          email: string;
        };
      };
    };
    owner?: {
      uuid: string;
      metadata: {
        'eperson.firstname': [{ value: string }];
        'eperson.lastname': [{ value: string }];
        'eperson.email': [{ value: string }];
      };
    };
  };
}

export interface WorkflowTaskFilters {
  [key: string]: string[] | boolean | null | undefined;
  submitter?: string[];
  itemType?: string[];
  namedresourcetype?: string[];
  taskType?: string[];
}

export const workflowTaskFilterOptions: Filtervalue[] = [
  {
    id: 'submitter',
    label: 'Submitter',
    defaultExpanded: true,
    fieldName: 'submitter',
    filterType: 'checkbox'
  },
  {
    id: 'itemType',
    label: 'Item Type',
    defaultExpanded: false,
    fieldName: 'itemtype',
    filterType: 'checkbox'
  },
  {
    id: 'namedresourcetype',
    label: 'Status',
    defaultExpanded: true,
    fieldName: 'namedresourcetype',
    filterType: 'checkbox'
  }
];
import { Bitstream } from "./bookDetail";
export interface AdvancedFilter {
  field: string;
  operator: string;
  value: string;
}
export interface SearchParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
  scope?: string;
  communityName?: string;
  collectionName?: string;
  filters?: SearchFilters;
  advancedFilters?: AdvancedFilter[];
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
}
export const formatSubjects = (subjects?: string[]): string[] => {
  if (!subjects) return [];

  return subjects.map((subject) => {
    const firstPart = subject.split(/[&,_]/)[0].trim();
    return firstPart.length > 25 ? firstPart.slice(0, 25) + '...' : firstPart;
  });
};

export interface SearchFilters {
  [key: string]: string[] | boolean | null | undefined;
  date?: string[];
  assetid?: string[];
  invoiceNumber?: string[];
  VendorName?: string[];
  empid?: string[];
  EmpName?: string[];
  hrDocNo?: string[];
  organization?: string[];
  ContractValue?: string[];
  ContractOwner?: string[];
  ContractStatus?: string[];
  Material?: string[];
  PaymentTerms?: string[];
  Quantity?: string[];
  Status?: string[];
  TotalValue?: string[];
  UnitPrice?: string[];
}

export interface SortOption {
  value: string;
  label: string;
  apiValue: string;
}

export interface ResultsPerPageOption {
  value: number;
  label: string;
}

export interface FilterSection {
  id: string;
  label: string;
  defaultExpanded: boolean;
  fieldName: string;
  filterType: 'checkbox' | 'range' | 'boolean';
}

export const metadataFields = {
  title: 'dc.filenumber',
  abstract: 'dc.description.abstract',
  date: 'dc.date.created',
  author: 'dc.contributor.author',
  entityType: 'dspace.entity.type',
  publisher: 'dc.publisher',
  encounter: 'dc.encounterid',
  patientName: 'dc.patientname',
  dateofAdmission: 'dc.dod',
  DoctorName: 'dc.doctorname',
  MrdNo: 'dc.mrdno',
  uhid: 'dc.uhidno',
  assetId: "dc.assetid",
  invoiceNumber: "dc.invoiceNumber",
  docType: "dc.DocType",
  vendorName: "dc.VendorName",
  issuedDate: "dc.date.issued",
  empName: "dc.EmpName",
  empId: "dc.empid",
  hrDocNo: "dc.hrDocNo",
  ContractStatus: "dc.ContractStatus",
  ContractOwner: "dc.ContractOwner",
  ContractValue: "dc.ContractValue",
  organization: "dc.organization",
  Material: "dc.Material",
  PaymentTerms: "dc.PaymentTerms",
  Quantity: "dc.Quantity",
  Status: "dc.Status",
  TotalValue: "dc.TotalValue",
  UnitPrice: "dc.UnitPrice",
} as const;

export const sortOptions: SortOption[] = [
  { value: 'relevant', label: 'Most Relevant', apiValue: 'score,DESC' },
  { value: 'title-asc', label: 'Title Ascending', apiValue: 'dc.title,ASC' },
  { value: 'title-desc', label: 'Title Descending', apiValue: 'dc.title,DESC' },
  { value: 'accessioned-asc', label: 'Accessioned Date Ascending', apiValue: 'dc.date.accessioned,ASC' },
  { value: 'accessioned-desc', label: 'Accessioned Date Descending', apiValue: 'dc.date.accessioned,DESC' }
];

export const resultsPerPageOptions: ResultsPerPageOption[] = [
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' }
];

export const filterSections: FilterSection[] = [

  {
    id: 'date',
    label: 'Date',
    defaultExpanded: false,
    fieldName: 'dateIssued',
    filterType: 'range'
  },
  {
    id: 'assetid',
    label: 'Asset Id',
    defaultExpanded: false,
    fieldName: 'assetid',
    filterType: 'checkbox'
  },
  {
    id: 'invoiceNumber',
    label: 'Invoice Number',
    defaultExpanded: false,
    fieldName: 'invoiceNumber',
    filterType: 'checkbox'
  },
  {
    id: 'DocType',
    label: 'Document Type',
    defaultExpanded: false,
    fieldName: 'DocType',
    filterType: 'checkbox'
  },
  {
    id: 'VendorName',
    label: 'Vendor Name',
    defaultExpanded: false,
    fieldName: 'VendorName',
    filterType: 'checkbox'
  },
  {
    id: 'empid',
    label: 'Employee Id',
    defaultExpanded: false,
    fieldName: 'empid',
    filterType: 'checkbox'
  },
  {
    id: 'EmpName',
    label: 'Employee Name',
    defaultExpanded: false,
    fieldName: 'EmpName',
    filterType: 'checkbox'
  },
  {
    id: 'hrDocNo',
    label: 'Document Number',
    defaultExpanded: false,
    fieldName: 'hrDocNo',
    filterType: 'checkbox'
  },
  {
    id: 'ContractStatus',
    label: 'Contract Status',
    defaultExpanded: false,
    fieldName: 'ContractStatus',
    filterType: 'checkbox'
  },
  {
    id: 'ContractOwner',
    label: 'Contract Owner',
    defaultExpanded: false,
    fieldName: 'ContractOwner',
    filterType: 'checkbox'
  },
  {
    id: 'ContractValue',
    label: 'Contract Value',
    defaultExpanded: false,
    fieldName: 'ContractValue',
    filterType: 'checkbox'
  },
  {
    id: 'organization',
    label: 'Organization',
    defaultExpanded: false,
    fieldName: 'organization',
    filterType: 'checkbox'
  },
  {
    id: 'Material',
    label: 'Material',
    defaultExpanded: false,
    fieldName: 'Material',
    filterType: 'checkbox'
  },
  {
    id: 'PaymentTerms',
    label: 'Payment Terms',
    defaultExpanded: false,
    fieldName: 'PaymentTerms',
    filterType: 'checkbox'
  },
  {
    id: 'Quantity',
    label: 'Quantity',
    defaultExpanded: false,
    fieldName: 'Quantity',
    filterType: 'checkbox'
  },
  {
    id: 'Status',
    label: 'Status',
    defaultExpanded: false,
    fieldName: 'Status',
    filterType: 'checkbox'
  },
  {
    id: 'TotalValue',
    label: 'Total Value',
    defaultExpanded: false,
    fieldName: 'TotalValue',
    filterType: 'checkbox'
  },
  {
    id: 'UnitPrice',
    label: 'Unit Price',
    defaultExpanded: false,
    fieldName: 'UnitPrice',
    filterType: 'checkbox'
  }

];

export interface ObjectSearchResult {
  _embedded: {
    searchResult: {
      _embedded: {
        objects: any[];
      };
      page?: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
      };
    };
  };
}

export interface FacetResult {
  _embedded: {
    values: Array<{ label: string; count: number }>;
  };
  page?: {
    totalElements: number;
  };
}

export interface Bundle {
  name: string;
  _embedded?: {
    bitstreams?: Bitstream[];
  };
}

export interface AdvancedSearchField {
  id: string;
  label: string;
  fieldName: string;
  operators: SearchOperator[];
}

export interface SearchOperator {
  id: string;
  label: string;
  apiValue: string;
}

const commonOperators: SearchOperator[] = [
  { id: 'equals', label: 'Equals', apiValue: 'equals' },
  { id: 'notEquals', label: 'Not Equals', apiValue: 'notequals' },
  { id: 'contains', label: 'Contains', apiValue: 'contains' },
  { id: 'notContains', label: 'Not Contains', apiValue: 'notcontains' },
  { id: 'authority', label: 'Authority', apiValue: 'authority' },
  { id: 'notauthority', label: 'Not Authority', apiValue: 'notauthority' },
  { id: 'query', label: 'Query', apiValue: 'query' }
]

export const advancedSearchFields: AdvancedSearchField[] = [
  {
    id: 'ContractStatus',
    label: 'Contract Status',
    fieldName: 'ContractStatus',
    operators: commonOperators
  },
  {
    id: 'author',
    label: 'Author',
    fieldName: 'author',
    operators: commonOperators
  },
  {
    id: 'subject',
    label: 'Subject',
    fieldName: 'subject',
    operators: commonOperators
  },
  {
    id: 'fileType',
    label: 'File Type',
    fieldName: 'filetype',
    operators: commonOperators
  },
];

export interface AdvancedFilter {
  id?: string;
  field: string;
  operator: string;
  value: string;
}
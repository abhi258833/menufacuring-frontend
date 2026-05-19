// -------------------------
// Report Field Definition
// -------------------------
export interface ReportField {
  id: number;
  metaData: string;
  header: string;
}

export const itemReportField: ReportField[] = [
  { id: 1, metaData: "dc.patientname", header: "Patient Name" },
  { id: 2, metaData: "dc.uhidno", header: "UHID Number" },
  { id: 3, metaData: "dc.doctorname", header: "Doctor Name" },
  { id: 4, metaData: "dc.diagnosis", header: "Diagnosis" },
  { id: 5, metaData: "dc.filetype", header: "File Type" },
  { id: 6, metaData: "dc.mlc", header: "MLC" },
  { id: 7, metaData: "dc.mrdno", header: "MRD No" },
  { id: 8, metaData: "dc.encounterid", header: "Encounter Id" },
  { id: 9, metaData: "dc.date.created", header: "Date Of Admission" },
  { id: 10, metaData: "dc.dod", header: "Date Of Discharge" },
];

// -------------------------
// Metadata
// -------------------------
export interface Metadata {
  [key: string]: string[]; // e.g. { "dc.patientname": ["John Doe"] }
}

// -------------------------
// Item (single document)
// -------------------------
export interface Item {
  itemId: string;
  itemName?: string;
  metadata: Metadata;
}

// -------------------------
// Collection (group of items)
// -------------------------
export interface Collection {
  collectionId: string;
  collectionName: string;
  availableMetadata?: string[];
  items: Item[];
}

// -------------------------
// Community (group of collections)
// -------------------------
export interface Community {
  communityId: string;
  communityName: string;
  collections: Collection[];
}

// -------------------------
// API Response
// -------------------------
export interface ApiResponse {
  data: Community[];
  totalCommunities?: number;
  totalItems?: number;
  page?: number;
  size?: number;
}

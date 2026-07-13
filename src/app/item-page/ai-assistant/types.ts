export interface SummarySection {
  page: number;
  title: string;
  summary: string;
}

export interface DocumentSummaryResponse {
  handle: string;
  title?: string;
  sections?: SummarySection[];
}

export interface CachedDocumentSummary {
  handle: string;
  generatedAt: string;
  sections: SummarySection[];
}

export interface SummaryPanelProps {
  sections: SummarySection[];
  onNavigate: (page: number) => void;
  selectedPage?: number | null;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  instantRender?: boolean;
  onAllRendered?: () => void;
}

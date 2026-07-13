export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type Version = {
  id: string;
  // null for the imported catalogue rows — Dylan has no account, and some
  // of those versions explicitly aren't his. Don't invent an attribution.
  addedBy: string | null;
  authorName: string | null;
  lyrics?: string;
  notes?: string;
  source?: string;
  date: Date;
};

export type Song = {
  id: string;
  versions: Version[];
  name: string;
  alt: string[];
  roud?: number;
  singers: string[];
  date: Date;
  composer?: string;
  unaccompanied: boolean;
  accompanied: boolean;
  refrain: string;
  themes: string[];
  categories: string[];
  purposes: string[];
  happiness: number;
  reference?: string;
  lyrics?: string;
  info?: string;
};

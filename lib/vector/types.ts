export type Vector = number[];

export type Document = {
  id: string;
  source: 'patients' | 'dental-records' | 'appointments' | 'images';
  text: string;
  metadata?: Record<string, any>;
  vector?: Vector; // populated after embedding
};

export type VectorIndex = {
  dims: number;
  createdAt: string;
  docCount: number;
  documents: Array<Omit<Document, 'vector'> & { vector: Vector }>;
};

export type SearchResult = {
  id: string;
  score: number;
  source: Document['source'];
  text: string;
  metadata?: Record<string, any>;
};

export interface TrainingEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  rows: {
    type: string;
    duration: string;
    value: string;
  }[];
  createdAt: string;
  updatedAt: string;
} 
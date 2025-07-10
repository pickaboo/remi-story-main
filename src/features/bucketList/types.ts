export interface BucketItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  imageUrl?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  checklist?: { text: string; done: boolean }[];
  motivation?: string;
} 
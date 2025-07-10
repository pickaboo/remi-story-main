import React from 'react';
import { BucketItem } from '../types';
import { BucketCard } from './BucketCard';

interface BucketListGridProps {
  buckets: BucketItem[];
  onAdd: () => void;
  onStatusCycle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleChecklist?: (id: string) => void;
}

export const BucketListGrid: React.FC<BucketListGridProps> = ({
  buckets,
  onAdd,
  onStatusCycle,
  onEdit,
  onDelete,
  onToggleChecklist,
}) => {
  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-16 py-6">
      {/* Sticky add-knapp överst */}
      <div className="sticky top-0 z-20 flex justify-end mb-6">
        <button
          onClick={onAdd}
          className="rounded-full p-3 bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-700 text-accent hover:bg-accent hover:text-white transition-all focus:outline-none -mt-8 mr-2"
          style={{ boxShadow: '0 6px 24px 0 rgba(0,0,0,0.10)' }}
          title="Lägg till bucket"
        >
          <span className="text-3xl leading-none">＋</span>
        </button>
      </div>
      {/* Grid med bucket cards */}
      {buckets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <span className="text-7xl mb-4">🪣</span>
          <span className="text-xl font-light" style={{ fontFamily: 'SF Pro Display, Inter, sans-serif' }}>Din bucket list är tom.<br />Klicka på <span className='text-accent'>＋</span> för att lägga till!</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
          {buckets.map(bucket => (
            <BucketCard
              key={bucket.id}
              bucket={bucket}
              onStatusCycle={onStatusCycle}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleChecklist={onToggleChecklist}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 
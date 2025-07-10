import React from 'react';
import { BucketItem } from '../types';

interface BucketCardProps {
  bucket: BucketItem;
  onStatusCycle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleChecklist?: (id: string) => void;
}

const statusIcon = {
  todo: <span title="Ej påbörjad" className="text-slate-300">●</span>,
  inprogress: <span title="Påbörjad" className="text-yellow-400">●</span>,
  done: <span title="Klar" className="text-green-400">●</span>,
};
const prioIcon = {
  low: <span title="Låg prioritet" className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full text-xs font-medium">Låg</span>,
  medium: <span title="Medel prioritet" className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-medium">Medel</span>,
  high: <span title="Hög prioritet" className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-xs font-medium">Hög</span>,
};

export const BucketCard: React.FC<BucketCardProps> = ({ bucket, onStatusCycle, onEdit, onDelete, onToggleChecklist }) => {
  return (
    <div className={
      `relative rounded-3xl p-7 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 
      shadow-[0_4px_24px_0_rgba(0,0,0,0.07)] border border-slate-100 dark:border-slate-800 flex flex-col items-center transition-all group hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] hover:scale-[1.025] min-h-[340px]`
    }>
      {/* Action-ikoner, endast på hover */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(bucket.id)} className="hover:text-accent focus:outline-none" title="Redigera"><span className="text-lg">✏️</span></button>
        <button onClick={() => onDelete(bucket.id)} className="hover:text-danger focus:outline-none" title="Ta bort"><span className="text-lg">🗑️</span></button>
      </div>
      {/* Prio badge uppe till vänster */}
      {bucket.priority && (
        <div className="absolute top-4 left-4">{prioIcon[bucket.priority]}</div>
      )}
      {/* Bild/emoji med soft glow */}
      <div className="relative mb-4">
        {bucket.imageUrl ? (
          <img src={bucket.imageUrl} alt="Bucket" className="w-20 h-20 object-cover rounded-full shadow-lg" style={{ boxShadow: '0 0 0 8px rgba(255,255,255,0.7), 0 4px 24px 0 rgba(0,0,0,0.10)' }} />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-lg" style={{ boxShadow: '0 0 0 8px rgba(255,255,255,0.7), 0 4px 24px 0 rgba(0,0,0,0.10)' }}>🪣</div>
        )}
        <button onClick={() => onStatusCycle(bucket.id)} className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow p-1 hover:scale-110 transition-transform" title="Byt status">
          {statusIcon[bucket.status]}
        </button>
      </div>
      {/* Titel */}
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 text-center mb-1 tracking-tight" style={{ fontFamily: 'SF Pro Display, Inter, sans-serif' }}>{bucket.title}</h3>
      {/* Taggar */}
      {bucket.tags && bucket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          {bucket.tags.map(tag => (
            <span key={tag} className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full px-2 py-0.5 text-xs font-medium">#{tag}</span>
          ))}
        </div>
      )}
      {/* Beskrivning */}
      {bucket.description && <p className="text-base text-slate-600 dark:text-slate-300 text-center mb-2 font-light">{bucket.description}</p>}
      {/* Motivation/citat */}
      {bucket.motivation && <p className="text-xs italic text-slate-400 text-center mb-2">“{bucket.motivation}”</p>}
      {/* Deadline och checklista */}
      <div className="flex flex-col items-center gap-1 mt-auto w-full">
        {bucket.deadline && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1"><span>⏰</span><span>{bucket.deadline}</span></div>
        )}
        {bucket.checklist && bucket.checklist.length > 0 && (
          <button onClick={() => onToggleChecklist?.(bucket.id)} className="text-xs flex items-center gap-1 hover:text-accent text-slate-400" title="Visa checklista">📋 Checklista</button>
        )}
      </div>
    </div>
  );
}; 
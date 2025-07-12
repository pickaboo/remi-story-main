import React, { useState, useEffect } from 'react';

interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface BucketModalValues {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
  imageUrl?: string;
  checklist?: ChecklistItem[];
}

interface BucketModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: BucketModalValues) => void;
  initialValues?: BucketModalValues;
}

const prioOptions = [
  { value: 'low', label: 'Låg' },
  { value: 'medium', label: 'Medel' },
  { value: 'high', label: 'Hög' },
];

export const BucketModal: React.FC<BucketModalProps> = ({ open, onClose, onSave, initialValues }) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialValues?.priority || 'medium');
  const [deadline, setDeadline] = useState(initialValues?.deadline || '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialValues?.checklist || []);
  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    setTitle(initialValues?.title || '');
    setDescription(initialValues?.description || '');
    setPriority(initialValues?.priority || 'medium');
    setDeadline(initialValues?.deadline || '');
    setImageUrl(initialValues?.imageUrl || '');
    setChecklist(initialValues?.checklist || []);
  }, [initialValues]);

  if (!open) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([...checklist, { text: newChecklistText, done: false }]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (idx: number) => {
    setChecklist(cl => cl.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  };

  const handleRemoveChecklist = (idx: number) => {
    setChecklist(cl => cl.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title, description, priority, deadline, imageUrl: imageUrl || 'target', checklist });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md min-h-screen h-full">
      <div className="bg-white dark:bg-[#18181b] rounded-2xl p-8 shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 relative flex flex-col overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Stäng">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">{initialValues ? 'Redigera Bucket' : 'Ny Bucket'}</h2>
        <div className="w-full">
          {/* Bild/emoji */}
          <div className="mb-4 flex flex-col items-center gap-2">
            {imageUrl ? (
              <img src={imageUrl} alt="Bucket" className="w-16 h-16 object-cover rounded-full shadow" />
            ) : (
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-16 h-16 block text-accent dark:text-accent"
                  aria-label="bucket-list-target"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            )}
            <div className="flex gap-2 mt-1">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="bucket-image-upload" />
              <label htmlFor="bucket-image-upload" className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs cursor-pointer">Ladda upp bild</label>
            </div>
          </div>
          {/* Titel */}
          <input
            className="w-full mb-3 p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200 text-base font-light focus:ring-2 focus:ring-accent/30 focus:outline-none transition"
            placeholder="Titel"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          {/* Beskrivning */}
          <textarea
            className="w-full mb-3 p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200 text-base font-light focus:ring-2 focus:ring-accent/30 focus:outline-none transition"
            placeholder="Beskrivning (valfritt)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
          />
          {/* Prio och deadline */}
          <div className="flex gap-2 w-full mb-3">
            <select
              className="flex-1 p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200 text-base font-light"
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
            >
              {prioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <input
              type="date"
              className="flex-1 p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200 text-base font-light"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          {/* Checklist */}
          <div className="w-full mb-3">
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200 text-xs"
                placeholder="Lägg till punkt"
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklist(); } }}
              />
              <button className="px-2 py-1 rounded bg-accent text-white text-xs" onClick={handleAddChecklist}>Lägg till</button>
            </div>
            <ul className="pl-3 list-disc text-xs text-slate-500 dark:text-slate-300">
              {checklist.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 mb-1">
                  <button className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs mr-1 bg-white dark:bg-dark-bg" onClick={() => handleToggleChecklist(idx)}>
                    {item.done ? <span className="text-green-500">✔</span> : ''}
                  </button>
                  <span className={item.done ? 'line-through text-green-500' : ''}>{item.text}</span>
                  <button className="ml-auto text-xs text-danger" onClick={() => handleRemoveChecklist(idx)} title="Ta bort">✕</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2 w-full mt-4">
          <button className="px-5 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-medium" onClick={onClose}>Avbryt</button>
          <button className="px-5 py-2 rounded-full bg-accent text-white hover:bg-accent/90 transition font-medium shadow" onClick={handleSave} disabled={!title.trim()}>Spara</button>
        </div>
      </div>
    </div>
  );
}; 
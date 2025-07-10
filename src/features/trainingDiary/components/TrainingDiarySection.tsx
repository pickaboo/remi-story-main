import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { saveTrainingEntry, getTrainingEntriesByUserAndDate } from '../services/trainingDiaryService';
import { TrainingEntry } from '../types';

const TRAINING_TYPES = [
  'Löpning',
  'Styrketräning',
  'Yoga',
  'Cykling',
  'Simning',
  'Promenad',
  'Annat',
];

interface TrainingRow {
  type: string;
  duration: string;
  value: string;
}

interface TrainingDiarySectionProps {
  editingEntry?: TrainingEntry | null;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  onEntrySaved?: (entry: TrainingEntry) => void;
}

export const TrainingDiarySection: React.FC<TrainingDiarySectionProps> = ({ editingEntry, onCancelEdit, onSaveEdit, onEntrySaved }) => {
  const { currentUser } = useAppContext();
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [entry, setEntry] = useState<TrainingEntry | null>(null);
  const [hasInitializedForm, setHasInitializedForm] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Fyll formuläret om vi redigerar
  useEffect(() => {
    if (editingEntry) {
      setRows(editingEntry.rows);
      setNote(editingEntry.note || '');
      setHasInitializedForm(true);
    } else {
      setRows([]);
      setNote('');
      setHasInitializedForm(false);
    }
  }, [editingEntry]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    getTrainingEntriesByUserAndDate(currentUser.id, today)
      .then(e => {
        setEntry(e);
        // Fyll ALDRIG formuläret automatiskt från entry
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, today]);

  const handleAddRow = () => {
    setRows([...rows, { type: '', duration: '', value: '' }]);
  };

  const handleRowChange = (idx: number, field: keyof TrainingRow, value: string) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleRemoveRow = (idx: number) => {
    setRows(rows => rows.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setFeedback(null);
    let newEntry: TrainingEntry;
    if (editingEntry) {
      // Uppdatera befintligt inlägg
      newEntry = {
        ...editingEntry,
        note,
        rows,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Lägg till nya pass till dagens entry
      let existingEntry = entry;
      if (!existingEntry) {
        existingEntry = await getTrainingEntriesByUserAndDate(currentUser.id, today);
      }
      const mergedRows = [
        ...(existingEntry?.rows || []),
        ...rows
      ];
      // Concat note om det redan finns
      let mergedNote = note;
      if (existingEntry?.note && note) {
        mergedNote = existingEntry.note + '\n' + note;
      } else if (existingEntry?.note) {
        mergedNote = existingEntry.note;
      }
      newEntry = {
        id: `${currentUser.id}_${today}`,
        userId: currentUser.id,
        date: today,
        note: mergedNote,
        rows: mergedRows,
        createdAt: existingEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    try {
      await saveTrainingEntry(newEntry);
      setEntry(newEntry);
      setFeedback('Sparat!');
      setRows([]);
      setNote('');
      setHasInitializedForm(true);
      if (onSaveEdit) onSaveEdit();
      if (onEntrySaved) onEntrySaved(newEntry);
    } catch {
      setFeedback('Kunde inte spara träningspass.');
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <section className="mt-8 p-6 bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-lg font-semibold mb-2 text-primary">
        {editingEntry ? 'Redigera träningsdagbok' : 'Träningsdagbok'}
      </h3>
      <textarea
        className="w-full mb-4 p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-200"
        rows={2}
        placeholder="Hur kändes dagens träningspass?"
        value={note}
        onChange={e => setNote(e.target.value)}
        disabled={saving}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded-xl bg-white dark:bg-dark-bg">
          <thead>
            <tr className="bg-slate-100 dark:bg-dark-bg/40">
              <th className="px-3 py-2 text-left">Typ</th>
              <th className="px-3 py-2 text-left">Tid (min)</th>
              <th className="px-3 py-2 text-left">Siffra</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1 bg-white dark:bg-dark-bg"
                    value={row.type}
                    onChange={e => handleRowChange(idx, 'type', e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Välj</option>
                    {TRAINING_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    className="border rounded px-2 py-1 w-20 bg-white dark:bg-dark-bg"
                    value={row.duration}
                    onChange={e => handleRowChange(idx, 'duration', e.target.value)}
                    disabled={saving}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-24 bg-white dark:bg-dark-bg"
                    value={row.value}
                    onChange={e => handleRowChange(idx, 'value', e.target.value)}
                    placeholder="t.ex. 5 km"
                    disabled={saving}
                  />
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => handleRemoveRow(idx)} className="text-danger hover:underline" disabled={saving}>Ta bort</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleAddRow}
        className="mt-4 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90"
        disabled={saving}
      >
        Lägg till pass
      </button>
      {editingEntry ? (
        <>
          <button
            onClick={handleSave}
            className="mt-4 ml-4 px-4 py-2 rounded bg-accent text-white hover:bg-accent/90"
            disabled={saving || rows.length === 0}
          >
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
          <button
            onClick={onCancelEdit}
            className="mt-4 ml-4 px-4 py-2 rounded bg-secondary text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            disabled={saving}
          >
            Avbryt
          </button>
        </>
      ) : (
        <button
          onClick={handleSave}
          className="mt-4 ml-4 px-4 py-2 rounded bg-accent text-white hover:bg-accent/90"
          disabled={saving || rows.length === 0}
        >
          {saving ? 'Sparar...' : 'Spara träningspass'}
        </button>
      )}
      {feedback && <p className="mt-2 text-sm text-primary">{feedback}</p>}
    </section>
  );
}; 
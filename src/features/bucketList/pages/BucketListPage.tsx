import React, { useState, useRef } from 'react';
import { BucketModal, BucketModalValues } from '../components/BucketModal';
import { useAppContext } from '../../../context/AppContext';
import { fetchBuckets, saveBucket, updateBucket, deleteBucket as deleteBucketFS } from '../services/bucketListService';
import ReactCanvasConfetti from 'react-canvas-confetti';

interface ChecklistItem {
  text: string;
  done: boolean;
}

interface BucketItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
  imageUrl?: string;
  checklist?: ChecklistItem[];
}

const statusIcon = {
  todo: <span title="Ej påbörjad" className="text-slate-300">●</span>,
  inprogress: <span title="Påbörjad" className="text-yellow-400">●</span>,
  done: <span title="Klar" className="text-green-400">●</span>,
};

// Dark mode detection hook
function useIsDarkMode() {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(match.matches || document.documentElement.classList.contains('dark'));
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    match.addEventListener('change', handler);
    return () => match.removeEventListener('change', handler);
  }, []);
  return isDark;
}

export const BucketListPage: React.FC = () => {
  const { currentUser, showGlobalFeedback } = useAppContext();
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValues, setModalInitialValues] = useState<BucketItem | undefined>(undefined);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [showFirework, setShowFirework] = useState(false);
  const confettiRef = useRef<any>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<'top' | 'bottom'>('bottom');
  const statusBtnRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const listWrapperRef = useRef<HTMLDivElement | null>(null);

  // Helper: scrolla in knapp i vy
  function scrollStatusBtnIntoView(bucketId: string) {
    const btn = statusBtnRefs.current[bucketId];
    if (btn) {
      btn.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  React.useEffect(() => {
    if (!currentUser) return;
    fetchBuckets(currentUser.id).then(setBuckets);
  }, [currentUser]);

  React.useEffect(() => {
    if (showFirework && confettiRef.current) {
      const duration = 2200;
      const animationEnd = Date.now() + duration;
      const defaults = {
        particleCount: 120,
        spread: 120,
        startVelocity: 40,
        ticks: 80,
        origin: { y: 0.7 }
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        confettiRef.current({
          ...defaults,
          origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.2, 0.8) }
        });
      }, 180);

      return () => clearInterval(interval);
    }
  }, [showFirework]);

  // Stäng meny om man klickar utanför
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpenId]);

  const handleEdit = (bucket: BucketItem) => {
    setModalInitialValues({ ...bucket });
    setModalOpen(true);
  };
  const handleAddNew = () => {
    setModalInitialValues(undefined);
    setModalOpen(true);
  };
  const handleModalSave = async (values: BucketModalValues) => {
    if (!currentUser) return;
    if (modalInitialValues) {
      // Edit
      const bucket = buckets.find(b => b.title === modalInitialValues.title && b.description === modalInitialValues.description);
      if (bucket) {
        const updated: BucketItem = {
          ...bucket,
          ...values,
          updatedAt: new Date().toISOString(),
        };
        await updateBucket(currentUser.id, bucket.id, updated);
        setBuckets(buckets => buckets.map(b => b.id === bucket.id ? updated : b));
        showGlobalFeedback && showGlobalFeedback('Bucket uppdaterad!', 'success');
      }
    } else {
      // New
      const newBucket: BucketItem = {
        id: Date.now().toString(),
        status: 'todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...values,
      };
      await saveBucket(currentUser.id, newBucket);
      setBuckets(buckets => [newBucket, ...buckets]);
      showGlobalFeedback && showGlobalFeedback('Bucket tillagd!', 'success');
    }
    setModalOpen(false);
    setModalInitialValues(undefined);
  };

  const handleStatus = async (id: string) => {
    if (!currentUser) return;
    let nextStatus: 'todo' | 'inprogress' | 'done' = 'todo';
    setBuckets(buckets => buckets.map(b => {
      if (b.id !== id) return b;
      nextStatus = b.status === 'todo' ? 'inprogress' : b.status === 'inprogress' ? 'done' : 'todo';
      if (nextStatus === 'done') {
        setShowFirework(true);
        setTimeout(() => setShowFirework(false), 1800);
      }
      return { ...b, status: nextStatus, updatedAt: new Date().toISOString() };
    }));
    try {
      await updateBucket(currentUser.id, id, { status: nextStatus, updatedAt: new Date().toISOString() });
      showGlobalFeedback && showGlobalFeedback('Status uppdaterad!', 'success');
    } catch (err) {
      showGlobalFeedback && showGlobalFeedback('Kunde inte uppdatera status i Firestore', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    await deleteBucketFS(currentUser.id, id);
    setBuckets(buckets => buckets.filter(b => b.id !== id));
    showGlobalFeedback && showGlobalFeedback('Bucket borttagen!', 'success');
  };

  // Hantera bockning av checklist-item
  const handleToggleChecklist = async (bucketId: string, idx: number) => {
    if (!currentUser) return;
    setBuckets(buckets => buckets.map(b => {
      if (b.id !== bucketId) return b;
      const newChecklist = b.checklist ? b.checklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item) : [];
      const updated = { ...b, checklist: newChecklist, updatedAt: new Date().toISOString() };
      updateBucket(currentUser.id, bucketId, { checklist: newChecklist, updatedAt: new Date().toISOString() });
      showGlobalFeedback && showGlobalFeedback('Checklista uppdaterad!', 'success');
      return updated;
    }));
  };
  // Lägg till checklist-item
  const handleAddChecklistItem = async (bucketId: string, text: string) => {
    if (!currentUser) return;
    setBuckets(buckets => buckets.map(b => {
      if (b.id !== bucketId) return b;
      const newChecklist = [...(b.checklist || []), { text, done: false }];
      const updated = { ...b, checklist: newChecklist, updatedAt: new Date().toISOString() };
      updateBucket(currentUser.id, bucketId, { checklist: newChecklist, updatedAt: new Date().toISOString() });
      showGlobalFeedback && showGlobalFeedback('Checklista uppdaterad!', 'success');
      return updated;
    }));
  };
  // Ta bort checklist-item
  const handleRemoveChecklistItem = async (bucketId: string, idx: number) => {
    if (!currentUser) return;
    setBuckets(buckets => buckets.map(b => {
      if (b.id !== bucketId) return b;
      const newChecklist = b.checklist ? b.checklist.filter((_, i) => i !== idx) : [];
      const updated = { ...b, checklist: newChecklist, updatedAt: new Date().toISOString() };
      updateBucket(currentUser.id, bucketId, { checklist: newChecklist, updatedAt: new Date().toISOString() });
      showGlobalFeedback && showGlobalFeedback('Checklista uppdaterad!', 'success');
      return updated;
    }));
  };

  // Sätt status direkt
  const handleSetStatus = async (id: string, status: 'todo' | 'inprogress' | 'done') => {
    if (!currentUser) return;
    setBuckets(buckets => buckets.map(b => {
      if (b.id !== id) return b;
      if (status === 'done') {
        setShowFirework(true);
        setTimeout(() => setShowFirework(false), 1800);
      }
      return { ...b, status, updatedAt: new Date().toISOString() };
    }));
    try {
      await updateBucket(currentUser.id, id, { status, updatedAt: new Date().toISOString() });
      showGlobalFeedback && showGlobalFeedback('Status uppdaterad!', 'success');
    } catch (err) {
      showGlobalFeedback && showGlobalFeedback('Kunde inte uppdatera status i Firestore', 'error');
    }
  };

  return (
    <>
      <ReactCanvasConfetti
        onInit={({ confetti }) => { confettiRef.current = confetti; }}
        className="pointer-events-none fixed inset-0 w-screen h-screen z-[9999]"
        style={{ position: 'fixed', pointerEvents: 'none', width: '100vw', height: '100vh', top: 0, left: 0, zIndex: 9999 }}
      />
      <div style={{  height: "hidden" }} className="flex flex-col flex-1 h-full">
        <div
          className="max-w-6xl w-full mx-auto py-14 px-2 sm:px-4 lg:px-8 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-lg rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.10)] mt-8 relative flex flex-col h-full flex-1"
          style={{ overflowY: 'auto' }}
        >
          {/* Rubrik och plus-knapp på samma rad */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100" style={{ fontFamily: 'SF Pro Display, Inter, sans-serif' }}>Min Bucketlist</h1>
            <button
              className="rounded-full p-3 bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 shadow-lg hover:shadow-2xl border border-slate-200 dark:border-slate-700 text-accent hover:bg-orange-500 transition-all duration-150 focus:outline-none ml-4 hover:scale-110 transition-transform"
              style={{ boxShadow: '0 6px 24px 0 rgba(0,0,0,0.10)' }}
              onClick={handleAddNew}
              aria-label="Lägg till bucket"
            >
              <span className="text-3xl leading-none text-slate-800 dark:text-white">＋</span>
            </button>
          </div>
          {buckets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="text-7xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 block text-accent dark:text-accent" aria-label="bucket-list-target">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <span className="text-xl font-light text-center" style={{ fontFamily: 'SF Pro Display, Inter, sans-serif' }}>Din bucket list är tom.<br />Klicka på <span className='text-accent'>＋</span> för att lägga till!</span>
            </div>
          )}
          {/* Scrollbar på själva listan */}
          {buckets.length > 0 && (
            <div ref={listWrapperRef} className="flex-1 flex flex-col gap-4 max-h-full overflow-y-auto no-scrollbar pr-2 pt-2">
              {buckets.map(bucket => {
                const achieved = bucket.status === 'done';
                return (
                  <div
                    key={bucket.id}
                    className={[
                      "relative flex items-center bg-card-bg dark:bg-dark-bg rounded-2xl p-4 min-h-[72px] group overflow-visible flex-shrink-0 transition-shadow",
                      "shadow-lg hover:shadow-2xl"
                    ].join(' ')}
                    style={bucket.status === 'done'
                      ? { boxShadow: '0 8px 24px -8px rgba(34,255,110,0.25), 0 4px 16px -8px rgba(0,0,0,0.10)' }
                      : { boxShadow: '0 4px 16px -8px rgba(0,0,0,0.10)' }
                    }
                  >
                    {/* Ikon till vänster */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mr-4 overflow-hidden">
                      {bucket.imageUrl && bucket.imageUrl !== 'target' ? (
                        <img src={bucket.imageUrl} alt="Bucket" className="w-12 h-12 object-cover rounded-full" />
                      ) : (
                        <span className="text-2xl">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 block text-accent dark:text-accent" aria-label="bucket-list-target">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {/* Innehåll i mitten */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" style={{ fontFamily: 'SF Pro Display, Inter, sans-serif' }}>{bucket.title}</span>
                          {bucket.priority && (
                            <span className={
                              bucket.priority === 'high'
                                ? 'bg-red-100 text-red-500 px-2.5 py-1 rounded-full text-xs font-medium flex items-center'
                                : bucket.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-600 px-2.5 py-1 rounded-full text-xs font-medium flex items-center'
                                : 'bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-xs font-medium flex items-center'
                            }>
                              {bucket.priority === 'high' && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l2.39 6.955h7.305l-5.902 4.29 2.39 6.955L10 15.91l-5.902 4.29 2.39-6.955-5.902-4.29h7.305z" /></svg>}
                              {bucket.priority === 'medium' && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>}
                              {bucket.priority === 'low' && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" /></svg>}
                              {bucket.priority === 'high' ? 'Hög' : bucket.priority === 'medium' ? 'Medel' : 'Låg'}
                            </span>
                          )}
                        </div>
                        {/* Statusknapp direkt på kortet */}
                        <button
                          ref={el => { statusBtnRefs.current[bucket.id] = el; }}
                          className={
                            achieved
                              ? 'bg-green-100 text-green-600 px-2.5 py-1 rounded-full text-xs font-medium flex items-center border border-green-300 dark:border-green-700'
                              : 'bg-slate-200 text-slate-500 px-2.5 py-1 rounded-full text-xs font-medium flex items-center border border-slate-300 dark:border-slate-700'
                          }
                          style={{letterSpacing:0.1, marginLeft:8, whiteSpace:'nowrap'}}
                          onClick={() => {
                            // Mät position relativt scrollcontainern
                            const btn = statusBtnRefs.current[bucket.id];
                            const wrapper = listWrapperRef.current;
                            if (btn && wrapper) {
                              const btnRect = btn.getBoundingClientRect();
                              const wrapperRect = wrapper.getBoundingClientRect();
                              const spaceBelow = wrapperRect.bottom - btnRect.bottom;
                              setPopupPosition(spaceBelow < 120 ? 'top' : 'bottom');
                            } else if (btn) {
                              // fallback till window
                              const rect = btn.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              setPopupPosition(spaceBelow < 120 ? 'top' : 'bottom');
                            }
                            setStatusMenuId(bucket.id);
                            scrollStatusBtnIntoView(bucket.id);
                          }}
                        >
                          {achieved
                            ? (<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" /></svg>)
                            : (<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" /></svg>)}
                          {achieved ? 'Klar' : 'Ej uppnådd'}
                        </button>
                        {/* Statusval popup direkt på kortet */}
                        {statusMenuId === bucket.id && (
                          <div className={`absolute right-4 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-4 w-60 flex flex-col gap-3 animate-fade-in ${popupPosition === 'top' ? 'bottom-10' : 'top-10'}`} style={{ marginTop: 10, marginBottom: 10 }}>
                            <button
                              className="absolute top-2 right-2 text-slate-400 hover:text-accent text-lg px-2 py-1 rounded focus:outline-none"
                              style={{ zIndex: 2 }}
                              onClick={() => setStatusMenuId(null)}
                              aria-label="Stäng statusval"
                            >×</button>
                            <div className="flex flex-col gap-2 px-4 mt-4">
                              <button
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all text-base font-semibold
                                  ${bucket.status === 'todo'
                                    ? 'bg-accent/10 text-accent ring-2 ring-accent'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                  }`}
                                onClick={() => { setStatusMenuId(null); handleSetStatus(bucket.id, 'todo'); }}
                              >
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-accent text-xl">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="7" /></svg>
                                </span>
                                <span>
                                  Ej uppnådd
                                  <div className="text-xs font-normal text-slate-500 dark:text-slate-400">Målet är inte klart än</div>
                                </span>
                              </button>
                              <button
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all text-base font-semibold
                                  ${bucket.status === 'done'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 ring-2 ring-green-400'
                                    : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-700 dark:text-slate-200'
                                  }`}
                                onClick={() => { setStatusMenuId(null); handleSetStatus(bucket.id, 'done'); }}
                              >
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 text-green-600 text-xl">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" /></svg>
                                </span>
                                <span>
                                  Klar
                                  <div className="text-xs font-normal text-green-600 dark:text-green-400">Du har uppnått målet!</div>
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {bucket.deadline && (
                          <span className="text-xs text-slate-500">Due Date: {bucket.deadline}</span>
                        )}
                      </div>
                      {bucket.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-light truncate">{bucket.description}</p>}
                      {bucket.checklist && (
                        <ul className="pl-0 mt-2">
                          {bucket.checklist.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 mb-1">
                              <button
                                className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs mr-1 bg-white dark:bg-dark-bg"
                                onClick={() => handleToggleChecklist(bucket.id, idx)}
                                aria-label={item.done ? 'Markera som ej klar' : 'Markera som klar'}
                              >
                                {item.done ? <span className="text-green-500">✔</span> : ''}
                              </button>
                              <span className={item.done ? 'line-through text-green-500' : 'text-slate-700 dark:text-slate-200'}>{item.text}</span>
                              <button
                                className="ml-2 text-xs text-red-400 hover:text-red-600"
                                onClick={() => handleRemoveChecklistItem(bucket.id, idx)}
                                aria-label="Ta bort checklist-punkt"
                              >✕</button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {/* Lägg till checklist-item */}
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const input = form.elements.namedItem('newChecklist') as HTMLInputElement;
                          if (input.value.trim()) {
                            handleAddChecklistItem(bucket.id, input.value.trim());
                            input.value = '';
                          }
                        }}
                        className="flex gap-2 mt-2"
                      >
                        <input
                          name="newChecklist"
                          type="text"
                          placeholder="Ny punkt..."
                          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs bg-white dark:bg-dark-bg"
                        />
                        <button type="submit" className="px-2 py-1 rounded bg-accent/80 text-white text-xs shadow-none hover:bg-accent/90 min-w-0">Lägg till</button>
                      </form>
                    </div>
                    {/* Status-badge */}
                    <div className="flex flex-col items-end ml-4">
                      {/* Context menu */}
                      <div className="mt-2">
                        <button
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-accent text-base focus:outline-none relative"
                          aria-label="Visa åtgärder"
                          onClick={() => setMenuOpenId(menuOpenId === bucket.id ? null : bucket.id)}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                        </button>
                        {menuOpenId === bucket.id && (
                          <div ref={menuRef} className="absolute right-0 mt-2 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 w-44 flex flex-col animate-fade-in">
                            <button
                              className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-base"
                              onClick={() => { setMenuOpenId(null); handleEdit(bucket); }}
                            >✏️ Redigera</button>
                            {/* Statusval popup */}
                            {statusMenuId === bucket.id && (
                              <div className="absolute right-0 mt-2 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 w-44 flex flex-col animate-fade-in">
                                <button
                                  className={`w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-base ${bucket.status === 'todo' ? 'font-bold text-accent' : ''}`}
                                  onClick={() => { setStatusMenuId(null); handleSetStatus(bucket.id, 'todo'); }}
                                >● Ej påbörjad</button>
                                <button
                                  className={`w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-base ${bucket.status === 'done' ? 'font-bold text-accent' : ''}`}
                                  onClick={() => { setStatusMenuId(null); handleSetStatus(bucket.id, 'done'); }}
                                >● Klar</button>
                              </div>
                            )}
                            <button
                              className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-danger text-base"
                              onClick={() => { setMenuOpenId(null); handleDelete(bucket.id); }}
                            >🗑️ Ta bort</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Modal för ny bucket och redigera bucket */}
      <BucketModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalInitialValues(undefined); }}
        onSave={handleModalSave}
        initialValues={modalInitialValues}
      />
    </>
  );
}; 
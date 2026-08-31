import React from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, FileText, Calendar, Tag as TagIcon } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { JournalNote } from '../../types';

interface JournalTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JournalTrashModal: React.FC<JournalTrashModalProps> = ({ isOpen, onClose }) => {
  const { notes, updateNote, deleteNote, addToast, theme } = useTrading();
  const isLight = theme === 'light';

  const deletedNotes = notes.filter(n => n.isDeleted);

  const handleRestore = (note: JournalNote) => {
    updateNote({
      ...note,
      isDeleted: false,
      deletedAt: undefined,
    });
    addToast('Note Restored', `Restored "${note.title}"`, 'success');
  };

  const handlePermanentDelete = (id: string, title: string) => {
    deleteNote(id);
    addToast('Note Permanently Deleted', `"${title}" has been purged`, 'info');
  };

  const handleEmptyTrash = () => {
    if (deletedNotes.length === 0) return;
    deletedNotes.forEach(n => deleteNote(n.id));
    addToast('Trash Emptied', `Purged ${deletedNotes.length} notes permanently`, 'info');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900'
            : 'bg-[#0B0F19] border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isLight ? 'border-zinc-200 bg-zinc-50' : 'border-slate-800/90 bg-[#0E1322]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Recently Deleted
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {deletedNotes.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Deleted journal entries are stored here. You can restore or purge them.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deletedNotes.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 font-semibold transition"
              >
                Empty Trash
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
          {deletedNotes.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Trash is Empty</p>
              <p className="text-xs text-slate-500">No recently deleted journal notes found.</p>
            </div>
          ) : (
            deletedNotes.map(note => (
              <div
                key={note.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200'
                    : 'bg-[#0E1322] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-200 truncate">{note.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {note.date}
                    </span>
                    {note.tags && note.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <TagIcon className="w-3 h-3 text-purple-400" />
                        {note.tags.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {note.content}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleRestore(note)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(note.id, note.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end px-6 py-3 border-t shrink-0 ${
          isLight ? 'border-zinc-200 bg-zinc-50' : 'border-slate-800/90 bg-[#0E1322]'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

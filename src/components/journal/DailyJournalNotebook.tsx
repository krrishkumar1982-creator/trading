import React, { useState } from 'react';
import {
  Plus,
  FolderPlus,
  Folder,
  FileText,
  BookOpen,
  Activity,
  Target,
  Compass,
  Layout,
  Tag,
  Trash2,
  Search,
  CheckSquare,
  Square,
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  List,
  Image as ImageIcon,
  Save,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Star,
  Check
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { JournalNote, JournalFolder } from '../../types';

const DEFAULT_FOLDER_NAMES: Record<string, string> = {
  'f-all': 'All notes',
  'f-trade': 'Trade Notes',
  'f-daily': 'Daily Journal',
  'f-sessions': 'Sessions Recap',
  'f-goals': 'Quarterly Goals 📅',
  'f-plan': 'Trading Plan 📈',
  'f-templates': 'Templates',
};

const renderFolderIcon = (iconName?: string, className = "w-3.5 h-3.5") => {
  switch (iconName) {
    case 'FileText': return <FileText className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Target': return <Target className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Layout': return <Layout className={className} />;
    case 'Tag': return <Tag className={className} />;
    case 'Star': return <Star className={className} />;
    default: return <Folder className={className} />;
  }
};

export const DailyJournalNotebook: React.FC = () => {
  const {
    notes,
    folders,
    selectedNote,
    setSelectedNote,
    selectedFolderId,
    setSelectedFolderId,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    deleteFolder,
    formatCurrency,
    trades,
    setSelectedTrade,
    setActiveView,
    addToast,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);

  // Folder note count calculator
  const getFolderCount = (folderId: string) => {
    if (folderId === 'f-all') return notes.length;
    return notes.filter(n => n.folderId === folderId).length;
  };

  // Tag note count calculator
  const getTagCount = (tagName: string) => {
    return notes.filter(n => n.tags?.includes(tagName)).length;
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleConfirmDeleteFolder = () => {
    if (!folderToDelete) return;
    deleteFolder(folderToDelete.id);
    setFolderToDelete(null);
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesFolder = selectedFolderId === 'f-all' || note.folderId === selectedFolderId;
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesTag && matchesSearch;
  });

  const handleCreateNewNote = (templateTitle = 'New Trading Journal Note') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newNote = addNote({
      accountId: 'acc-1',
      date: todayStr,
      title: `MES : ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      folderId: selectedFolderId === 'f-all' ? 'f-trade' : selectedFolderId,
      tags: ['Futures', 'A+ Setup'],
      content: `### Pre-Market Thesis\nKey levels marked. Watching for opening range breakout.\n\n### Execution Review\nExecuted with discipline according to playbook rules.`,
      preMarketPlan: {
        bias: 'BULLISH',
        keyLevels: 'Support: 5635 | Resistance: 5670',
        newsEvents: 'None high impact today',
        maxRiskPerTrade: '$350',
        checklist: [
          { id: 'c1', text: 'Checked Economic Calendar for high impact news', checked: true },
          { id: 'c2', text: 'Identified major 4H and 15m support/resistance', checked: true },
          { id: 'c3', text: 'Pre-defined exact Stop Loss & Take Profit', checked: true },
          { id: 'c4', text: 'Risk per trade capped under 1.5%', checked: true },
        ],
      },
      postMarketReview: {
        whatWentWell: 'Followed stop loss without moving it. Patient entry.',
        whatWentWrong: 'Could have scaled 2nd unit slightly further.',
        lessonsLearned: 'Let runners work when market orderflow continues in our favor.',
        disciplineRating: 5,
        emotionalRating: 5,
        executionGrade: 'A+',
      },
      contractsTraded: 5,
      volume: 5,
      netPnl: 550.00,
      netRoi: 1.10,
      screenshots: [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
      ],
      templateUsed: templateTitle,
      isFavorite: false,
    });
  };

  const handleToggleChecklist = (checkId: string) => {
    if (!selectedNote) return;
    const updated = {
      ...selectedNote,
      preMarketPlan: {
        ...selectedNote.preMarketPlan,
        checklist: selectedNote.preMarketPlan.checklist.map(item =>
          item.id === checkId ? { ...item, checked: !item.checked } : item
        ),
      },
    };
    updateNote(updated);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim() || !selectedNote) return;
    if (!selectedNote.tags.includes(newTagInput.trim())) {
      updateNote({
        ...selectedNote,
        tags: [...selectedNote.tags, newTagInput.trim()],
      });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedNote) return;
    updateNote({
      ...selectedNote,
      tags: selectedNote.tags.filter(t => t !== tagToRemove),
    });
  };

  const handleApplyTemplate = (templateName: string) => {
    if (!selectedNote) return;
    let newContent = selectedNote.content;
    if (templateName === 'Pre-Market & Post-Session') {
      newContent = `### Pre-Market Plan\n- **HTF Bias:** Bullish above 5640\n- **Session Goals:** Max 2 quality trades, no overtrading.\n\n### Post-Market Review\n- **Execution Quality:** Followed rules strictly.\n- **Discipline Score:** 10/10`;
    } else if (templateName === 'Mindset & Psychology Assessment') {
      newContent = `### Mindset Check-in\n- **Sleep & Energy:** 8.5/10 well rested\n- **Emotional Baseline:** Calm, patient, detached from outcome\n- **Risk Protocol:** 1.0% max risk per trade. Circuit breaker active.`;
    }
    updateNote({
      ...selectedNote,
      content: newContent,
      templateUsed: templateName,
    });
    setIsTemplateModalOpen(false);
    addToast('Template Applied', templateName, 'success');
  };

  return (
    <div className={`flex h-[calc(100vh-4.1rem)] w-full overflow-hidden ${
      isLight ? 'bg-zinc-100/50 text-zinc-900' : 'bg-slate-950/20 text-slate-100'
    }`}>
      {/* LEFT COLUMN: Folders & Tags Navigation */}
      <div className={`journal-sidebar w-56 sm:w-64 shrink-0 border-r p-3.5 flex flex-col justify-between ${
        isLight ? 'border-zinc-200 bg-white' : 'border-slate-800/80 bg-slate-950/50'
      }`}>
        <div className="journal-sidebar-content space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1 custom-scrollbar">
          {/* Add Folder Action */}
          {isCreatingFolder ? (
            <form onSubmit={handleCreateFolderSubmit} className={`p-2.5 rounded-xl border shadow-lg space-y-2 ${
              isLight ? 'border-zinc-300 bg-white' : 'border-slate-700/80 bg-slate-900/90'
            }`}>
              <div className={`text-[11px] font-bold ${isLight ? 'text-zinc-800' : 'text-slate-200'}`}>New Folder Name</div>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Weekly Playbook"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 border ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                  className={`px-2 py-1 text-xs transition ${
                    isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white transition shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className={`journal-add-btn flex w-full items-center justify-center gap-2 rounded-xl border py-2 px-3 text-xs font-semibold transition shadow-xs group ${
                isLight
                  ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700'
                  : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/60 text-slate-100'
              }`}
            >
              <FolderPlus className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isLight ? 'text-blue-600' : 'text-indigo-400'
              }`} />
              <span>Add Folder</span>
            </button>
          )}

          {/* Folders List */}
          <div>
            <div className={`px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
              isLight ? 'text-zinc-500' : 'text-slate-300'
            }`}>
              <span>FOLDERS</span>
              <span className={`text-[9px] font-mono ${isLight ? 'text-zinc-400' : 'text-slate-400'}`}>{folders.length}</span>
            </div>
            <div className="space-y-0.5">
              {folders.map(folder => {
                const isActive = selectedFolderId === folder.id;
                const count = getFolderCount(folder.id);
                const folderName = folder.name || DEFAULT_FOLDER_NAMES[folder.id] || 'Folder';
                const isSystem = ['f-all', 'f-trade', 'f-daily', 'f-sessions', 'f-goals', 'f-plan', 'f-templates'].includes(folder.id);

                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setSelectedTag(null);
                    }}
                    className={`journal-folder-item group flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
                      isActive
                        ? isLight
                          ? 'active bg-blue-50/90 text-blue-900 font-bold border border-blue-300 shadow-xs'
                          : 'active bg-slate-800/80 text-white font-semibold border border-slate-700/80 shadow-sm'
                        : isLight
                          ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                          : 'text-slate-200 hover:bg-slate-800/50 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      {renderFolderIcon(
                        folder.icon,
                        `w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? isLight ? 'text-blue-600' : 'text-indigo-400'
                            : isLight ? 'text-zinc-400' : 'text-slate-400'
                        }`
                      )}
                      <span className={`truncate font-medium leading-tight ${
                        isActive
                          ? isLight ? 'text-blue-950 font-bold' : 'text-white'
                          : isLight ? 'text-zinc-700' : 'text-slate-100'
                      }`}>
                        {folderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isSystem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderToDelete({ id: folder.id, name: folderName });
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-0.5 transition ${
                            isLight ? 'text-zinc-400 hover:text-rose-600' : 'text-slate-400 hover:text-rose-400'
                          }`}
                          title="Delete folder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <span className={`journal-badge text-[10px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${
                        isActive
                          ? isLight
                            ? 'bg-blue-100 text-blue-700 border-blue-200 font-bold'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : isLight
                            ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            : 'bg-slate-900/80 text-slate-200 border-slate-700/80'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tags List */}
          <div>
            <div className={`px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-500' : 'text-slate-300'
            }`}>
              TAGS
            </div>
            <div className="space-y-0.5">
              {['FOMC', 'Equities', 'Futures', 'Forex', 'A+ Setup', 'Mistake'].map(tagName => {
                const isTagActive = selectedTag === tagName;
                const tagCount = getTagCount(tagName);

                return (
                  <button
                    key={tagName}
                    onClick={() => setSelectedTag(isTagActive ? null : tagName)}
                    className={`journal-folder-item flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition select-none ${
                      isTagActive
                        ? isLight
                          ? 'active bg-blue-50/90 text-blue-900 font-bold border border-blue-300 shadow-xs'
                          : 'active bg-indigo-600/20 text-indigo-200 font-semibold border border-indigo-500/30 shadow-sm'
                        : isLight
                          ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                          : 'text-slate-200 hover:bg-slate-800/50 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <Tag className={`w-3.5 h-3.5 shrink-0 ${
                        isTagActive
                          ? isLight ? 'text-blue-600' : 'text-indigo-400'
                          : isLight ? 'text-zinc-400' : 'text-slate-400'
                      }`} />
                      <span className={`truncate font-medium leading-tight ${
                        isTagActive
                          ? isLight ? 'text-blue-950 font-bold' : 'text-white'
                          : isLight ? 'text-zinc-700' : 'text-slate-100'
                      }`}>
                        {tagName}
                      </span>
                    </div>
                    <span className={`journal-badge text-[10px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${
                      isTagActive
                        ? isLight
                          ? 'bg-blue-100 text-blue-700 border-blue-200 font-bold'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : isLight
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          : 'bg-slate-900/80 text-slate-200 border-slate-700/80'
                    }`}>
                      {tagCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recently Deleted */}
        <div className={`border-t pt-3 mt-auto ${
          isLight ? 'border-zinc-200' : 'border-slate-800/80'
        }`}>
          <button
            onClick={() => addToast('Trash Bin', 'No permanently deleted notes', 'info')}
            className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg w-full transition ${
              isLight ? 'text-zinc-500 hover:text-rose-600 hover:bg-zinc-100' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Recently Deleted</span>
          </button>
        </div>
      </div>

      {/* MIDDLE COLUMN: Notes List */}
      <div className={`w-64 sm:w-72 shrink-0 border-r p-3 flex flex-col justify-between ${
        isLight ? 'border-zinc-200 bg-zinc-50/70' : 'border-slate-800/80 bg-slate-900/30'
      }`}>
        <div className="space-y-3">
          {/* New note button and search */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => handleCreateNewNote()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>New note</span>
            </button>
          </div>

          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${
              isLight ? 'text-zinc-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none border ${
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-blue-500'
                  : 'bg-slate-950/60 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-slate-600'
              }`}
            />
          </div>

          {/* Notes items list */}
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)] custom-scrollbar">
            {filteredNotes.map(note => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-blue-50/90 border-blue-300 text-zinc-900 shadow-xs'
                        : 'bg-slate-800/80 border-slate-600 text-white shadow-sm'
                      : isLight
                        ? 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold truncate flex-1 ${
                      isSelected
                        ? isLight ? 'text-blue-950' : 'text-white'
                        : isLight ? 'text-zinc-900' : 'text-slate-100'
                    }`}>
                      {note.title}
                    </h4>
                    {note.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0 ml-1" />}
                  </div>

                  {/* Net PnL badge */}
                  {note.netPnl !== undefined && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[11px] font-mono font-bold ${
                        note.netPnl >= 0
                          ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                          : isLight ? 'text-rose-600' : 'text-rose-400'
                      }`}>
                        NET P&L: {formatCurrency(note.netPnl)}
                      </span>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>{note.date}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tg, i) => (
                      <span key={i} className={`text-[9px] px-1.5 py-0.2 rounded border ${
                        isLight
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800'
                      }`}>
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className={`text-center py-12 text-xs ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
                No notes found in this view
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Rich Note Editor */}
      {selectedNote ? (
        <div className={`flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-6 ${
          isLight ? 'bg-white text-zinc-900' : 'bg-transparent text-slate-100'
        }`}>
          {/* Top Title & Header Stats */}
          <div className={`space-y-3 pb-4 border-b ${
            isLight ? 'border-zinc-200' : 'border-slate-800/80'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                type="text"
                value={selectedNote.title}
                onChange={e => updateNote({ ...selectedNote, title: e.target.value })}
                className={`text-lg sm:text-xl font-black bg-transparent border-b border-transparent focus:outline-none flex-1 ${
                  isLight
                    ? 'text-zinc-900 hover:border-zinc-300 focus:border-blue-500'
                    : 'text-white hover:border-slate-700 focus:border-slate-500'
                }`}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const matchedTrade = trades.find(t => t.symbol === selectedNote.title.split(' ')[0]);
                    if (matchedTrade) {
                      setSelectedTrade(matchedTrade);
                      setActiveView('trades');
                    } else {
                      setActiveView('trades');
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                    isLight
                      ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                      : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-white shadow-sm'
                  }`}
                >
                  <ExternalLink className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-indigo-400'}`} />
                  <span>View Trade Details</span>
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className={`p-1.5 rounded-lg transition ${
                    isLight ? 'text-zinc-400 hover:text-rose-600 hover:bg-zinc-100' : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                  }`}
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className={`grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded-xl border ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-200'
            }`}>
              <div>
                <div className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Net P&L</div>
                <div className={`text-sm font-mono font-extrabold ${
                  selectedNote.netPnl && selectedNote.netPnl >= 0
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                    : isLight ? 'text-rose-600' : 'text-rose-400'
                }`}>
                  {formatCurrency(selectedNote.netPnl || 0)}
                </div>
              </div>
              <div>
                <div className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Contracts Traded</div>
                <div className={`text-sm font-mono font-bold ${isLight ? 'text-zinc-900' : 'text-slate-200'}`}>{selectedNote.contractsTraded || 5}</div>
              </div>
              <div>
                <div className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Volume</div>
                <div className={`text-sm font-mono font-bold ${isLight ? 'text-zinc-900' : 'text-slate-200'}`}>{selectedNote.volume || 5}</div>
              </div>
              <div>
                <div className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Commissions</div>
                <div className={`text-sm font-mono font-bold ${isLight ? 'text-zinc-600' : 'text-slate-400'}`}>$12.50</div>
              </div>
              <div>
                <div className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Net ROI</div>
                <div className={`text-sm font-mono font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>+{selectedNote.netRoi || 1.10}%</div>
              </div>
              <div>
                <div className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Gross P&L</div>
                <div className={`text-sm font-mono font-bold ${isLight ? 'text-zinc-900' : 'text-slate-200'}`}>${((selectedNote.netPnl || 550) + 12.5).toFixed(2)}</div>
              </div>
            </div>

            {/* Template & Tags Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>Template:</span>
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                    isLight
                      ? 'text-zinc-800 bg-white hover:bg-zinc-50 border-zinc-300 shadow-xs'
                      : 'text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <Layout className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-indigo-400'}`} />
                  <span>{selectedNote.templateUsed || 'Pre-Market & Post-Session'}</span>
                  <ChevronDown className={`w-3 h-3 ${isLight ? 'text-zinc-400' : 'text-slate-400'}`} />
                </button>
              </div>

              {/* Tags Editor */}
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedNote.tags.map((tg, i) => (
                  <span
                    key={i}
                    className={`text-xs border px-2 py-0.5 rounded-lg flex items-center gap-1 group ${
                      isLight
                        ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        : 'bg-slate-900/60 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span>{tg}</span>
                    <button
                      onClick={() => handleRemoveTag(tg)}
                      className={`text-xs transition ${
                        isLight ? 'text-zinc-400 hover:text-rose-600' : 'text-slate-500 hover:text-rose-400'
                      }`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="+ Add tag"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    className={`w-20 rounded px-2 py-0.5 text-xs focus:outline-none border ${
                      isLight
                        ? 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-blue-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-slate-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WYSIWYG Formatting Toolbar */}
          <div className={`flex flex-wrap items-center gap-1 p-1.5 rounded-xl border ${
            isLight
              ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-300'
          }`}>
            <button className={`p-1.5 rounded transition ${isLight ? 'hover:bg-zinc-200/70 text-zinc-700' : 'hover:bg-slate-800/60'}`} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
            <button className={`p-1.5 rounded transition ${isLight ? 'hover:bg-zinc-200/70 text-zinc-700' : 'hover:bg-slate-800/60'}`} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
            <button className={`p-1.5 rounded transition ${isLight ? 'hover:bg-zinc-200/70 text-zinc-700' : 'hover:bg-slate-800/60'}`} title="Underline"><Underline className="w-3.5 h-3.5" /></button>
            <button className={`p-1.5 rounded transition ${isLight ? 'hover:bg-zinc-200/70 text-zinc-700' : 'hover:bg-slate-800/60'}`} title="Code"><Code className="w-3.5 h-3.5" /></button>
            <span className={`w-[1px] h-4 mx-1 ${isLight ? 'bg-zinc-300' : 'bg-slate-800'}`} />
            <button className={`p-1.5 rounded transition ${isLight ? 'hover:bg-zinc-200/70 text-zinc-700' : 'hover:bg-slate-800/60'}`} title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
            <button className={`p-1.5 rounded transition ${isLight ? 'hover:bg-zinc-200/70 text-zinc-700' : 'hover:bg-slate-800/60'}`} title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
            <button className={`p-1.5 rounded transition ${isLight ? 'hover:bg-zinc-200/70 text-zinc-700' : 'hover:bg-slate-800/60'}`} title="List"><List className="w-3.5 h-3.5" /></button>
            <span className={`w-[1px] h-4 mx-1 ${isLight ? 'bg-zinc-300' : 'bg-slate-800'}`} />
            <button
              onClick={() => {
                const sampleImg = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80';
                updateNote({
                  ...selectedNote,
                  screenshots: [...selectedNote.screenshots, sampleImg],
                });
                addToast('Image Attached', 'Chart screenshot added to gallery', 'success');
              }}
              className={`p-1.5 rounded flex items-center gap-1 text-xs transition ${
                isLight ? 'hover:bg-zinc-200/70 text-blue-600 font-semibold' : 'hover:bg-slate-800/60 text-indigo-400'
              }`}
              title="Attach Chart Screenshot"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Attach Chart</span>
            </button>
          </div>

          {/* Pre-Market Plan & Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checklist */}
            <div className={`p-4 rounded-xl border space-y-3 shadow-xs ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-200'
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-blue-700' : 'text-indigo-400'
              }`}>
                <CheckSquare className="w-4 h-4" />
                Pre-Market Checklist ✅
              </h4>
              <div className="space-y-2">
                {selectedNote.preMarketPlan.checklist.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`flex items-center gap-2.5 text-xs cursor-pointer transition ${
                      isLight ? 'text-zinc-700 hover:text-zinc-900' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.checked ? (
                      <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    ) : (
                      <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`} />
                    )}
                    <span className={item.checked ? (isLight ? 'line-through text-zinc-400' : 'line-through text-slate-500') : ''}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Levels & Bias */}
            <div className={`p-4 rounded-xl border space-y-3 shadow-xs ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-200'
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-800' : 'text-slate-200'
              }`}>
                Session Thesis & Bias
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className={isLight ? 'text-zinc-500' : 'text-slate-500'}>Market Bias: </span>
                  <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{selectedNote.preMarketPlan.bias}</strong>
                </div>
                <div>
                  <span className={isLight ? 'text-zinc-500' : 'text-slate-500'}>Key Levels: </span>
                  <span className={`font-mono ${isLight ? 'text-zinc-800' : 'text-slate-300'}`}>{selectedNote.preMarketPlan.keyLevels}</span>
                </div>
                <div>
                  <span className={isLight ? 'text-zinc-500' : 'text-slate-500'}>Risk Cap: </span>
                  <span className={`font-mono ${isLight ? 'text-zinc-800' : 'text-slate-300'}`}>{selectedNote.preMarketPlan.maxRiskPerTrade}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note Content Textarea */}
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-700' : 'text-slate-300'
            }`}>
              Trade Notes & Detailed Journal Log
            </label>
            <textarea
              rows={8}
              value={selectedNote.content}
              onChange={e => updateNote({ ...selectedNote, content: e.target.value })}
              className={`w-full rounded-xl p-4 text-xs font-mono leading-relaxed focus:outline-none custom-scrollbar border ${
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500 placeholder-zinc-400'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-200 focus:border-slate-600 placeholder-slate-500'
              }`}
              placeholder="Write your comprehensive pre-market thoughts, in-trade emotions, and post-session learnings..."
            />
          </div>

          {/* Screenshot Gallery */}
          {(selectedNote.screenshots?.length || 0) > 0 && (
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-700' : 'text-slate-300'
              }`}>
                Chart Images & Execution Setup
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedNote.screenshots.map((src, i) => (
                  <div key={i} className={`relative rounded-xl overflow-hidden border group ${
                    isLight ? 'border-zinc-200' : 'border-slate-800'
                  }`}>
                    <img src={src} alt="Chart" className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] ${
                      isLight ? 'bg-white/90 text-zinc-800 shadow-sm border border-zinc-200' : 'bg-slate-950/80 text-slate-300'
                    }`}>
                      Chart Screenshot #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center ${
          isLight ? 'bg-white text-zinc-400' : 'text-slate-500'
        }`}>
          <BookOpen className="w-12 h-12 mb-3 opacity-25" />
          <p className="text-sm">Select or create a note to view and edit journal</p>
        </div>
      )}

      {/* Template Selector Modal */}
      {isTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTemplateModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl space-y-4 ${
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-zinc-200' : 'border-slate-800'
            }`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${
                isLight ? 'text-zinc-900' : 'text-slate-100'
              }`}>
                <Layout className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-indigo-400'}`} />
                Select a Notebook Template
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className={`text-xs transition ${
                  isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              {[
                { title: 'Pre-Market & Post-Session', desc: 'Checklists for key levels, risk caps, and post-market execution reviews.' },
                { title: 'Intra-day Check-in 🚀', desc: 'Mid-session emotional recalibration and orderflow assessment.' },
                { title: 'All-in-One Daily Journal', desc: 'Comprehensive template combining HTF analysis, checklist, and psychological ratings.' },
                { title: 'Mindset Assessment 🧠', desc: 'Energy, sleep, cognitive bias check, and discipline guardrails.' },
                { title: 'Quarterly Roadmap 📈', desc: 'Long-term P&L compounding targets, max drawdown limits, and asset allocations.' },
              ].map(t => (
                <div
                  key={t.title}
                  onClick={() => handleApplyTemplate(t.title)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                    isLight
                      ? 'bg-zinc-50/80 border-zinc-200 hover:border-blue-300 hover:bg-blue-50/40'
                      : 'bg-slate-950 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <div>
                    <h5 className={`text-xs font-bold transition ${
                      isLight ? 'text-zinc-900 group-hover:text-blue-700' : 'text-slate-200 group-hover:text-indigo-400'
                    }`}>{t.title}</h5>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>{t.desc}</p>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 shadow-xs">
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Folder Delete Confirmation Modal */}
      {folderToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFolderToDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4 ${
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <h3 className={`text-sm font-bold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>Delete Folder "{folderToDelete.name}"?</h3>
            <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-slate-400'}`}>
              Notes in this folder will not be deleted. They will be reassigned to <strong>Daily Journal</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFolderToDelete(null)}
                className={`px-3 py-1.5 text-xs transition ${
                  isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteFolder}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition shadow-sm"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Folder as FolderIcon,
  BookOpen,
  Tag as TagIcon,
  Calendar,
  Clock,
  Star,
  Edit3,
  Trash2,
  MoreHorizontal,
  Paperclip,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ExternalLink,
  Download,
  Share2,
  Copy,
  ChevronRight,
  FolderPlus,
  CheckCircle2,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  Eye,
  Maximize2,
  FolderOpen
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { JournalNote, JournalFolder, JournalAttachment } from '../../types';
import { JournalNoteModal } from './JournalNoteModal';
import { JournalTrashModal } from './JournalTrashModal';
import { SupabaseStorageService } from '../../services/supabaseStorage';

export const DailyJournalNotebook: React.FC = () => {
  const {
    notes,
    folders,
    trades,
    addFolder,
    deleteFolder,
    updateNote,
    deleteNote,
    addNote,
    addToast,
    formatCurrency,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  // State management
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f-all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'favorites' | 'trades' | 'mistakes'>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('note-fomc-reaction');
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [noteToEdit, setNoteToEdit] = useState<JournalNote | null>(null);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState<boolean>(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // File upload ref for attachment drag-and-drop
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);

  // Filter out soft-deleted notes for the active view
  const activeNotes = useMemo(() => {
    return notes.filter(n => !n.isDeleted);
  }, [notes]);

  const deletedCount = useMemo(() => {
    return notes.filter(n => n.isDeleted).length;
  }, [notes]);

  // Dynamic tags list with real counts
  const allTagsWithCounts = useMemo(() => {
    const tagMap = new Map<string, number>();
    activeNotes.forEach(n => {
      if (n.tags && Array.isArray(n.tags)) {
        n.tags.forEach(t => {
          tagMap.set(t, (tagMap.get(t) || 0) + 1);
        });
      }
    });

    // Ensure reference image standard tags exist in view even with 0 counts if not yet added
    const standardTags = ['FOMC', 'Equities', 'Futures', 'Forex', 'A+ Setup', 'Mistake'];
    standardTags.forEach(st => {
      if (!tagMap.has(st)) {
        tagMap.set(st, 0);
      }
    });

    return Array.from(tagMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [activeNotes]);

  // Dynamic folder counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach(f => {
      counts[f.id] = activeNotes.filter(n => n.folderId === f.id).length;
    });
    return counts;
  }, [folders, activeNotes]);

  // Overall Stats
  const totalNotesCount = activeNotes.length;
  const totalTagsCount = allTagsWithCounts.reduce((sum, t) => sum + (t.count > 0 ? t.count : 0), 0);
  const winningTradesCount = activeNotes.filter(n => n.resultR && n.resultR.startsWith('+')).length;

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return activeNotes.filter(note => {
      // Folder filter
      if (selectedFolderId !== 'f-all' && note.folderId !== selectedFolderId) {
        return false;
      }

      // Tag filter
      if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) {
        return false;
      }

      // Quick filter
      if (quickFilter === 'favorites' && !note.isFavorite) return false;
      if (quickFilter === 'trades' && !note.tradeId && !note.symbol) return false;
      if (quickFilter === 'mistakes' && (!note.tags || !note.tags.includes('Mistake'))) return false;
      if (quickFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (note.date !== todayStr) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = note.title.toLowerCase().includes(q);
        const inContent = note.content.toLowerCase().includes(q);
        const inTags = note.tags?.some(t => t.toLowerCase().includes(q));
        const inSymbol = note.symbol?.toLowerCase().includes(q);
        const inSetup = note.setup?.toLowerCase().includes(q);
        if (!inTitle && !inContent && !inTags && !inSymbol && !inSetup) {
          return false;
        }
      }

      return true;
    });
  }, [activeNotes, selectedFolderId, selectedTag, quickFilter, searchQuery]);

  // Current active note
  const currentNote = useMemo(() => {
    if (selectedNoteId) {
      const found = activeNotes.find(n => n.id === selectedNoteId);
      if (found) return found;
    }
    return filteredNotes[0] || activeNotes[0] || null;
  }, [selectedNoteId, activeNotes, filteredNotes]);

  // Group notes by relative time (Today, Yesterday, Older)
  const groupedNotes = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const groups: { label: string; notes: JournalNote[] }[] = [
      { label: 'Today', notes: [] },
      { label: 'Yesterday', notes: [] },
      { label: 'Older', notes: [] },
    ];

    filteredNotes.forEach(note => {
      if (note.date === todayStr || note.time === '6:30 PM' || note.time === '8:15 AM') {
        groups[0].notes.push(note);
      } else if (note.date === yesterdayStr || note.time === 'Yesterday') {
        groups[1].notes.push(note);
      } else {
        groups[2].notes.push(note);
      }
    });

    return groups.filter(g => g.notes.length > 0);
  }, [filteredNotes]);

  // Handlers
  const handleToggleFavorite = (note: JournalNote) => {
    updateNote({
      ...note,
      isFavorite: !note.isFavorite,
    });
    addToast(
      note.isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      note.title,
      'info'
    );
  };

  const handleSoftDelete = (note: JournalNote) => {
    updateNote({
      ...note,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
    addToast('Note Moved to Trash', `"${note.title}" can be restored from Recently Deleted`, 'warning');
    // Select next note
    const remaining = activeNotes.filter(n => n.id !== note.id);
    if (remaining.length > 0) {
      setSelectedNoteId(remaining[0].id);
    }
  };

  const handleOpenEdit = (note: JournalNote) => {
    setNoteToEdit(note);
    setIsNoteModalOpen(true);
  };

  const handleOpenNewNote = () => {
    setNoteToEdit(null);
    setIsNoteModalOpen(true);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newId = `f-${Date.now()}`;
    addFolder(newFolderName.trim(), 'Folder');
    setNewFolderName('');
    setIsAddFolderModalOpen(false);
    setSelectedFolderId(newId);
    addToast('Folder Created', newFolderName.trim(), 'success');
  };

  const handleDuplicateNote = (note: JournalNote) => {
    const duplicated: Omit<JournalNote, 'id'> = {
      ...note,
      title: `${note.title} (Copy)`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      isDeleted: false,
    };
    addNote(duplicated);
    setShowMoreMenu(false);
    addToast('Note Duplicated', duplicated.title, 'success');
  };

  const handleExportMarkdown = (note: JournalNote) => {
    const markdownContent = `# ${note.title}
Date: ${note.date} ${note.time || ''}
Tags: ${note.tags?.join(', ') || 'None'}
Symbol: ${note.symbol || 'N/A'}
Side: ${note.side || 'N/A'}
Result: ${note.resultR || 'N/A'}

## Thesis & Log
${note.content}
`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMoreMenu(false);
    addToast('Exported to Markdown', note.title, 'info');
  };

  // Direct Attachment Upload onto current note
  const handleUploadFilesToCurrentNote = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentNote) return;

    setIsUploadingAttachment(true);
    try {
      const existingAttachments = currentNote.attachments || [];
      const newAtts: JournalAttachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileUrl = '';
        try {
          fileUrl = await SupabaseStorageService.uploadJournalScreenshot(file, currentNote.id);
        } catch {
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        newAtts.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          url: fileUrl,
          type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
          size: file.size,
          date: new Date().toISOString().split('T')[0],
        });
      }

      const updated = {
        ...currentNote,
        attachments: [...existingAttachments, ...newAtts],
        screenshots: [
          ...(currentNote.screenshots || []),
          ...newAtts.filter(a => a.type === 'image').map(a => a.url),
        ],
      };

      updateNote(updated);
      addToast('Attachment Added', `${newAtts.length} file(s) attached to note`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast('Upload Error', 'Could not upload attachment', 'error');
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const handleRemoveAttachmentFromNote = (attId: string) => {
    if (!currentNote) return;
    const updatedAtts = (currentNote.attachments || []).filter(a => a.id !== attId);
    const updatedScreenshots = updatedAtts.filter(a => a.type === 'image').map(a => a.url);
    updateNote({
      ...currentNote,
      attachments: updatedAtts,
      screenshots: updatedScreenshots,
    });
    addToast('Attachment Removed', 'File deleted from note', 'info');
  };

  // Helper styling for tag pills
  const getTagBadgeStyle = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'fomc':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/60';
      case 'plan':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'mistake':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
      case 'a+ setup':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
      case 'equities':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'futures':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60';
      case 'forex':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60';
      default:
        return 'bg-slate-900/60 text-slate-300 border-slate-800';
    }
  };

  return (
    <div
      id="daily-journal-workspace"
      className={`h-[calc(100vh-4rem)] flex flex-col overflow-hidden font-sans transition-colors duration-200 ${
        isLight ? 'bg-zinc-50 text-zinc-900' : 'bg-[#090C12] text-slate-100'
      }`}
    >
      {/* Primary 3-Panel Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* ========================================================================= */}
        {/* PANEL 1: LEFT SIDEBAR (Folders, Tags, Journal Stats, Recently Deleted)  */}
        {/* ========================================================================= */}
        <aside
          id="journal-left-sidebar"
          className={`w-full md:w-56 lg:w-60 shrink-0 border-r flex flex-col justify-between overflow-y-auto custom-scrollbar p-3 space-y-4 ${
            isLight
              ? 'bg-white border-zinc-200'
              : 'bg-[#0B0E17] border-slate-800/80'
          }`}
        >
          <div className="space-y-4">
            {/* + Add Folder Button */}
            <button
              id="btn-add-folder"
              onClick={() => setIsAddFolderModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl border border-indigo-500/40 hover:border-indigo-400 bg-slate-900/70 hover:bg-slate-900 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ Add Folder</span>
            </button>

            {/* Folders Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  FOLDERS
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {folders.length + 1}
                </span>
              </div>

              {/* "All Notes" item */}
              <button
                onClick={() => {
                  setSelectedFolderId('f-all');
                  setSelectedTag(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                  selectedFolderId === 'f-all' && !selectedTag
                    ? 'bg-indigo-600/20 text-white font-semibold border border-indigo-500/30'
                    : isLight
                      ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">All Notes</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                    selectedFolderId === 'f-all' && !selectedTag
                      ? 'bg-indigo-900/50 text-indigo-200 border-indigo-700/50'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800'
                  }`}
                >
                  {totalNotesCount}
                </span>
              </button>

              {/* Dynamic Folders */}
              {folders.map(f => {
                const count = folderCounts[f.id] || 0;
                const isSelected = selectedFolderId === f.id && !selectedTag;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFolderId(f.id);
                      setSelectedTag(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      isSelected
                        ? 'bg-indigo-600/20 text-white font-semibold border border-indigo-500/30'
                        : isLight
                          ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-indigo-900/50 text-indigo-200 border-indigo-700/50'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tags Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  TAGS
                </span>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {allTagsWithCounts.map(({ name, count }) => {
                const isSelected = selectedTag === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      if (isSelected) setSelectedTag(null);
                      else setSelectedTag(name);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      isSelected
                        ? 'bg-purple-950/70 text-purple-200 font-semibold border border-purple-600/50'
                        : isLight
                          ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TagIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-purple-900/60 text-purple-200 border-purple-700'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Sidebar: Journal Stats Card & Trash */}
          <div className="space-y-3 pt-2">
            {/* Journal Stats Card */}
            <div
              id="card-journal-stats"
              className={`p-3 rounded-xl border space-y-2.5 ${
                isLight
                  ? 'bg-zinc-100/80 border-zinc-200'
                  : 'bg-[#0E1322] border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Journal Stats</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[#080B14]/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Total Notes</span>
                  <span className="text-sm font-bold text-white font-mono">{totalNotesCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#080B14]/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Total Tags</span>
                  <span className="text-sm font-bold text-white font-mono">{totalTagsCount}</span>
                </div>
              </div>
            </div>

            {/* Recently Deleted (Trash Bin) */}
            <button
              id="btn-recently-deleted"
              onClick={() => setIsTrashModalOpen(true)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition border ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600'
                  : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Recently Deleted</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                {deletedCount}
              </span>
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* PANEL 2: MIDDLE NOTES LIST (Search, New Note, Grouped List, Active Card)  */}
        {/* ========================================================================= */}
        <section
          id="journal-middle-notes-list"
          className={`w-full md:w-80 lg:w-96 shrink-0 border-r flex flex-col overflow-hidden ${
            isLight
              ? 'bg-zinc-50/50 border-zinc-200'
              : 'bg-[#090C14] border-slate-800/80'
          }`}
        >
          {/* Top Actions: + New Note & Search Bar */}
          <div className="p-3.5 space-y-2.5 border-b border-slate-800/70 shrink-0">
            {/* + New Note Button (Electric Blue / Purple Gradient) */}
            <button
              id="btn-new-note"
              onClick={handleOpenNewNote}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Note</span>
            </button>

            {/* Search and Filters */}
            <div className="flex items-center gap-2 relative">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none border transition ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900 focus:border-blue-500'
                      : 'bg-[#0E1322] border-slate-800/90 text-white placeholder-slate-500 focus:border-indigo-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`p-2 rounded-xl border transition ${
                    quickFilter !== 'all'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : isLight
                        ? 'bg-white border-zinc-200 text-zinc-600'
                        : 'bg-[#0E1322] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Filter options"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                {showFilterMenu && (
                  <div
                    className="absolute right-0 mt-1 w-44 rounded-xl border bg-[#0E1322] border-slate-800 shadow-xl py-1.5 z-30 text-xs text-slate-200"
                    onMouseLeave={() => setShowFilterMenu(false)}
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Filters
                    </div>
                    {[
                      { key: 'all', label: 'All Notes' },
                      { key: 'today', label: "Today's Notes" },
                      { key: 'favorites', label: 'Starred Favorites' },
                      { key: 'trades', label: 'With Trade Data' },
                      { key: 'mistakes', label: 'Mistake Reviews' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => {
                          setQuickFilter(f.key as any);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-800 transition ${
                          quickFilter === f.key ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <span>{f.label}</span>
                        {quickFilter === f.key && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grouped Notes List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
            {groupedNotes.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">No notes found</p>
                <p className="text-[11px] text-slate-500">
                  Try adjusting your search query, folder, or tag filters.
                </p>
              </div>
            ) : (
              groupedNotes.map(group => (
                <div key={group.label} className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 px-1 pt-1 tracking-wide">
                    {group.label}
                  </div>

                  <div className="space-y-2">
                    {group.notes.map(note => {
                      const isSelected = currentNote?.id === note.id;
                      return (
                        <div
                          key={note.id}
                          id={`note-card-${note.id}`}
                          onClick={() => setSelectedNoteId(note.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 relative space-y-2 ${
                            isSelected
                              ? 'bg-[#121829] border-purple-500/80 shadow-md shadow-purple-950/30 ring-1 ring-purple-500/40'
                              : isLight
                                ? 'bg-white hover:bg-zinc-100/70 border-zinc-200'
                                : 'bg-[#0D111D]/80 hover:bg-[#111728] border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          {/* Top Row: Title + Time */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-bold text-white truncate leading-snug">
                              {note.title}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-mono shrink-0">
                              {note.time || note.date}
                            </span>
                          </div>

                          {/* Excerpt */}
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-normal">
                            {note.content}
                          </p>

                          {/* Footer Tags & Trade Metric Pills */}
                          <div className="flex items-center justify-between gap-1.5 pt-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {note.tags && note.tags.slice(0, 2).map(tag => (
                                <span
                                  key={tag}
                                  className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${getTagBadgeStyle(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {note.tags && note.tags.length > 2 && (
                                <span className="text-[10px] text-slate-500">
                                  +{note.tags.length - 2}
                                </span>
                              )}
                            </div>

                            {/* Result Pill if available */}
                            {note.resultR && (
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                                  note.resultR.startsWith('+')
                                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                                    : 'bg-rose-950/50 text-rose-400 border-rose-800/50'
                                }`}
                              >
                                {note.resultR}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Note Count Footer */}
          <div className="py-2.5 px-3 border-t border-slate-800/70 text-center shrink-0">
            <span className="text-[11px] text-slate-400">
              Showing {filteredNotes.length} of {activeNotes.length} notes
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PANEL 3: RIGHT PANEL (Selected Note Details, Trade Summary, Attachments)  */}
        {/* ========================================================================= */}
        <main
          id="journal-right-detail-panel"
          className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 ${
            isLight ? 'bg-white' : 'bg-[#080B12]'
          }`}
        >
          {currentNote ? (
            <>
              {/* Header: Title, Star, Edit, Delete, More Actions */}
              <div className="space-y-3 pb-2 border-b border-slate-800/70">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                      {currentNote.title}
                    </h1>
                    <button
                      onClick={() => handleToggleFavorite(currentNote)}
                      className="p-1 rounded-lg hover:bg-slate-800/80 transition text-slate-500 hover:text-amber-400"
                      title={currentNote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          currentNote.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions (Edit, Delete, More) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id="btn-edit-current-note"
                      onClick={() => handleOpenEdit(currentNote)}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shadow-sm"
                      title="Edit Note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      id="btn-delete-current-note"
                      onClick={() => handleSoftDelete(currentNote)}
                      className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 hover:text-rose-300 transition shadow-sm"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* More Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shadow-sm"
                        title="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {showMoreMenu && (
                        <div
                          className="absolute right-0 mt-1.5 w-48 rounded-xl border bg-[#0E1322] border-slate-800 shadow-2xl py-1.5 z-30 text-xs text-slate-200"
                          onMouseLeave={() => setShowMoreMenu(false)}
                        >
                          <button
                            onClick={() => handleDuplicateNote(currentNote)}
                            className="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-slate-800 text-slate-300"
                          >
                            <Copy className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Duplicate Note</span>
                          </button>
                          <button
                            onClick={() => handleExportMarkdown(currentNote)}
                            className="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-slate-800 text-slate-300"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Export as Markdown</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata Pills Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Date Pill */}
                  <div className="bg-[#121829] border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {new Date(currentNote.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Time Pill */}
                  {currentNote.time && (
                    <div className="bg-[#121829] border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{currentNote.time}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {currentNote.tags && currentNote.tags.map(tag => (
                    <div
                      key={tag}
                      className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium ${getTagBadgeStyle(tag)}`}
                    >
                      <TagIcon className="w-3 h-3" />
                      <span>{tag}</span>
                    </div>
                  ))}

                  {/* Symbol Pill */}
                  {currentNote.symbol && (
                    <div className="bg-[#121829] border border-slate-800 text-white text-xs px-2.5 py-1 rounded-lg font-mono font-bold">
                      {currentNote.symbol}
                    </div>
                  )}

                  {/* Account Name */}
                  {currentNote.accountName && (
                    <div className="bg-[#121829] border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg">
                      {currentNote.accountName}
                    </div>
                  )}
                </div>
              </div>

              {/* Note Content Section */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Note
                </div>
                <div
                  id="note-content-display"
                  className={`p-4 rounded-xl border leading-relaxed text-xs sm:text-sm font-sans space-y-3 whitespace-pre-line ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      : 'bg-[#0B0E18] border-slate-800/80 text-slate-200'
                  }`}
                >
                  {currentNote.content}
                </div>
              </div>

              {/* Trade Summary Section (If Trade metadata or Result is available) */}
              {(currentNote.resultR || currentNote.setup || currentNote.side || currentNote.accountName || currentNote.symbol) && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Trade Summary
                  </div>

                  <div
                    id="trade-summary-card"
                    className={`p-4 rounded-xl border ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-200'
                        : 'bg-[#0B0E18] border-slate-800/80'
                    }`}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {/* Result */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Result</span>
                        <span
                          className={`text-sm sm:text-base font-mono font-bold ${
                            currentNote.resultR?.startsWith('+')
                              ? 'text-emerald-400'
                              : currentNote.resultR?.startsWith('-')
                                ? 'text-rose-400'
                                : 'text-white'
                          }`}
                        >
                          {currentNote.resultR || '--'}
                        </span>
                      </div>

                      {/* Account */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Account</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-200">
                          {currentNote.accountName || 'Prop Firm'}
                        </span>
                      </div>

                      {/* Side */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Side</span>
                        <span
                          className={`text-xs sm:text-sm font-semibold ${
                            currentNote.side?.toLowerCase().includes('long') || currentNote.side === 'BUY'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {currentNote.side || '--'}
                        </span>
                      </div>

                      {/* Setup */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Setup</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-200">
                          {currentNote.setup || '--'}
                        </span>
                      </div>

                      {/* Timeframe */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Timeframe</span>
                        <span className="text-xs sm:text-sm font-mono font-medium text-slate-200">
                          {currentNote.timeframe || '1H'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Attachments
                  </div>
                  <input
                    type="file"
                    ref={attachmentInputRef}
                    onChange={e => handleUploadFilesToCurrentNote(e.target.files)}
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={isUploadingAttachment}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isUploadingAttachment ? 'Uploading...' : 'Add Attachment'}</span>
                  </button>
                </div>

                {/* Drag & Drop Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    handleUploadFilesToCurrentNote(e.dataTransfer.files);
                  }}
                  onClick={() => attachmentInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isDraggingOver
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : isLight
                        ? 'border-zinc-300 hover:border-blue-400 bg-zinc-50/50'
                        : 'border-slate-800 hover:border-slate-700 bg-[#0B0E18]/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <Paperclip className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-200">
                      Drag & drop files here or click to upload
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports: Images, PDFs, Documents (Max 10MB)
                    </p>
                  </div>
                </div>

                {/* Uploaded Attachments Gallery */}
                {currentNote.attachments && currentNote.attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {currentNote.attachments.map(att => (
                      <div
                        key={att.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-200'
                            : 'bg-[#0E1322] border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {att.type === 'image' ? (
                          <div className="relative group rounded-lg overflow-hidden border border-slate-800 aspect-video bg-black/40">
                            <img
                              src={att.url}
                              alt={att.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedImagePreview(att.url)}
                                className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800"
                                title="Enlarge Image"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                            <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                            <div className="truncate">
                              <span className="text-xs text-white block truncate">{att.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {att.size ? `${(att.size / 1024).toFixed(0)} KB` : 'Document'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400 text-[11px] truncate">{att.name}</span>
                          <button
                            onClick={() => handleRemoveAttachmentFromNote(att.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0E1322] border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                <BookOpen className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white">No Note Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a journal note from the list on the left or create a new entry to log your thoughts and trading plans.
              </p>
              <button
                onClick={handleOpenNewNote}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                + Create New Note
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: Note Creation / Edit, Trash Bin, Add Folder, Image Lightbox        */}
      {/* ========================================================================= */}

      {/* Note Creation / Edit Modal */}
      <JournalNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        noteToEdit={noteToEdit}
        defaultFolderId={selectedFolderId}
        defaultTag={selectedTag}
      />

      {/* Trash Bin Modal */}
      <JournalTrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
      />

      {/* Add Folder Modal */}
      {isAddFolderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddFolderModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border bg-[#0B0F19] border-slate-800 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                Add New Folder
              </h3>
              <button
                onClick={() => setIsAddFolderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Reviews, Psychology, Macro"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2 text-xs bg-[#090D16] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFolderModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-slate-800 bg-black">
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImagePreview}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

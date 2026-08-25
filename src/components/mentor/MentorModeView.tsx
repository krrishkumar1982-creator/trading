import React, { useState } from 'react';
import {
  Users2,
  UserCheck,
  ShieldAlert,
  Award,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Plus,
  Copy,
  RefreshCw,
  Search,
  Check,
  X,
  UserX,
  Clock,
  ShieldCheck,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { MentorStudent } from '../../types';

export const MentorModeView: React.FC = () => {
  const {
    userProfile,
    regenerateAccountCode,
    mentorStudents,
    mentorRequests,
    activeStudentImpersonation,
    setActiveStudentImpersonation,
    connectStudentByCode,
    approveMentorRequest,
    declineMentorRequest,
    disconnectStudent,
    formatCurrency,
    setActiveView,
    addToast,
    theme,
    mentorDirectivesSent,
    mentorDirectivesReceived,
    dispatchMentorDirective,
    acknowledgeMentorDirective,
  } = useTrading();

  const isLight = theme === 'light';

  // Mode switcher: 'mentor' vs 'student'
  const [activeTab, setActiveTab] = useState<'mentor' | 'student'>('mentor');

  // Selected student in Mentor Mode
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    mentorStudents[0]?.id || ''
  );
  const selectedStudent =
    mentorStudents.find(s => s.id === selectedStudentId) || mentorStudents[0];

  // Search & Filters in Mentor Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');

  // Connect Student Modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [inputStudentCode, setInputStudentCode] = useState('');

  const filteredStudents = mentorStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const handleStartReview = (student: MentorStudent) => {
    setActiveStudentImpersonation(student);
    addToast(
      'Mentor Mode Active',
      `Now reviewing portfolio and journal as ${student.name}`,
      'info'
    );
  };

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedbackNote.trim() || !selectedStudent || isSubmittingFeedback) return;
    setIsSubmittingFeedback(true);
    try {
      await dispatchMentorDirective(selectedStudent.code, feedbackNote.trim(), 'DIRECTIVE');
      setFeedbackNote('');
    } catch {
      // toast handled inside dispatchMentorDirective
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputStudentCode.trim()) return;
    const success = connectStudentByCode(inputStudentCode);
    if (success) {
      setInputStudentCode('');
      setIsConnectModalOpen(false);
    }
  };

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-h-screen ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${isLight ? 'border-zinc-200' : 'border-slate-800'}`}>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Users2 className="w-6 h-6 text-blue-500" />
            Mentor Hub & Account Sharing
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              PROP DESK & COACHING
            </span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-zinc-600' : 'text-slate-400'}`}>
            Share your live trading data with coaches or audit student portfolios in real time
          </p>
        </div>

        {/* Impersonation Status Banner */}
        {activeStudentImpersonation && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-1.5 rounded-xl text-xs font-semibold">
            <UserCheck className="w-4 h-4" />
            <span>Active Student Review: <strong>{activeStudentImpersonation.name}</strong></span>
            <button
              onClick={() => setActiveStudentImpersonation(null)}
              className="ml-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-lg text-xs transition"
            >
              Exit Impersonation
            </button>
          </div>
        )}
      </div>

      {/* Primary Tab Switcher: Mentor Workspace vs Student Mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('mentor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'mentor'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : isLight
                ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Mentor Workspace (Students: {mentorStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'student'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : isLight
                ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Student Mode (My Mentors & Unique Code)</span>
          {mentorRequests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* MODE 1: MENTOR WORKSPACE */}
      {activeTab === 'mentor' && (
        <div className="space-y-6">
          {/* Top Bar with Connect Student Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Search students by name, email, or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-blue-500 ${
                  isLight
                    ? 'bg-white border-zinc-200 text-zinc-900'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              />
            </div>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Student Code</span>
            </button>
          </div>

          {/* Grid Layout: Student List on Left, Student Overview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 Columns: Student Roster */}
            <div className={`lg:col-span-4 rounded-2xl border p-4 space-y-3 ${
              isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center justify-between px-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Connected Students ({filteredStudents.length})
                </span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No students found matching your search.
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredStudents.map(student => {
                    const isSelected = selectedStudent?.id === student.id;
                    return (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? isLight
                              ? 'bg-blue-50 border-blue-300 shadow-xs'
                              : 'bg-blue-600/15 border-blue-500/40 shadow-sm'
                            : isLight
                              ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-700"
                          />
                          <div className="min-w-0">
                            <div className={`text-xs font-bold truncate flex items-center gap-1.5 ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                              <span>{student.name}</span>
                              {student.riskBreached && (
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              )}
                            </div>
                            <div className={`text-[10px] font-mono truncate ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                              Code: <strong className="text-blue-400">{student.code}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className={`text-xs font-mono font-bold ${student.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(student.netPnl)}
                          </div>
                          <div className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {student.winRate}% WR
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 8 Columns: Selected Student Deep Dive */}
            <div className="lg:col-span-8 space-y-4">
              {selectedStudent ? (
                <>
                  {/* Selected Student Banner */}
                  <div className={`rounded-2xl border p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 ${
                    isLight ? 'bg-white border-zinc-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedStudent.avatar}
                        alt={selectedStudent.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-blue-500/40"
                      />
                      <div>
                        <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                          {selectedStudent.name}
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">
                            {selectedStudent.code}
                          </span>
                        </h2>
                        <div className={`text-xs mt-1 flex flex-wrap items-center gap-2 ${isLight ? 'text-zinc-600' : 'text-slate-400'}`}>
                          <span>Email: <strong>{selectedStudent.email}</strong></span>
                          <span>•</span>
                          <span>Joined: <strong>{selectedStudent.joinedDate || '2024'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartReview(selectedStudent)}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-blue-600/20 transition"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Impersonate & Review Journal</span>
                      </button>

                      <button
                        onClick={() => disconnectStudent(selectedStudent.id)}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                        title="Disconnect Student"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Student Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-slate-950 border-slate-800'}`}>
                      <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Realized P&L</span>
                      <div className={`text-lg font-black font-mono mt-0.5 ${selectedStudent.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(selectedStudent.netPnl)}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-slate-950 border-slate-800'}`}>
                      <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Win Rate</span>
                      <div className={`text-lg font-black font-mono mt-0.5 ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                        {selectedStudent.winRate}%
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-slate-950 border-slate-800'}`}>
                      <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Discipline Rating</span>
                      <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                        {selectedStudent.disciplineScore || 85}/100
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-slate-950 border-slate-800'}`}>
                      <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>Circuit Status</span>
                      <div className={`text-xs font-bold mt-1.5 ${selectedStudent.riskBreached ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedStudent.riskBreached ? '⚠️ Breached Daily Limit' : '✅ Safe Trade Limits'}
                      </div>
                    </div>
                  </div>

                  {/* Coach Directive Sender */}
                  <div className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-zinc-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      Send Coach Directive to {selectedStudent.name}
                    </h3>
                    <textarea
                      rows={3}
                      placeholder={`Write direct trading critique, rule assignments, or max drawdown caps for ${selectedStudent.name}...`}
                      value={feedbackNote}
                      onChange={e => setFeedbackNote(e.target.value)}
                      className={`w-full rounded-xl border p-3 text-xs font-mono focus:outline-none focus:border-blue-500 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          : 'bg-slate-950 border-slate-800 text-slate-100'
                      }`}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSendFeedback}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition"
                      >
                        Dispatch Directive
                      </button>
                    </div>
                  </div>

                  {/* Sent Directives Log */}
                  <div className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-zinc-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Directive Dispatch Log
                    </h3>
                    {mentorDirectivesSent.filter(d => d.studentId === selectedStudent.id || d.studentId === selectedStudent.code).length === 0 ? (
                      <p className="text-xs text-slate-500">No directives sent to this student yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {mentorDirectivesSent
                          .filter(d => d.studentId === selectedStudent.id || d.studentId === selectedStudent.code)
                          .map((directive: any) => (
                            <div
                              key={directive.id}
                              className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                                isLight ? 'bg-zinc-50 border-zinc-100' : 'bg-slate-950 border-slate-900/50'
                              }`}
                            >
                              <div className="space-y-1 flex-1 pr-3">
                                <p className={isLight ? 'text-zinc-800' : 'text-slate-300'}>{directive.content}</p>
                                <p className="text-[10px] text-slate-500">
                                  {new Date(directive.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  directive.status === 'ACKNOWLEDGED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {directive.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={`p-12 text-center rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-slate-900 border-slate-800'}`}>
                  <Users2 className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-semibold">No student selected</p>
                  <p className="text-xs text-slate-500 mt-1">Select a student from the left panel or click "Connect Student Code" to add one.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: STUDENT MODE */}
      {activeTab === 'student' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Unique Account Sharing Code Display */}
          <div className={`p-6 rounded-2xl border bg-gradient-to-br space-y-4 ${
            isLight
              ? 'from-blue-50 to-white border-blue-200'
              : 'from-blue-950/60 to-slate-900 border-blue-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <h2 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                  Your Unique Account Sharing Code
                </h2>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                ACTIVE
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-zinc-600' : 'text-slate-300'}`}>
              Provide this unique code to your trading mentor or prop desk manager. When they connect your code, they gain read-only access to audit your trades, reports, and daily journal notes.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <div className={`flex-1 border rounded-xl px-4 py-2.5 font-mono text-base font-black tracking-widest text-blue-500 flex items-center justify-between ${
                isLight ? 'bg-white border-zinc-300' : 'bg-slate-950 border-slate-800'
              }`}>
                <span>{userProfile.accountCode}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(userProfile.accountCode);
                    addToast('Code Copied!', 'Unique account code copied to clipboard', 'success');
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-500 transition"
                  title="Copy Code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => regenerateAccountCode()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Regenerate New Code"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Code</span>
              </button>
            </div>
          </div>

          {/* Pending & Approved Mentor Connection Requests */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-zinc-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <h3 className={`text-sm font-bold pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-slate-800'}`}>
              Mentor Access Permissions & Requests ({mentorRequests.length})
            </h3>

            <div className="space-y-3">
              {mentorRequests.map(req => (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div>
                    <div className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                      <span>{req.mentorName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'DECLINED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className={`text-[11px] mt-1 ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Requested: {req.createdAt} • Target Code: <span className="font-mono text-blue-400">{req.studentCode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => approveMentorRequest(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Access</span>
                        </button>
                        <button
                          onClick={() => declineMentorRequest(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}
                    {req.status === 'APPROVED' && (
                      <button
                        onClick={() => declineMentorRequest(req.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Mentor Directives list */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-zinc-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <h3 className={`text-sm font-bold pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-slate-800'} flex items-center gap-2 text-blue-400`}>
              <Award className="w-4 h-4" />
              <span>Received Mentor Directives ({mentorDirectivesReceived.length})</span>
            </h3>

            {mentorDirectivesReceived.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No directives received yet.</p>
            ) : (
              <div className="space-y-3">
                {mentorDirectivesReceived.map((directive: any) => (
                  <div
                    key={directive.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <p className={`text-xs ${isLight ? 'text-zinc-800' : 'text-slate-100'} font-mono`}>
                        {directive.content}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Issued: {new Date(directive.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {directive.status === 'PENDING' ? (
                        <button
                          onClick={() => acknowledgeMentorDirective(directive.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition animate-pulse"
                        >
                          Acknowledge Directive
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Acknowledged</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONNECT STUDENT CODE MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-zinc-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                <Plus className="w-4 h-4 text-blue-500" />
                Connect Student Unique Code
              </h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-slate-300'}`}>
                  Student Sharing Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TFB-7XK9-MP42"
                  value={inputStudentCode}
                  onChange={e => setInputStudentCode(e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-blue-500 ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      : 'bg-slate-950 border-slate-800 text-blue-400'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ask your student for their unique 12-character code found in Settings or Student Mode.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  Validate & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MentorModeView;

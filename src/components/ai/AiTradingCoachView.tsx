import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  User,
  Zap,
  TrendingUp,
  Brain,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { askTradingCoach } from '../../services/geminiAi';

export const AiTradingCoachView: React.FC = () => {
  const { filteredTrades, playbooks, formatCurrency } = useTrading();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello Alex! I am your DuskFlow Master AI Trading Coach. I have analyzed your ${filteredTrades.length} recorded executions. You have a solid edge in morning liquidity sweeps, but your late afternoon revenge trades are currently eroding 28% of your gross profits. Ask me anything about your setups, risk rules, or psychological leaks!`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || isLoading) return;

    setMessages(prev => [...prev, { sender: 'user', text: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await askTradingCoach(q, filteredTrades, playbooks);
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: 'I encountered an issue processing your query. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze my worst psychological leaks',
    'Which setup has my highest expectancy?',
    'How can I improve my average win/loss ratio?',
    'Am I revenge trading after losses?',
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-400" />
            AI Trading Coach & Performance Auditor
            <span className="text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
              GEMINI 3.7 FLASH
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep statistical diagnostics, psychological bias detection, and tactical game plans
          </p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-violet-500/40 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 shadow-2xl backdrop-blur-sm flex flex-col h-[520px] overflow-hidden">
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'ai'
                    ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'ai'
                    ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                    : 'bg-indigo-600 text-white shadow-md'
                }`}
              >
                <div className="whitespace-pre-line font-sans space-y-2">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                <span>Auditing trading data with Gemini AI engine...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask your coach anything (e.g. 'How can I stop moving my stop loss?')..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition shadow-md shadow-violet-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

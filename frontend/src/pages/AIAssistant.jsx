import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { Bot, Send, User, Sparkles, Loader2, RotateCcw, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QUICK_QUESTIONS = [
  '📊 How many students were allocated to each course?',
  '🎯 Which students did not receive their first preference?',
  '📉 Which course had the highest rejection rate?',
  '📋 Show category-wise allocation summary.',
  '🏆 What is the overall allocation rate?',
  '❓ How many students are unallocated?',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `## 👋 Hello! I'm your AI Course Allocation Assistant

I have **real-time access** to your allocation system data. Ask me anything about:

- 📊 Allocation statistics per course  
- 🎯 Students who didn't get their first preference  
- 📉 Course rejection rates  
- 📋 Category-wise allocation summaries  
- 🏆 Merit rankings and seat utilization  

**Try one of the quick questions below or type your own!**`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;

    setMessages(p => [...p, { role: 'user', content: q, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.query(q);
      const { answer, model } = res.data.data;
      setMessages(p => [...p, {
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        model,
      }]);
    } catch (e) {
      setMessages(p => [...p, {
        role: 'assistant',
        content: `❌ **Error**: ${e.message}\n\nPlease make sure the backend is running and your OpenAI API key is configured.`,
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `## 👋 Chat cleared! I'm ready to help again.\n\nAsk me anything about your course allocation data!`,
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="page-title flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <Bot size={18} className="text-gray-900" />
            </div>
            AI Assistant
          </h2>
          <p className="page-subtitle ml-11">Powered by GPT-4o-mini · Real-time allocation data</p>
        </div>
        <button onClick={clearChat} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw size={14} /> Clear Chat
        </button>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Quick Questions Panel */}
        <div className="hidden lg:flex flex-col w-64 gap-2 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-1">Quick Questions</p>
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q.replace(/^[^\w]+\s/, '').trim())}
              className="card-hover px-4 py-3 text-left text-xs text-gray-600 hover:text-gray-900 transition-all duration-200 group"
              disabled={loading}
            >
              <span className="leading-relaxed">{q}</span>
              <ChevronRight size={12} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary-600" />
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div className="flex flex-col flex-1 card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm
                  ${msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg shadow-purple-500/30'
                    : 'bg-gradient-to-br from-primary-600 to-primary-400 shadow-lg shadow-primary-500/30'}`}>
                  {msg.role === 'assistant' ? <Bot size={16} className="text-gray-900" /> : <User size={14} className="text-gray-900" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-primary-50 border border-primary-200 text-gray-900 rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm'
                        : 'bg-white/80 border border-gray-200/50 text-gray-800 rounded-tl-sm'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none
                        prose-p:text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900
                        prose-code:text-primary-700 prose-li:text-gray-700 prose-a:text-primary-600">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <p className="text-gray-400 text-xs">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {msg.model && (
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Sparkles size={10} className="text-purple-500" />
                        {msg.model}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  <Bot size={16} className="text-gray-900" />
                </div>
                <div className="bg-white/80 border border-gray-200/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-gray-400 text-xs ml-1">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Mobile */}
          <div className="lg:hidden px-4 py-3 border-t border-gray-200/50">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.slice(0, 3).map((q, i) => (
                <button key={i}
                  onClick={() => sendMessage(q.replace(/^[^\w]+\s/, '').trim())}
                  className="flex-shrink-0 text-xs bg-white/80 border border-gray-200/50 rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all"
                  disabled={loading}>{q}</button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200/50">
            <div className="flex gap-3">
              <input
                className="form-input flex-1"
                placeholder="Ask about allocations, statistics, students..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                className="btn-primary flex-shrink-0 flex items-center gap-2 px-4"
                disabled={loading || !input.trim()}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2 ml-1">Press Enter to send · Powered by OpenAI GPT-4o-mini</p>
          </div>
        </div>
      </div>
    </div>
  );
}

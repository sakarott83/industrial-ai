
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
// Fixed: import inference instead of gemini
import { inference } from '../services/geminiService';
import { Send, User, Bot, Globe, Brain } from 'lucide-react';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Use inference service which correctly handles Gemini 3 Flash with Search
      const result = await inference.chatWithSearch(input);
      const botMsg: ChatMessage = { 
        role: 'model', 
        text: result.text || "I couldn't find specific information on that.", 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col h-[400px]">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Bot size={16} className="text-blue-400" />
          Knowledge Assistant
        </h3>
        <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
          <Globe size={10} /> Search Enabled
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 opacity-60">
            <Brain size={32} className="mb-2" />
            <p className="text-xs">Ask about energy regulations in Lombardy or industrial statistics.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-700 text-slate-200 rounded-tl-none border border-slate-600'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 p-3 rounded-2xl rounded-tl-none border border-slate-600 flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatBot;

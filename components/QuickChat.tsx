
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithStory } from '../services/geminiService';

interface QuickChatProps {
  context: string;
  loreContext: string;
  model: string;
}

export const QuickChat: React.FC<QuickChatProps> = ({ context, loreContext, model }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async () => {
      if (!input.trim()) return;
      const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      try {
          const response = await chatWithStory(userMsg.text, context, loreContext, model);
          const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), sender: 'ai', text: response, timestamp: Date.now() };
          setMessages(prev => [...prev, aiMsg]);
      } catch (e) {
          // Error handling
      } finally {
          setIsTyping(false);
      }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
        
        {/* Chat Window */}
        {isOpen && (
            <div className="mb-4 w-80 h-96 bg-stone-900 border border-stone-700 shadow-2xl rounded-sm flex flex-col pointer-events-auto animate-fade-in origin-bottom-right">
                <div className="p-3 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-widest">
                        <Bot className="w-3 h-3" />
                        Memory Bank
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-stone-500 hover:text-stone-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-900/90">
                    {messages.length === 0 && (
                        <p className="text-center text-xs text-stone-600 mt-10 italic">Ask me about characters, plot points, or inventory...</p>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-2 rounded-sm text-xs leading-relaxed ${
                                msg.sender === 'user' 
                                ? 'bg-stone-800 text-stone-200 border border-stone-700' 
                                : 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && <div className="text-xs text-stone-500 animate-pulse ml-2">Searching archives...</div>}
                </div>

                <div className="p-2 bg-stone-950 border-t border-stone-800 flex gap-2">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Query narrative..."
                        className="flex-1 bg-stone-900 border border-stone-800 rounded-sm px-3 py-1.5 text-xs text-stone-300 focus:border-[#d4af37] outline-none"
                    />
                    <button onClick={handleSend} className="p-2 bg-stone-800 hover:bg-[#d4af37] hover:text-stone-900 text-stone-400 rounded-sm transition-colors">
                        <Send className="w-3 h-3" />
                    </button>
                </div>
            </div>
        )}

        {/* Toggle Button */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-12 h-12 rounded-full bg-[#d4af37] text-stone-900 shadow-lg shadow-[#d4af37]/20 flex items-center justify-center hover:bg-white hover:scale-110 transition-all pointer-events-auto"
            title="Open Context Chat"
        >
            <MessageSquare className="w-5 h-5 fill-current" />
        </button>
    </div>
  );
};

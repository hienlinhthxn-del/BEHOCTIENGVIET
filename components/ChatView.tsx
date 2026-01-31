
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Send, User, Bot, Search, ExternalLink, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  text: string;
  links?: any[];
}

const ChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Chào bé! Cô là trợ lý Gemini. Bé muốn hỏi gì về bài học hay về thế giới xung quanh không?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const gemini = GeminiService.getInstance();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Use search grounding for more accurate info
      const result = await gemini.searchInfo(userMessage);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: result.text,
        links: result.links 
      }]);
    } catch (err) {
      const basicResponse = await gemini.chat(userMessage);
      setMessages(prev => [...prev, { role: 'ai', text: basicResponse || "Cô chưa hiểu lắm, bé nói lại được không?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-orange-200">
      <div className="bg-orange-500 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-600">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold">Trò chuyện cùng Gemini</h3>
            <p className="text-xs text-orange-100">Đang trực tuyến</p>
          </div>
        </div>
        <button onClick={onBack} className="text-white opacity-80 hover:opacity-100 font-bold">Thoát</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border'}`}>
                <p>{msg.text}</p>
                {msg.links && msg.links.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase"><Search size={10} /> Tham khảo thêm:</p>
                    {msg.links.map((link, idx) => (
                      link.web && (
                        <a key={idx} href={link.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-[11px] font-medium truncate">
                          <ExternalLink size={10} /> {link.web.title}
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-gray-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Gemini đang suy nghĩ...</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Hỏi bất kỳ điều gì..."
          className="flex-1 p-4 rounded-2xl bg-gray-100 outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
        />
        <button
          onClick={handleSend}
          className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-md active:scale-95"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatView;

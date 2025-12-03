import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Latex } from './Latex';

interface AIHelperProps {
  height: number;
  angularVelocity: number;
  period: number;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

// Helper to render mixed text and LaTeX
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const content = part.slice(1, -1);
          return <Latex key={index}>{content}</Latex>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export const AIHelper: React.FC<AIHelperProps> = ({ height, angularVelocity, period }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "同学们好！我是AI助教。关于圆锥摆实验，有什么疑问吗？比如：受力分析？" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash';
      
      const systemInstruction = `
        你是一位热情的高中物理助教，正在大屏幕上给全班同学讲解圆锥摆（Conical Pendulum）。
        
        当前模拟状态:
        - 垂直高度 (h): ${height.toFixed(2)} m
        - 角速度 (ω): ${angularVelocity.toFixed(2)} rad/s
        - 周期 (T): ${period.toFixed(2)} s
        
        回答要求:
        1. 语气亲切、鼓励思考。
        2. 必须使用中文。
        3. 数学公式用 LaTeX 格式，包裹在单个 $ 符号中。
        4. 答案尽量简短有力，适合大屏幕展示（不要长篇大论）。
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: [
            ...messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = response.text || "请重试。";
      setMessages(prev => [...prev, { role: 'model', text }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "网络连接异常。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-[400px]">
      <div className="p-4 border-b border-slate-800 bg-slate-800/80 rounded-t-xl flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
            <path d="M21.18 8.02c-1-2.3-2.85-4.17-5.16-5.18"></path>
            </svg>
        </div>
        <h3 className="font-bold text-white text-xl">AI 答疑区</h3>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-5 py-3 text-lg leading-relaxed shadow-md ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              <FormattedText text={m.text} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-5 py-4 border border-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入问题..."
            className="flex-grow bg-slate-950 border border-slate-700 rounded-xl px-5 py-3 text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-colors font-bold"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};
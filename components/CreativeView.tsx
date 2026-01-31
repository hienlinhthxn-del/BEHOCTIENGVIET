
import React, { useState } from 'react';
import { CREATIVE_TOOLS } from '../constants';
import { GeminiService } from '../services/geminiService';
import { Loader2, Sparkles, Image as ImageIcon, Film, Download, Trash2 } from 'lucide-react';

const CreativeView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [videoOrientation, setVideoOrientation] = useState<'16:9' | '9:16'>('16:9');
  const [loadingMessage, setLoadingMessage] = useState('');

  const gemini = GeminiService.getInstance();

  const checkAndPromptApiKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        return true; 
      }
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResultUrl(null);
    await checkAndPromptApiKey();

    try {
      if (activeTool === 'gen-image') {
        setLoadingMessage('Gemini Pro Image đang vẽ tranh cho bé...');
        const url = await gemini.generateImage(prompt, imageSize);
        setResultUrl(url);
      } else if (activeTool === 'gen-video') {
        setLoadingMessage('Veo đang tạo phim ngắn sinh động... Sẽ mất khoảng vài phút, bé đợi nhé!');
        const url = await gemini.generateVideo(prompt, videoOrientation);
        setResultUrl(url);
      }
    } catch (err) {
      console.error(err);
      alert("Đã có lỗi xảy ra. Hãy thử lại sau nhé!");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  if (activeTool) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <button onClick={() => { setActiveTool(null); setResultUrl(null); setPrompt(''); }} className="text-blue-600 font-bold hover:underline flex items-center gap-2">
          &larr; Trở lại danh sách công cụ
        </button>

        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-t-8 border-purple-400">
          <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
            {CREATIVE_TOOLS.find(t => t.id === activeTool)?.icon}
            {CREATIVE_TOOLS.find(t => t.id === activeTool)?.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Mô tả ý tưởng của bé</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: Một chú mèo con đang học bài trong thư viện nhiều sách..."
                  className="w-full p-4 rounded-2xl border-2 border-purple-100 focus:border-purple-400 outline-none h-40 text-lg shadow-inner bg-gray-50"
                />
              </div>

              {activeTool === 'gen-image' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Kích thước ảnh</label>
                  <div className="flex gap-4">
                    {(['1K', '2K', '4K'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setImageSize(size)}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${imageSize === size ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'gen-video' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Định hướng Video</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setVideoOrientation('16:9')}
                      className={`px-4 py-2 rounded-xl font-bold transition-all ${videoOrientation === '16:9' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      Nằm ngang (16:9)
                    </button>
                    <button
                      onClick={() => setVideoOrientation('9:16')}
                      className={`px-4 py-2 rounded-xl font-bold transition-all ${videoOrientation === '9:16' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      Đứng (9:16)
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full py-4 bg-purple-600 text-white font-black text-xl rounded-2xl hover:bg-purple-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {loading ? 'Đang thực hiện...' : 'Bắt đầu sáng tạo'}
              </button>
            </div>

            <div className="bg-gray-100 rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[300px] overflow-hidden relative group">
              {loading ? (
                <div className="text-center p-8">
                  <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
                  <p className="text-purple-700 font-bold animate-pulse">{loadingMessage}</p>
                </div>
              ) : resultUrl ? (
                <>
                   {activeTool === 'gen-video' ? (
                     <video src={resultUrl} controls className="w-full h-full object-contain" />
                   ) : (
                     <img src={resultUrl} alt="Sáng tạo AI" className="w-full h-full object-cover" />
                   )}
                   <div className="absolute bottom-4 right-4 flex gap-2">
                      <a href={resultUrl} download="tv1-creative" className="p-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-blue-50 transition-colors">
                        <Download size={20} />
                      </a>
                   </div>
                </>
              ) : (
                <div className="text-center p-12 text-gray-400">
                  {activeTool === 'gen-video' ? <Film size={64} className="mx-auto mb-4" /> : <ImageIcon size={64} className="mx-auto mb-4" />}
                  <p className="font-medium">Thành phẩm sẽ hiển thị tại đây</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <section className="text-center space-y-4">
        <h2 className="text-4xl font-black text-purple-900">Phòng Sáng Tạo AI</h2>
        <p className="text-gray-600 text-lg">Bé hãy dùng trí tưởng tượng để biến những con chữ thành hình ảnh và video tuyệt đẹp!</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CREATIVE_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-t-8 border-transparent hover:border-purple-400 hover:-translate-y-2 flex flex-col items-center text-center gap-4"
          >
            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110">
              {tool.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CreativeView;

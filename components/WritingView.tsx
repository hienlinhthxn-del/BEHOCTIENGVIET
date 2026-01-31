
import React, { useRef, useState, useEffect } from 'react';
import { ProgressRecord, WritingCategory, WritingExercise } from '../types';
import { WRITING_EXERCISES } from '../constants';
import { ChevronLeft, Eraser, PenTool, Star, X, Eye, Info, Volume2, Sparkles, Film, PlayCircle } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { GoogleGenAI, Modality } from '@google/genai';

interface WritingViewProps {
  onBack: () => void;
  onSaveProgress: (record: Omit<ProgressRecord, 'id' | 'timestamp'>) => void;
}

const WritingView: React.FC<WritingViewProps> = ({ onBack, onSaveProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<WritingCategory>('Chữ cái');
  const [selectedExercise, setSelectedExercise] = useState<WritingExercise>(WRITING_EXERCISES[0]);
  const [lineWidth, setLineWidth] = useState(8);
  const [penColor, setPenColor] = useState('#2563eb');
  const [showGhost, setShowGhost] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  
  // Grading state
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ score: number, comment: string } | null>(null);

  const filteredExercises = WRITING_EXERCISES.filter(ex => ex.category === activeCategory);
  const gemini = GeminiService.getInstance();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = lineWidth;
      }
    }
  }, [lineWidth, penColor, selectedExercise]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setGradeResult(null);
  };

  const handleExerciseSelect = (ex: WritingExercise) => {
    setSelectedExercise(ex);
    setShowVideo(false);
    clearCanvas();
  };

  const handleGrade = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGrading(true);
    setGradeResult(null);

    try {
      const imageData = canvas.toDataURL('image/png');
      const result = await gemini.evaluateWriting(imageData, selectedExercise.text);
      setGradeResult(result);

      onSaveProgress({
        lessonId: `writing-${selectedExercise.id}`,
        lessonTitle: `Tập viết: ${selectedExercise.label}`,
        activityType: 'writing',
        score: result.score,
        comment: result.comment
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGrading(false);
    }
  };

  const handleSpeak = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: `Đây là chữ: ${selectedExercise.text}`,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) {}
  };

  const renderStars = (score: number) => {
    const starsCount = Math.ceil(score / 2);
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={36} className={`${i < starsCount ? 'fill-yellow-400 text-yellow-400 animate-star' : 'text-gray-200'}`} />
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-blue-600 font-bold mb-2">
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
             <PenTool className="text-blue-600" />
             Bé Luyện Viết Chữ
          </h2>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border ring-4 ring-sky-50">
          {(['Chữ cái', 'Vần', 'Từ ngữ'] as WritingCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
                activeCategory === cat ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Danh sách bài tập */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[2rem] shadow-lg border p-4 max-h-[500px] overflow-y-auto">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Danh sách mẫu</h4>
            <div className="grid grid-cols-3 gap-2">
              {filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => handleExerciseSelect(ex)}
                  className={`aspect-square flex items-center justify-center rounded-2xl text-xl font-bold transition-all border-2 ${
                    selectedExercise.id === ex.id 
                      ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-inner scale-105 ring-4 ring-blue-50' 
                      : 'bg-gray-50 border-transparent text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-md space-y-4 border">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chọn màu và nét</p>
             <div className="flex gap-2">
               {['#2563eb', '#dc2626', '#16a34a', '#000000'].map(color => (
                 <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    className={`w-8 h-8 rounded-full border-4 shadow-sm transition-transform active:scale-90 ${penColor === color ? 'border-gray-800 scale-110' : 'border-white'}`}
                    style={{ backgroundColor: color }}
                 />
               ))}
             </div>
             <input 
                type="range" 
                min="4" 
                max="30" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(Number(e.target.value))} 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
          </div>
        </div>

        {/* Khu vực chính: Mẫu chữ và Bảng viết */}
        <div className="lg:col-span-9 space-y-6">
          {/* Mẫu chữ chuẩn lớp 1 & Video */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-md border-2 border-dashed border-blue-200 relative overflow-hidden">
             <div className="absolute top-0 left-0 px-4 py-1 bg-blue-500 text-white text-[10px] font-black rounded-br-2xl uppercase tracking-tighter z-10">Mẫu chữ & Video</div>
             
             <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Khung mẫu / Video */}
                <div className="w-full md:w-64 h-64 shrink-0 relative">
                  {showVideo && selectedExercise.videoUrl ? (
                    <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-black">
                       <iframe 
                         src={selectedExercise.videoUrl} 
                         className="w-full h-full" 
                         title="Video mẫu viết"
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                         allowFullScreen
                       ></iframe>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white writing-grid border-2 border-slate-300 rounded-2xl flex items-center justify-center relative shadow-inner">
                      <span className="text-[120px] font-handwriting text-slate-800 opacity-90 select-none">
                        {selectedExercise.text}
                      </span>
                    </div>
                  )}
                  
                  {selectedExercise.videoUrl && (
                    <button 
                      onClick={() => setShowVideo(!showVideo)}
                      className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-lg transition-all flex items-center gap-2 ${showVideo ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white animate-bounce'}`}
                    >
                      {showVideo ? <X size={12}/> : <Film size={12}/>}
                      {showVideo ? 'Đóng video' : 'Xem video mẫu'}
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                     <h3 className="text-3xl font-black text-gray-800">{selectedExercise.label}</h3>
                     <button onClick={handleSpeak} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                        <Volume2 size={20} />
                     </button>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                     Bé hãy nhấn vào nút <strong>"Xem video mẫu"</strong> bên cạnh để biết cách đặt bút và đưa nét chữ <strong>{selectedExercise.label}</strong> đúng chuẩn nhé!
                  </p>
                  <div className="flex flex-wrap gap-3">
                     <button 
                       onClick={() => setShowGhost(!showGhost)} 
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${showGhost ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                     >
                       <Eye size={14} /> {showGhost ? 'Đang hiện nét mờ' : 'Hiện nét mờ'}
                     </button>
                     <div className="flex items-center gap-2 text-orange-500 bg-orange-50 px-4 py-2 rounded-xl text-xs font-bold">
                        <Info size={14} /> Độ cao: 2 ô ly
                     </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Bảng viết có lưới ô ly */}
          <div className="bg-white rounded-[2.5rem] shadow-xl p-4 md:p-8 flex flex-col gap-6 border-b-8 border-gray-100 relative">
            <div className="relative border-4 border-slate-200 rounded-[2rem] overflow-hidden aspect-[16/9] md:aspect-[2/1] bg-white writing-grid cursor-crosshair shadow-inner">
              {showGhost && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-[140px] md:text-[240px] font-handwriting text-slate-100 tracking-tighter transition-all duration-300 transform scale-110 italic">
                    {selectedExercise.text}
                  </span>
                </div>
              )}
              
              <canvas
                ref={canvasRef}
                width={1200}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full relative z-10"
              />

              {isGrading && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
                   <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-xl font-black text-blue-900">Cô giáo đang chấm bài...</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button onClick={clearCanvas} className="flex items-center gap-2 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all">
                <Eraser size={22} /> Xóa bảng
              </button>
              <button 
                onClick={handleGrade}
                disabled={isGrading}
                className="flex items-center gap-3 px-12 py-4 bg-orange-500 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50"
               >
                <Sparkles size={24} className="animate-pulse" /> Chấm điểm
              </button>
            </div>
          </div>
        </div>
      </div>

      {gradeResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm" onClick={() => setGradeResult(null)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl relative z-10 border-t-[12px] border-orange-400 transform animate-pop text-center space-y-8">
            <button onClick={() => setGradeResult(null)} className="absolute top-6 right-6 p-2 text-gray-400"><X /></button>
            <h3 className="text-3xl font-black text-gray-800">Kết Quả Chấm Điểm</h3>
            <div className="flex justify-center gap-2">{renderStars(gradeResult.score)}</div>
            <div className="py-8 bg-orange-50 rounded-[2.5rem] border-4 border-dashed border-orange-100">
               <div className="text-7xl font-black text-orange-600 mb-2">{gradeResult.score}<span className="text-3xl text-orange-300">/10</span></div>
            </div>
            <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 text-left">
               <p className="text-blue-900 font-medium italic text-lg leading-relaxed">"{gradeResult.comment}"</p>
            </div>
            <button onClick={() => setGradeResult(null)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95">Tiếp tục nào!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingView;

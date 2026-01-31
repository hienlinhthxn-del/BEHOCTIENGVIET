
import React, { useState } from 'react';
import { ProgressRecord, AppTheme, Student } from '../types';
import { APP_THEMES } from '../constants';
import { Heart, Trophy, MessageCircle, Play, Star, Calendar, Download, Square, Palette, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ParentDashboardProps {
  progress: ProgressRecord[];
  currentTheme: AppTheme;
  onUpdateTheme: (theme: AppTheme) => void;
  activeStudent: Student | null;
}

const BACKGROUND_IMAGES = [
  { id: 'none', label: 'Mặc định', url: '' },
  { id: 'clouds', label: 'Mây xanh', url: 'https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?auto=format&fit=crop&q=80&w=1200' },
  { id: 'stars', label: 'Ngôi sao', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1200' },
  { id: 'paper', label: 'Giấy vẽ', url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=1200' },
];

const ParentDashboard: React.FC<ParentDashboardProps> = ({ progress, currentTheme, onUpdateTheme, activeStudent }) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  // Chỉ lấy tiến trình của học sinh đang đăng nhập
  const studentProgress = activeStudent 
    ? progress.filter(p => p.studentId === activeStudent.id)
    : progress;

  const totalStars = studentProgress.reduce((acc, curr) => acc + Math.ceil(curr.score / 2), 0);

  const handlePlayAudio = (record: ProgressRecord) => {
    if (playingAudioId === record.id) {
      audioInstance?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioInstance) audioInstance.pause();
    const audioUrl = record.audioBase64 ? `data:audio/webm;base64,${record.audioBase64}` : record.audioUrl;
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play();
    setAudioInstance(audio);
    setPlayingAudioId(record.id);
    audio.onended = () => setPlayingAudioId(null);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-rose-600 flex items-center gap-3">
            <Heart className="fill-rose-500" /> Hồ Sơ Của {activeStudent ? activeStudent.name : 'Bé'}
          </h2>
          <p className="text-gray-500 font-bold">Xem thành tích và trang trí không gian học tập của riêng con.</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[3.5rem] p-10 text-white shadow-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="w-32 h-32 bg-white/20 rounded-[2rem] flex items-center justify-center relative shadow-2xl transform hover:rotate-6 transition-transform">
          <Trophy size={64} className="text-yellow-300 drop-shadow-lg" />
        </div>
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h3 className="text-3xl font-black">Hạng Tích Lũy: Siêu Sao Tiếng Việt</h3>
          <p className="text-xl opacity-90 font-medium italic">"Con đã nhận được tổng cộng {totalStars} ngôi sao lấp lánh!"</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            {['Học chăm', 'Viết đẹp', 'Đọc tốt', 'Sáng tạo'].map(badge => (
              <span key={badge} className="px-5 py-1.5 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest">{badge}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <section className="bg-white rounded-[3rem] shadow-xl p-10 border border-gray-100 space-y-8">
            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <Palette className="text-rose-500" /> Trang trí ứng dụng
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {BACKGROUND_IMAGES.map((img) => (
                <button
                  key={img.id}
                  onClick={() => onUpdateTheme({ ...currentTheme, backgroundImage: img.url })}
                  className={`relative aspect-[16/9] rounded-[2rem] border-4 overflow-hidden transition-all group ${
                    currentTheme.backgroundImage === img.url ? 'border-rose-500 ring-8 ring-rose-50' : 'border-gray-50'
                  }`}
                >
                  {img.url ? <img src={img.url} alt={img.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><ImageIcon size={32}/></div>}
                  <div className="absolute bottom-4 left-4 right-4 text-xs font-black text-white drop-shadow-md">{img.label}</div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
           <section className="space-y-6">
              <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3"><Calendar className="text-rose-500" /> Nhật ký gần đây</h3>
              <div className="space-y-4">
                {studentProgress.slice(0, 5).map(record => (
                  <div key={record.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><Star size={24} fill={record.score >= 8 ? "currentColor" : "none"} /></div>
                    <div className="flex-1">
                      <p className="font-black text-gray-800 leading-tight">{record.lessonTitle}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(record.timestamp).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="text-xl font-black text-rose-600">{record.score}đ</div>
                  </div>
                ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;

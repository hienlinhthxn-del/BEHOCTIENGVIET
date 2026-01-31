
import React from 'react';
import { AppView, Student } from '../types';
import { BookOpen, PenTool, Sparkles, MessageCircle, Trophy, Star } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  activeStudent: Student | null;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, activeStudent }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-white px-6 py-2 rounded-full shadow-sm border border-orange-100 mb-4 animate-bounce">
           <Star className="text-yellow-400 fill-yellow-400" size={16}/>
           <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Hôm nay bé học thật giỏi nhé!</p>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-blue-900 leading-tight">
          Chào {activeStudent ? activeStudent.name : 'Bé'} thân yêu! 🌟
        </h2>
        <p className="text-gray-600 text-xl max-w-2xl mx-auto font-medium">
          Hôm nay chúng mình cùng học gì nào? Hãy chọn một trò chơi để bắt đầu nhé!
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <MenuCard 
          title="Bé Tập Đọc" 
          description="Học phát âm và đọc chữ cùng cô giáo AI Gemini."
          icon={<BookOpen className="w-14 h-14" />}
          color="bg-green-500"
          onClick={() => onNavigate(AppView.READING)}
        />
        <MenuCard 
          title="Bé Tập Viết" 
          description="Luyện viết các nét cơ bản và chữ cái lớp 1."
          icon={<PenTool className="w-14 h-14" />}
          color="bg-blue-500"
          onClick={() => onNavigate(AppView.WRITING)}
        />
        <MenuCard 
          title="Vận Dụng" 
          description="Thử thách giải đố và áp dụng kiến thức."
          icon={<Trophy className="w-14 h-14" />}
          color="bg-yellow-500"
          onClick={() => onNavigate(AppView.EXERCISE)}
        />
        <MenuCard 
          title="Phòng Sáng Tạo" 
          description="Dùng AI vẽ tranh và tạo video từ trí tưởng tượng."
          icon={<Sparkles className="w-14 h-14" />}
          color="bg-purple-500"
          onClick={() => onNavigate(AppView.CREATIVE)}
        />
        <MenuCard 
          title="Hỏi Chuyện Cô AI" 
          description="Trò chuyện và hỏi bất kỳ điều gì bé thắc mắc."
          icon={<MessageCircle className="w-14 h-14" />}
          color="bg-orange-500"
          onClick={() => onNavigate(AppView.CHAT)}
        />
      </div>
    </div>
  );
};

const MenuCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, description, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className="group bg-white p-8 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-b-[12px] border-gray-100 hover:border-orange-200 hover:-translate-y-2 flex flex-col items-center text-center gap-6 active:scale-95"
  >
    <div className={`p-6 rounded-[2rem] text-white ${color} shadow-lg transition-transform group-hover:rotate-12`}>
      {icon}
    </div>
    <div>
      <h3 className="text-2xl font-black text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{description}</p>
    </div>
  </button>
);

export default HomeView;

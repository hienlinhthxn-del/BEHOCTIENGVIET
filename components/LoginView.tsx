
import React, { useState } from 'react';
import { Student, Classroom } from '../types';
import { UserCheck, Users, GraduationCap, ChevronRight, Sparkles, Heart } from 'lucide-react';

interface LoginViewProps {
  students: Student[];
  classrooms: Classroom[];
  onSelectStudent: (student: Student) => void;
  onSelectTeacher: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ students, classrooms, onSelectStudent, onSelectTeacher }) => {
  const [view, setView] = useState<'selection' | 'student-list'>('selection');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const filteredStudents = selectedClassId 
    ? students.filter(s => s.classId === selectedClassId)
    : students;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-orange-500 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl mx-auto transform -rotate-6 animate-float">
            TV1
          </div>
          <h1 className="text-5xl font-black text-blue-900 leading-tight">Bé Học Tiếng Việt 1</h1>
          <p className="text-gray-500 text-xl font-medium">Chào mừng Thầy Cô và các con đến với thế giới ngôn ngữ!</p>
        </div>

        {view === 'selection' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500">
            <RoleCard 
              title="Học Sinh Đáng Yêu" 
              description="Bé đăng nhập để học bài, làm bài tập và nhận quà nhé!" 
              icon={<Users size={48} />}
              color="bg-orange-500"
              onClick={() => setView('student-list')}
            />
            <RoleCard 
              title="Thầy Cô Giáo" 
              description="Giáo viên quản lý lớp học, soạn bài và chấm điểm cho bé." 
              icon={<GraduationCap size={48} />}
              color="bg-blue-600"
              onClick={onSelectTeacher}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-xl border border-orange-50">
               <div className="flex gap-4">
                  {classrooms.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id)}
                      className={`px-6 py-2 rounded-full font-black text-sm transition-all ${selectedClassId === c.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                  <button onClick={() => setSelectedClassId(null)} className={`px-6 py-2 rounded-full font-black text-sm transition-all ${selectedClassId === null ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>Tất cả</button>
               </div>
               <button onClick={() => setView('selection')} className="text-blue-600 font-black text-sm underline px-4">Quay lại</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="group bg-white p-6 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center gap-4 border-b-8 border-gray-100 hover:border-orange-200"
                >
                  <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black shadow-inner transform transition-transform group-hover:rotate-12" style={{ backgroundColor: student.avatarColor }}>
                    {student.name.charAt(0)}
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-800 text-sm">{student.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Lớp {classrooms.find(c => c.id === student.classId)?.name || '?'}</p>
                  </div>
                </button>
              )) : (
                <div className="col-span-full py-16 text-center bg-white/50 rounded-[3rem] border-4 border-dashed border-gray-200">
                   <p className="text-gray-400 font-bold italic">Chưa có học sinh nào. <br/> Thầy cô hãy vào phần Giáo viên để thêm bé nhé!</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center pt-8 flex items-center justify-center gap-8 opacity-40">
           <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest"><Sparkles size={16}/> Sáng tạo cùng AI</div>
           <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest"><Heart size={16}/> Học tập vui vẻ</div>
        </div>
      </div>
    </div>
  );
};

const RoleCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, description, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className="group bg-white p-10 rounded-[3.5rem] shadow-xl hover:shadow-2xl transition-all border-b-[16px] border-gray-100 hover:border-orange-200 flex flex-col items-center text-center gap-6 active:scale-95"
  >
    <div className={`p-8 rounded-[2rem] text-white ${color} shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6`}>
      {icon}
    </div>
    <div className="space-y-2">
      <h3 className="text-3xl font-black text-gray-800">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
    </div>
    <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs mt-4 group-hover:translate-x-2 transition-transform">
       Bắt đầu ngay <ChevronRight size={16} />
    </div>
  </button>
);

export default LoginView;

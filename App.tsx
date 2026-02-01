
import React, { useState, useEffect } from 'react';
import { AppView, Lesson, ProgressRecord, AppTheme, Student, Classroom, UserRole } from './types';
import { NAV_ITEMS, LESSONS as INITIAL_LESSONS, APP_THEMES } from './constants';
import HomeView from './components/HomeView';
import ReadingView from './components/ReadingView';
import WritingView from './components/WritingView';
import CreativeView from './components/CreativeView';
import ChatView from './components/ChatView';
import ExerciseView from './components/ExerciseView';
import LessonEditor from './components/LessonEditor';
import TeacherDashboard from './components/TeacherDashboard';
import ParentDashboard from './components/ParentDashboard';
import LoginView from './components/LoginView';
import { LogOut } from 'lucide-react';
import { saveProgressToFirebase, getProgressFromFirebase } from './firebase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([
    { id: 'c1', name: 'Lớp 1A', grade: '1' },
    { id: 'c2', name: 'Lớp 1B', grade: '1' }
  ]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(APP_THEMES[0]);

  useEffect(() => {
    const savedLessonsJson = localStorage.getItem('tv1_lessons');
    const savedProgressJson = localStorage.getItem('tv1_progress');
    const savedThemeJson = localStorage.getItem('tv1_theme');
    const savedStudentsJson = localStorage.getItem('tv1_students');
    const savedClassroomsJson = localStorage.getItem('tv1_classrooms');

    if (savedLessonsJson) {
      setLessons(JSON.parse(savedLessonsJson));
    } else {
      setLessons(INITIAL_LESSONS);
      localStorage.setItem('tv1_lessons', JSON.stringify(INITIAL_LESSONS));
    }

    if (savedProgressJson) setProgress(JSON.parse(savedProgressJson));
    if (savedThemeJson) setCurrentTheme(JSON.parse(savedThemeJson));
    if (savedStudentsJson) setStudents(JSON.parse(savedStudentsJson));
    if (savedClassroomsJson) setClassrooms(JSON.parse(savedClassroomsJson));

    // Tải dữ liệu từ Firebase để đồng bộ (đặc biệt hữu ích cho Giáo viên)
    const syncFirebase = async () => {
      const cloudData = await getProgressFromFirebase();
      if (cloudData.length > 0) setProgress(cloudData);
    };
    syncFirebase();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', currentTheme.primaryColor);
    root.style.setProperty('--secondary-color', currentTheme.secondaryColor);
    root.style.setProperty('--background-color', currentTheme.backgroundColor);
    document.body.style.backgroundColor = currentTheme.backgroundColor;
    localStorage.setItem('tv1_theme', JSON.stringify(currentTheme));
  }, [currentTheme]);

  const handleSaveLesson = (updatedLesson: Lesson) => {
    const newLessons = lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l);
    setLessons(newLessons);
    localStorage.setItem('tv1_lessons', JSON.stringify(newLessons));
    setEditingLesson(null);
  };

  const handleSaveStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    localStorage.setItem('tv1_students', JSON.stringify(newStudents));
  };

  const handleClearStudentData = (studentIds: string[]) => {
    const newProgress = progress.filter(p => !p.studentId || !studentIds.includes(p.studentId));
    setProgress(newProgress);
    localStorage.setItem('tv1_progress', JSON.stringify(newProgress));
  };

  const handleSaveProgress = (record: Omit<ProgressRecord, 'id' | 'timestamp'>) => {
    const newRecord: ProgressRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now(),
      studentId: activeStudent?.id,
      studentName: activeStudent?.name
    };
    const newProgress = [newRecord, ...progress];
    setProgress(newProgress);
    localStorage.setItem('tv1_progress', JSON.stringify(newProgress));

    // Lưu song song lên Firebase
    saveProgressToFirebase(newRecord);
  };

  const handleLogout = () => {
    setUserRole(null);
    setActiveStudent(null);
    setCurrentView(AppView.LOGIN);
  };

  const renderView = () => {
    if (currentView === AppView.LOGIN) {
      return (
        <LoginView
          students={students}
          classrooms={classrooms}
          onSelectStudent={(student) => {
            setActiveStudent(student);
            setUserRole('student');
            setCurrentView(AppView.HOME);
          }}
          onSelectTeacher={() => {
            setUserRole('teacher');
            setCurrentView(AppView.HOME);
          }}
        />
      );
    }

    switch (currentView) {
      case AppView.HOME:
        return <HomeView onNavigate={(view) => setCurrentView(view)} activeStudent={activeStudent} />;
      case AppView.READING:
        return (
          <ReadingView
            lessons={lessons}
            onBack={() => setCurrentView(AppView.HOME)}
            isTeacherMode={userRole === 'teacher'}
            onEditLesson={(lesson) => setEditingLesson(lesson)}
            onSaveProgress={handleSaveProgress}
            activeStudentId={activeStudent?.id}
          />
        );
      case AppView.WRITING:
        return (
          <WritingView
            onBack={() => setCurrentView(AppView.HOME)}
            onSaveProgress={handleSaveProgress}
          />
        );
      case AppView.EXERCISE:
        return <ExerciseView lessons={lessons} onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.CREATIVE:
        return <CreativeView onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.CHAT:
        return <ChatView onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.TEACHER_DASHBOARD:
        return (
          <TeacherDashboard
            lessons={lessons}
            progress={progress}
            students={students}
            classrooms={classrooms}
            onEditLesson={(l) => setEditingLesson(l)}
            onSaveStudents={handleSaveStudents}
            onClearStudentData={handleClearStudentData}
            onSaveClassrooms={(c) => {
              setClassrooms(c);
              localStorage.setItem('tv1_classrooms', JSON.stringify(c));
            }}
          />
        );
      case AppView.PARENT_DASHBOARD:
        return <ParentDashboard progress={progress} currentTheme={currentTheme} onUpdateTheme={setCurrentTheme} activeStudent={activeStudent} />;
      default:
        return <HomeView onNavigate={(view) => setCurrentView(view)} activeStudent={activeStudent} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {currentView !== AppView.LOGIN && (
        <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-orange-100">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView(AppView.HOME)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ backgroundColor: 'var(--primary-color)' }}>
              TV
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-800 leading-none">Tiếng Việt 1</h1>
              <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--primary-color)' }}>Kết Nối Tri Thức</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {activeStudent && (
              <div className="hidden md:flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: activeStudent.avatarColor }}>
                  {activeStudent.name.charAt(0)}
                </div>
                <span className="text-xs font-black text-orange-700">{activeStudent.name}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              <LogOut size={16} /> Thoát
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto">{renderView()}</div>
      </main>

      {currentView !== AppView.LOGIN && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-orange-50 px-6 py-4 flex justify-around items-center md:justify-center md:gap-16 z-[60] shadow-2xl rounded-t-[2.5rem]">
          {NAV_ITEMS.filter(item => {
            if (userRole === 'student') return item.id !== AppView.TEACHER_DASHBOARD;
            return true;
          }).map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as AppView)}
              className={`flex flex-col items-center gap-1.5 transition-all group ${currentView === item.id ? '' : 'text-gray-400'}`}
              style={currentView === item.id ? { color: 'var(--primary-color)' } : {}}
            >
              <div className={`p-2.5 rounded-2xl transition-all ${currentView === item.id ? 'text-white shadow-lg -translate-y-2' : 'group-hover:bg-orange-50'}`} style={currentView === item.id ? { backgroundColor: 'var(--primary-color)' } : {}}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentView === item.id ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {editingLesson && (
        <LessonEditor lesson={editingLesson} onSave={handleSaveLesson} onCancel={() => setEditingLesson(null)} onReset={() => { }} />
      )}
      {/* Version Indicator */}
      <div style={{ position: 'fixed', bottom: '2px', right: '5px', fontSize: '10px', color: '#ddd', pointerEvents: 'none', zIndex: 9999 }}>
        V1.9 - Gemini Model Fix
      </div>
    </div>
  );
};

export default App;

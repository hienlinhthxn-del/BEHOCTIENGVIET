
import React, { useState } from 'react';
import { Lesson, Exercise } from '../types';
import { LESSONS as SGK_LESSONS } from '../constants';
import { X, Save, Plus, Trash2, RotateCcw, Copy, BookOpen, Edit3, ArrowRight, Mic } from 'lucide-react';

interface LessonEditorProps {
  lesson: Lesson;
  onSave: (updatedLesson: Lesson) => void;
  onCancel: () => void;
  onReset: () => void;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, onSave, onCancel, onReset }) => {
  const [editedLesson, setEditedLesson] = useState<Lesson>({ ...lesson });

  // Lấy dữ liệu gốc từ hằng số để làm tham chiếu
  const originalSgkLesson = SGK_LESSONS.find(l => l.id === lesson.id);

  const handleUpdateContent = (field: string, value: string[]) => {
    setEditedLesson({
      ...editedLesson,
      content: {
        ...editedLesson.content,
        [field]: value
      }
    });
  };

  const handleUpdateExercise = (id: string, field: string, value: string) => {
    const updatedExercises = editedLesson.content.exercises?.map(ex =>
      ex.id === id ? { ...ex, [field]: value } : ex
    );
    setEditedLesson({
      ...editedLesson,
      content: { ...editedLesson.content, exercises: updatedExercises }
    });
  };

  const addExercise = () => {
    const newEx: Exercise = {
      id: Date.now().toString(),
      type: 'word_finding',
      question: 'Câu hỏi mới?',
      expectedConcept: ''
    };
    setEditedLesson({
      ...editedLesson,
      content: {
        ...editedLesson.content,
        exercises: [...(editedLesson.content.exercises || []), newEx]
      }
    });
  };

  const deleteExercise = (id: string) => {
    setEditedLesson({
      ...editedLesson,
      content: {
        ...editedLesson.content,
        exercises: editedLesson.content.exercises?.filter(ex => ex.id !== id)
      }
    });
  };

  // Fix: Corrected type signature for field to ensure it is treated as a string when calling handleUpdateContent
  const copyFromSgk = (field: keyof typeof lesson.content) => {
    if (originalSgkLesson && originalSgkLesson.content[field]) {
      // Cast field to string to satisfy handleUpdateContent's requirement for a string parameter
      handleUpdateContent(field as string, originalSgkLesson.content[field] as string[]);
    }
  };

  const handleUpdateOverrides = (key: string, value: string) => {
    const currentOverrides = editedLesson.content.pronunciationOverrides || {};
    if (!value) {
      const { [key]: deleted, ...rest } = currentOverrides;
      setEditedLesson({
        ...editedLesson,
        content: { ...editedLesson.content, pronunciationOverrides: rest }
      });
    } else {
      setEditedLesson({
        ...editedLesson,
        content: {
          ...editedLesson.content,
          pronunciationOverrides: { ...currentOverrides, [key]: value }
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 md:p-8">
      <div className="bg-white w-full max-w-7xl h-full max-h-[95vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-t-[12px] border-purple-600 animate-pop">

        {/* Header */}
        <div className="px-8 py-6 border-b flex justify-between items-center bg-purple-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Edit3 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-purple-900">Bàn Làm Việc Của Giáo Viên</h2>
              <p className="text-purple-600 text-sm font-bold">Đang chỉnh sửa: {lesson.title} (Tập {lesson.volume})</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 hover:bg-white rounded-full transition-colors text-purple-900 shadow-sm"><X /></button>
        </div>

        {/* Main Workspace (Split View) */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left Panel: SGK Reference (Read Only) */}
          <div className="w-1/3 bg-gray-50 border-r overflow-y-auto p-6 hidden lg:block">
            <div className="flex items-center gap-2 mb-6 text-gray-500">
              <BookOpen size={20} />
              <h3 className="font-black uppercase tracking-widest text-xs">Nội dung SGK gốc (Tham khảo)</h3>
            </div>

            <div className="space-y-8 opacity-70">
              <SgkRefSection title="Âm/Vần" content={originalSgkLesson?.content.sounds} />
              <SgkRefSection title="Từ ngữ" content={originalSgkLesson?.content.words} />
              <SgkRefSection title="Câu" content={originalSgkLesson?.content.sentences} />
              <SgkRefSection title="Đoạn văn" content={originalSgkLesson?.content.paragraphs} />

              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Bài tập mặc định</p>
                {originalSgkLesson?.content.exercises?.map((ex, i) => (
                  <div key={i} className="text-xs p-3 bg-white rounded-xl border border-gray-100 italic">
                    {ex.question}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Editor (Active) */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-white">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditorField label="Tiêu đề bài học">
                <input
                  type="text"
                  value={editedLesson.title}
                  onChange={(e) => setEditedLesson({ ...editedLesson, title: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-purple-50/30 border-2 border-purple-100 focus:border-purple-400 outline-none font-bold text-purple-900"
                />
              </EditorField>
              <EditorField label="Số trang (SGK)">
                <input
                  type="number"
                  value={editedLesson.pageNumber}
                  onChange={(e) => setEditedLesson({ ...editedLesson, pageNumber: parseInt(e.target.value) })}
                  className="w-full p-4 rounded-2xl bg-purple-50/30 border-2 border-purple-100 focus:border-purple-400 outline-none font-bold"
                />
              </EditorField>
            </div>

            <hr className="border-gray-100" />

            {/* Arrays Editing with Copy buttons */}
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Âm / Vần (Cách nhau bằng dấu phẩy)</label>
                  <button onClick={() => copyFromSgk('sounds')} className="text-[10px] flex items-center gap-1 text-purple-600 font-bold hover:underline"><Copy size={12} /> Chép từ SGK</button>
                </div>
                <textarea
                  value={editedLesson.content.sounds?.join(', ') || ''}
                  onChange={(e) => handleUpdateContent('sounds', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 outline-none min-h-[60px] font-bold text-xl text-orange-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Từ ngữ (Cách nhau bằng dấu phẩy)</label>
                  <button onClick={() => copyFromSgk('words')} className="text-[10px] flex items-center gap-1 text-purple-600 font-bold hover:underline"><Copy size={12} /> Chép từ SGK</button>
                </div>
                <textarea
                  value={editedLesson.content.words?.join(', ') || ''}
                  onChange={(e) => handleUpdateContent('words', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 outline-none min-h-[80px] font-bold text-lg text-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Câu luyện đọc (Mỗi câu 1 dòng)</label>
                    <button onClick={() => copyFromSgk('sentences')} className="text-[10px] flex items-center gap-1 text-purple-600 font-bold hover:underline"><Copy size={12} /> Chép từ SGK</button>
                  </div>
                  <textarea
                    value={editedLesson.content.sentences?.join('\n') || ''}
                    onChange={(e) => handleUpdateContent('sentences', e.target.value.split('\n').filter(s => s.trim()))}
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 outline-none min-h-[120px] font-medium text-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đoạn văn (Mỗi đoạn 1 dòng)</label>
                    <button onClick={() => copyFromSgk('paragraphs')} className="text-[10px] flex items-center gap-1 text-purple-600 font-bold hover:underline"><Copy size={12} /> Chép từ SGK</button>
                  </div>
                  <textarea
                    value={editedLesson.content.paragraphs?.join('\n') || ''}
                    onChange={(e) => handleUpdateContent('paragraphs', e.target.value.split('\n').filter(s => s.trim()))}
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 outline-none min-h-[120px] font-medium text-purple-800"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Pronunciation Overrides Section */}
            <div className="space-y-4 bg-purple-50/30 p-6 rounded-[2rem] border border-purple-100">
              <h4 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Mic size={24} className="text-purple-600" />
                Cấu hình phát âm (Sửa lỗi đọc mẫu)
              </h4>
              <p className="text-sm text-gray-500">Nếu AI đọc chưa đúng từ nào (ví dụ chữ "g" đọc là "giê"), thầy cô hãy thêm từ đó và cách đọc mong muốn (ví dụ "gờ") vào đây.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* List existing */}
                {Object.entries(editedLesson.content.pronunciationOverrides || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                    <div className="flex-1 grid grid-cols-2 gap-2 items-center">
                      <div className="font-bold text-gray-700 px-2 text-right">{key}</div>
                      <ArrowRight size={14} className="text-gray-300 mx-auto" />
                      <div className="text-purple-600 font-black px-2">{value}</div>
                    </div>
                    <button onClick={() => handleUpdateOverrides(key, '')} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>

              {/* Add new */}
              <div className="flex gap-2 items-end bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mt-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Từ hiển thị trên màn hình</label>
                  <input type="text" id="new-override-key" placeholder="VD: g" className="w-full p-2 rounded-lg border border-gray-300 outline-none focus:border-purple-400 font-bold" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Cách đọc thay thế</label>
                  <input type="text" id="new-override-value" placeholder="VD: gờ" className="w-full p-2 rounded-lg border border-gray-300 outline-none focus:border-purple-400 font-bold text-purple-600" />
                </div>
                <button
                  onClick={() => {
                    const keyInput = document.getElementById('new-override-key') as HTMLInputElement;
                    const valueInput = document.getElementById('new-override-value') as HTMLInputElement;
                    if (keyInput.value && valueInput.value) {
                      handleUpdateOverrides(keyInput.value, valueInput.value);
                      keyInput.value = '';
                      valueInput.value = '';
                      keyInput.focus();
                    }
                  }}
                  className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md active:scale-95 transition-all"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Exercises section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-black text-gray-800">Thử thách vận dụng của riêng lớp</h4>
                <button onClick={addExercise} className="flex items-center gap-2 text-sm font-black text-white bg-purple-600 px-5 py-2.5 rounded-2xl hover:bg-purple-700 shadow-md transition-all active:scale-95">
                  <Plus size={18} /> Thêm bài tập
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {editedLesson.content.exercises?.map((ex, idx) => (
                  <div key={ex.id} className="p-6 bg-purple-50/50 rounded-[2rem] border-2 border-purple-100 space-y-4 relative animate-pop" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <button
                      onClick={() => deleteExercise(ex.id)}
                      className="absolute top-6 right-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-xs">{idx + 1}</span>
                      <input
                        type="text"
                        value={ex.question}
                        onChange={(e) => handleUpdateExercise(ex.id, 'question', e.target.value)}
                        className="flex-1 p-3 bg-white rounded-xl border-2 border-purple-50 outline-none focus:border-purple-400 font-bold text-gray-800"
                        placeholder="Nhập câu hỏi thử thách..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Gợi ý cho bé</label>
                        <input
                          type="text"
                          value={ex.hint || ''}
                          onChange={(e) => handleUpdateExercise(ex.id, 'hint', e.target.value)}
                          className="w-full p-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-purple-400 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Từ khóa chấm điểm (AI)</label>
                        <input
                          type="text"
                          value={ex.expectedConcept}
                          onChange={(e) => handleUpdateExercise(ex.id, 'expectedConcept', e.target.value)}
                          className="w-full p-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-purple-400 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(!editedLesson.content.exercises || editedLesson.content.exercises.length === 0) && (
                  <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 italic">
                    Chưa có bài tập vận dụng nào. Hãy thêm để bé luyện tập thêm nhé!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t bg-white flex flex-col md:flex-row justify-between items-center gap-6">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-red-500 font-bold px-6 py-3 rounded-2xl hover:bg-red-50 transition-colors"
          >
            <RotateCcw size={18} /> Khôi phục tất cả bài về SGK gốc
          </button>

          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 md:flex-none px-10 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Hủy thay đổi
            </button>
            <button
              onClick={() => onSave(editedLesson)}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-16 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-1 transition-all active:scale-95"
            >
              <Save size={22} /> Lưu & Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const SgkRefSection: React.FC<{ title: string; content?: string[] }> = ({ title, content }) => {
  if (!content || content.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
        {title} <ArrowRight size={10} />
      </div>
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-600 font-medium leading-relaxed">
        {content.join(title === 'Âm/Vần' || title === 'Từ ngữ' ? ', ' : '\n')}
      </div>
    </div>
  );
};

export default LessonEditor;

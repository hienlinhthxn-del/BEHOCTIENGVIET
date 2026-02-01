
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Exercise, ProgressRecord, MatchingPair } from '../types';
import { uploadAudioFile } from '../firebase';
import { ChevronLeft, Mic, Volume2, BookOpen, Star, Loader2, X, Square, Trophy, Lightbulb, Sparkles, Edit3, Play, Download, Trash2, Headphones, Filter, Link2, MousePointer2 } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { GeminiService } from '../services/geminiService';

interface ReadingViewProps {
  lessons: Lesson[];
  onBack: () => void;
  isTeacherMode?: boolean;
  onEditLesson?: (lesson: Lesson) => void;
  onSaveProgress: (record: Omit<ProgressRecord, 'id' | 'timestamp'>) => void;
  activeStudentId?: string;
}

const ReadingView: React.FC<ReadingViewProps> = ({ lessons, onBack, isTeacherMode, onEditLesson, onSaveProgress, activeStudentId }) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeVolume, setActiveVolume] = useState<1 | 2>(1);
  const [isReadingAloud, setIsReadingAloud] = useState<string | null>(null);
  const [lessonRange, setLessonRange] = useState<string>('1-20');

  // Matching Game State
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);

  // Recording/Grading state
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ score: number, comment: string } | null>(null);

  // Audio playback state for recorded audio
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const gemini = GeminiService.getInstance();

  const filteredLessons = lessons.filter(l => {
    if (l.volume !== activeVolume) return false;
    if (activeVolume === 1) {
      const idNum = parseInt(l.id);
      if (isNaN(idNum)) return true;
      const [min, max] = lessonRange.split('-').map(Number);
      return idNum >= min && idNum <= max;
    }
    return true;
  });

  useEffect(() => {
    if (selectedLesson) {
      const updated = lessons.find(l => l.id === selectedLesson.id);
      if (updated) setSelectedLesson(updated);
    }
  }, [lessons]);

  const handleReadAloud = async (text: string, id: string) => {
    if (isReadingAloud === id) return;

    // Kiểm tra xem có cấu hình sửa lỗi phát âm cho từ này không
    let textToSpeak = text;
    const overrides = selectedLesson?.content.pronunciationOverrides;

    if (overrides) {
      // Nếu khớp chính xác từ đơn
      if (overrides[text]) {
        textToSpeak = overrides[text];
      } else if (text.includes(',')) {
        // Nếu là danh sách (nút Loa to), thử thay thế từng từ trong danh sách
        textToSpeak = text.split(',').map(part => {
          const trimmed = part.trim();
          return overrides[trimmed] || part;
        }).join(',');
      }
    }

    await gemini.speak(textToSpeak, () => setIsReadingAloud(id), () => setIsReadingAloud(null));
  };

  const handleMatchSelect = (type: 'word' | 'target', pair: MatchingPair) => {
    if (type === 'word') {
      if (matchedIds.includes(pair.id)) return;
      setSelectedWordId(pair.id);
      handleReadAloud(pair.word, `word-${pair.id}`);
    } else {
      if (matchedIds.includes(pair.id)) return;

      if (!selectedWordId) {
        handleReadAloud(pair.word, `match-sound-${pair.id}`);
        return;
      }

      if (selectedWordId === pair.id) {
        setMatchedIds(prev => [...prev, pair.id]);
        setSelectedWordId(null);
        handleReadAloud("Chính xác!", `match-ok-${pair.id}`);

        const matchingExercise = selectedLesson?.content.exercises?.find(ex => ex.type === 'matching');
        if (matchingExercise && matchedIds.length + 1 === matchingExercise.matchingPairs?.length) {
          setTimeout(() => {
            setGradeResult({ score: 10, comment: "Tuyệt vời! Bé đã nối đúng tất cả các cặp từ và âm thanh rồi đó." });
            onSaveProgress({
              lessonId: selectedLesson!.id,
              lessonTitle: selectedLesson!.title,
              activityType: 'exercise',
              score: 10,
              comment: "Hoàn thành trò chơi nối cặp xuất sắc!"
            });
          }, 800);
        }
      } else {
        setWrongId(pair.id);
        setTimeout(() => setWrongId(null), 500);
        handleReadAloud("Bé chọn lại nhé!", `fail-${pair.id}`);
      }
    }
  };

  const startSectionRecording = async (textArray: string[], sectionId: string, isExercise: boolean = false) => {
    const fullText = textArray.join(" ");
    try {
      setIsRecording(sectionId);
      setRecordedAudioUrl(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Kiểm tra độ dài âm thanh (tránh ghi âm trắng)
        if (audioChunksRef.current.length === 0 || audioBlob.size < 1000) {
          alert("Ghi âm quá ngắn hoặc không có tiếng, bé thử lại nhé!");
          setIsRecording(null);
          return;
        }

        // Upload lên Firebase Storage (nếu có thể)
        let cloudAudioUrl = "";
        if (activeStudentId) {
          try {
            cloudAudioUrl = await uploadAudioFile(audioBlob, activeStudentId);
          } catch (err) { console.error("Upload failed", err); }
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsGrading(true);
          try {
            let result;
            if (isExercise && activeExercise) {
              result = await gemini.evaluateExercise(base64Audio, activeExercise.question, activeExercise.expectedConcept, mimeType);
            } else {
              result = await gemini.evaluateReading(base64Audio, fullText, mimeType);
            }
            setGradeResult(result);

            // Luôn lưu kết quả bài làm
            onSaveProgress({
              lessonId: selectedLesson!.id,
              lessonTitle: selectedLesson!.title,
              activityType: 'reading',
              score: result.score,
              comment: result.comment,
              audioUrl: cloudAudioUrl || url,
              audioBase64: base64Audio
            });
          } catch (err) {
            console.error("Lỗi chấm điểm:", err);
            alert("Cô Gemini đang bận một chút, bé thử lại sau nhé!");
          } finally {
            setIsGrading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err: any) {
      console.error("Microphone access error:", err);
      let errorMessage = "Micro lỗi.";

      if (err.name === 'NotAllowedError') {
        errorMessage = "Bé chưa cho phép sử dụng Micro. Hãy nhấn 'Cho phép' trên trình duyệt nhé!";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "Máy không tìm thấy Micro. Bé kiểm tra lại thiết bị nhé!";
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = "Tính năng này cần kết nối bảo mật (HTTPS) để hoạt động.";
      }

      alert(errorMessage);
      setIsRecording(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsRecording(null);
  };

  const renderStars = (score: number) => {
    const starsCount = Math.ceil(score / 2);
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={36} className={`${i < starsCount ? 'fill-yellow-400 text-yellow-400 animate-star' : 'text-gray-200'}`} />
    ));
  };

  if (selectedLesson) {
    const matchingEx = selectedLesson.content.exercises?.find(ex => ex.type === 'matching');
    const shuffledTargets = matchingEx?.matchingPairs ? [...matchingEx.matchingPairs].sort((a, b) => a.id.localeCompare(b.id)) : [];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500 pb-20">
        <div className="flex justify-between items-center">
          <button onClick={() => { setSelectedLesson(null); setActiveExercise(null); setRecordedAudioUrl(null); setMatchedIds([]); setSelectedWordId(null); }} className="group flex items-center gap-2 text-blue-600 font-bold bg-white px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <ChevronLeft /> Quay lại danh sách
          </button>

          <div className="flex gap-3">
            {recordedAudioUrl && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                <button onClick={() => { const a = new Audio(recordedAudioUrl); a.play(); }} className="flex items-center gap-2 text-blue-600 font-black text-sm">
                  <Play size={16} fill="currentColor" /> Nghe lại
                </button>
              </div>
            )}
            {isTeacherMode && onEditLesson && (
              <button onClick={() => onEditLesson(selectedLesson)} className="flex items-center gap-2 bg-purple-100 text-purple-700 px-6 py-2 rounded-2xl font-black shadow-sm">
                <Edit3 size={18} /> Sửa bài
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-t-8 border-orange-400">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 leading-tight">{selectedLesson.title}</h2>
            <p className="text-orange-600 font-bold mt-2 italic">Trang {selectedLesson.pageNumber} • Tập {selectedLesson.volume}</p>
          </div>

          <div className="space-y-16">
            {selectedLesson.content.sounds && selectedLesson.content.sounds.length > 0 && (
              <section className={`space-y-6 p-6 rounded-[3rem] ${isRecording === 'section-sounds' ? 'bg-orange-50 ring-4 ring-orange-200' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-orange-600 flex items-center gap-4">
                    <span className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">1</span> Phát âm
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => handleReadAloud(selectedLesson.content.sounds!.join(", "), 'sound-all')} className="p-3 bg-white text-orange-600 rounded-2xl border-2 border-orange-100"><Volume2 /></button>
                    <button onClick={() => isRecording === 'section-sounds' ? stopRecording() : startSectionRecording(selectedLesson.content.sounds!, 'section-sounds')} className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 ${isRecording === 'section-sounds' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-600 text-white shadow-lg'}`}>
                      {isRecording === 'section-sounds' ? <Square size={20} /> : <Mic size={20} />} {isRecording === 'section-sounds' ? 'Dừng' : 'Luyện đọc'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pl-4">
                  {selectedLesson.content.sounds.map((sound, idx) => (
                    <div key={idx} className="bg-white px-8 py-4 rounded-2xl text-5xl font-black text-orange-700 border-2 border-orange-50 shadow-sm">
                      {sound}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {selectedLesson.content.words && selectedLesson.content.words.length > 0 && (
              <section className={`space-y-6 p-6 rounded-[3rem] ${isRecording === 'section-words' ? 'bg-blue-50 ring-4 ring-blue-200' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-blue-600 flex items-center gap-4">
                    <span className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">2</span> Từ ngữ
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => handleReadAloud(selectedLesson.content.words!.join(", "), 'word-all')} className="p-3 bg-white text-blue-600 rounded-2xl border-2 border-blue-100"><Volume2 /></button>
                    <button onClick={() => isRecording === 'section-words' ? stopRecording() : startSectionRecording(selectedLesson.content.words!, 'section-words')} className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 ${isRecording === 'section-words' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {isRecording === 'section-words' ? <Square size={20} /> : <Mic size={20} />} {isRecording === 'section-words' ? 'Dừng' : 'Luyện đọc'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-4">
                  {selectedLesson.content.words.map((word, idx) => (
                    <div key={idx} className="bg-white px-4 py-4 rounded-xl text-2xl font-bold text-blue-800 border-b-4 border-blue-100 text-center">
                      {word}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {selectedLesson.content.paragraphs && selectedLesson.content.paragraphs.length > 0 && (
              <section className={`space-y-6 p-8 rounded-[3rem] ${isRecording === 'section-paragraphs' ? 'bg-green-50 ring-4 ring-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-green-700 flex items-center gap-4">
                    <span className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">3</span> Luyện đọc đoạn văn
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => handleReadAloud(selectedLesson.content.paragraphs!.join(" "), 'para-all')} className="p-3 bg-white text-green-600 rounded-2xl border-2 border-green-100"><Volume2 /></button>
                    <button onClick={() => isRecording === 'section-paragraphs' ? stopRecording() : startSectionRecording(selectedLesson.content.paragraphs!, 'section-paragraphs')} className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg ${isRecording === 'section-paragraphs' ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white'}`}>
                      {isRecording === 'section-paragraphs' ? <Square size={20} /> : <Mic size={20} />} {isRecording === 'section-paragraphs' ? 'Dừng & Chấm điểm' : 'Đọc cả đoạn'}
                    </button>
                  </div>
                </div>
                <div className="space-y-8 pl-4">
                  {selectedLesson.content.paragraphs.map((para, idx) => (
                    <p key={idx} className="text-3xl font-medium text-gray-700 leading-relaxed bg-white p-8 rounded-[2rem] shadow-sm border-l-8 border-green-400">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {matchingEx && matchingEx.matchingPairs && (
              <section className="space-y-10 p-10 rounded-[4rem] bg-indigo-50/50 border-4 border-dashed border-indigo-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none transform rotate-12">
                  <Link2 size={200} className="text-indigo-600" />
                </div>
                <div className="text-center space-y-3 relative z-10">
                  <h3 className="text-3xl font-black text-indigo-800 flex items-center justify-center gap-4">
                    <Sparkles className="text-yellow-400" /> Thử thách Nối cặp <Sparkles className="text-yellow-400" />
                  </h3>
                  <div className="flex items-center justify-center gap-2 bg-white/80 w-fit mx-auto px-6 py-2 rounded-full shadow-sm border border-indigo-100">
                    <MousePointer2 size={16} className="text-indigo-500 animate-bounce" />
                    <p className="text-indigo-600 font-black text-sm uppercase tracking-wider">Bé nhấn chọn Chữ, rồi nhấn chọn Loa tương ứng nhé!</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-20 max-w-3xl mx-auto relative px-10">
                  <div className="space-y-6 z-10">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] text-center mb-4">Cột Chữ cái</p>
                    {matchingEx.matchingPairs.map((pair) => (
                      <button
                        key={`word-${pair.id}`}
                        onClick={() => handleMatchSelect('word', pair)}
                        className={`w-full p-6 rounded-[2.5rem] text-3xl font-black shadow-lg transition-all border-b-[12px] flex items-center justify-center relative ${matchedIds.includes(pair.id)
                          ? 'bg-green-500 text-white border-green-700 translate-y-2 opacity-60'
                          : selectedWordId === pair.id
                            ? 'bg-indigo-600 text-white border-indigo-900 ring-8 ring-indigo-200 scale-105'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:-translate-y-1'
                          }`}
                      >
                        {pair.word}
                        {matchedIds.includes(pair.id) && (
                          <div className="absolute -right-4 -top-4 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                            <Star size={20} fill="currentColor" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6 z-10">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] text-center mb-4">Cột Âm thanh</p>
                    {shuffledTargets.map((pair) => (
                      <button
                        key={`target-${pair.id}`}
                        onClick={() => handleMatchSelect('target', pair)}
                        className={`w-full p-6 rounded-[2.5rem] flex items-center justify-center shadow-lg transition-all border-b-[12px] relative ${matchedIds.includes(pair.id)
                          ? 'bg-green-500 text-white border-green-700 translate-y-2 opacity-60'
                          : wrongId === pair.id
                            ? 'bg-red-500 text-white border-red-900 animate-shake'
                            : 'bg-white text-indigo-500 border-gray-200 hover:border-indigo-300 hover:-translate-y-1'
                          }`}
                      >
                        <Volume2 size={48} className={`${isReadingAloud === `match-sound-${pair.id}` ? 'animate-pulse scale-110' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {isGrading && (
          <div className="fixed inset-0 z-[110] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-24 h-24 text-blue-600 animate-spin" />
            <p className="text-3xl font-black text-blue-900">Cô Gemini đang chấm bài...</p>
          </div>
        )}

        {gradeResult && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm" onClick={() => { setGradeResult(null); setRecordedAudioUrl(null); }}></div>
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl relative z-10 border-t-[12px] border-orange-400 text-center space-y-8">
              <button onClick={() => { setGradeResult(null); setRecordedAudioUrl(null); }} className="absolute top-6 right-6 p-2 text-gray-400"><X /></button>
              <h3 className="text-3xl font-black text-gray-800">Kết quả của bé</h3>
              <div className="flex justify-center gap-2">{renderStars(gradeResult.score)}</div>
              <div className="py-8 bg-orange-50 rounded-[2.5rem] border-4 border-dashed border-orange-100">
                <div className="text-7xl font-black text-orange-600">{gradeResult.score}<span className="text-3xl text-orange-300">/10</span></div>
              </div>
              <p className="text-blue-900 font-medium italic text-lg leading-relaxed">"{gradeResult.comment}"</p>
              <button onClick={() => { setGradeResult(null); setRecordedAudioUrl(null); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">Học tiếp nào!</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/50 p-6 rounded-[2.5rem] backdrop-blur-sm border border-white/50 shadow-sm">
        <div><h2 className="text-4xl font-black text-gray-800 flex items-center gap-3"><Sparkles className="text-orange-400 animate-pulse" />Luyện Đọc</h2><p className="text-gray-500 text-lg font-medium">Chọn bài học bé muốn luyện tập nhé!</p></div>
        <div className="flex flex-col gap-4">
          <div className="flex bg-white p-2 rounded-[2rem] shadow-lg ring-4 ring-orange-50">
            {[1, 2].map(v => (
              <button key={v} onClick={() => setActiveVolume(v as 1 | 2)} className={`px-10 py-3 rounded-[1.5rem] font-black text-lg transition-all ${activeVolume === v ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400'}`}>Tập {v}</button>
            ))}
          </div>
          {activeVolume === 1 && (
            <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-orange-100 self-end">
              <Filter size={14} className="ml-2 text-orange-400" />
              <select value={lessonRange} onChange={(e) => setLessonRange(e.target.value)} className="bg-transparent text-xs font-black text-orange-600 outline-none pr-4">
                <option value="1-20">Bài 1 - 20</option>
                <option value="21-40">Bài 21 - 40</option>
                <option value="41-60">Bài 41 - 60</option>
                <option value="61-83">Bài 61 - 83</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLessons.map((lesson) => (
          <button key={lesson.id} onClick={() => setSelectedLesson(lesson)} className="w-full group bg-white p-8 rounded-[3rem] shadow-xl border-b-[12px] border-gray-100 hover:border-orange-300 hover:-translate-y-3 transition-all text-left flex items-center justify-between">
            <div className="space-y-3">
              <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${lesson.volume === 2 ? 'bg-purple-500' : 'bg-blue-500'} text-white`}>
                {lesson.volume === 1 ? `Bài ${lesson.id}` : 'Tập 2'}
              </span>
              <h3 className="font-black text-2xl text-gray-800 group-hover:text-orange-600 transition-colors line-clamp-2">{lesson.title}</h3>
              <p className="text-gray-400 font-bold">Trang {lesson.pageNumber}</p>
            </div>
            <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-inner">
              <BookOpen size={32} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReadingView;

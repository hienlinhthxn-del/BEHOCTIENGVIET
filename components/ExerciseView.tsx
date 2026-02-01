
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Exercise, MatchingPair } from '../types';
import { ChevronLeft, Trophy, Star, Sparkles, X, PartyPopper, Lightbulb, Volume2, CheckCircle2, AlertCircle, Link2, MousePointer2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface ExerciseViewProps {
  lessons: Lesson[];
  onBack: () => void;
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ lessons, onBack }) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Matching state
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [isReadingAloud, setIsReadingAloud] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gemini = GeminiService.getInstance();

  const lessonsWithExercises = lessons.filter(l => l.content.exercises && l.content.exercises.length > 0);

  const startExercise = (lesson: Lesson, exercise: Exercise) => {
    setSelectedLesson(lesson);
    setActiveExercise(exercise);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowFeedback(false);
    setMatchedIds([]);
    setSelectedWordId(null);
  };


  const handleReadAloud = async (text: string, id: string) => {
    if (isReadingAloud === id) return;
    await gemini.speak(text, () => setIsReadingAloud(id), () => setIsReadingAloud(null));
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const correct = option === activeExercise?.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    handleReadAloud(option, `opt-${option}`);
    if (correct) {
      setTimeout(() => handleReadAloud("Hoan hô! Bé chọn đúng rồi.", "feedback-correct"), 1000);
    } else {
      setTimeout(() => handleReadAloud("Bé thử lại nhé!", "feedback-wrong"), 1000);
    }
  };

  const handleMatchSelect = (type: 'word' | 'target', pair: MatchingPair) => {
    if (type === 'word') {
      if (matchedIds.includes(pair.id)) return;
      setSelectedWordId(pair.id);
      handleReadAloud(pair.word, `word-${pair.id}`);
    } else {
      if (matchedIds.includes(pair.id)) return;
      if (!selectedWordId) {
        handleReadAloud(pair.targetValue, `target-${pair.id}`);
        return;
      }
      if (selectedWordId === pair.id) {
        setMatchedIds(prev => [...prev, pair.id]);
        setSelectedWordId(null);
        handleReadAloud("Chính xác!", `match-ok-${pair.id}`);
        if (matchedIds.length + 1 === activeExercise?.matchingPairs?.length) {
          setTimeout(() => {
            setIsCorrect(true);
            setShowFeedback(true);
            handleReadAloud("Bé thật tuyệt vời, đã nối đúng hết rồi!", "match-all-ok");
          }, 800);
        }
      } else {
        setWrongId(pair.id);
        setTimeout(() => setWrongId(null), 500);
        handleReadAloud("Chưa đúng rồi!", `match-fail-${pair.id}`);
      }
    }
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={36} className={`${i < Math.ceil(score / 2) ? 'fill-yellow-400 text-yellow-400 animate-star' : 'text-gray-200'}`} />
    ));
  };

  if (activeExercise && selectedLesson) {
    const shuffledTargets = activeExercise.matchingPairs ? [...activeExercise.matchingPairs].sort((a, b) => a.id.localeCompare(b.id)) : [];

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <button
          onClick={() => { setActiveExercise(null); setShowFeedback(false); }}
          className="flex items-center gap-2 text-blue-600 font-bold bg-white px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all"
        >
          <ChevronLeft size={20} /> Quay lại danh sách thử thách
        </button>

        <div className="bg-white rounded-[3.5rem] p-8 md:p-12 shadow-2xl border-t-[12px] border-yellow-400 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Trophy size={180} className="text-yellow-500" />
          </div>

          <div className="relative z-10 space-y-12">
            <div className="text-center">
              <span className="px-6 py-2 bg-yellow-100 text-yellow-700 rounded-full text-xs font-black uppercase tracking-widest border border-yellow-200">Thử thách thông minh</span>
              <h2 className="text-4xl font-black text-gray-800 mt-6 leading-tight max-w-3xl mx-auto">{activeExercise.question}</h2>
              {activeExercise.hint && (
                <div className="mt-6 flex items-center justify-center gap-3 text-orange-600 font-bold bg-orange-50 w-fit mx-auto px-6 py-3 rounded-2xl border border-orange-100">
                  <Lightbulb size={22} className="text-yellow-500" /> Gợi ý: {activeExercise.hint}
                </div>
              )}
            </div>

            {/* DẠNG TRẮC NGHIỆM LỰA CHỌN */}
            {activeExercise.type === 'selection' && activeExercise.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {activeExercise.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showFeedback && isCorrect === true}
                    className={`p-8 rounded-[2.5rem] text-3xl font-black transition-all border-b-[12px] shadow-lg flex items-center justify-between group ${selectedOption === option
                      ? isCorrect ? 'bg-green-500 text-white border-green-700' : 'bg-red-500 text-white border-red-700 animate-shake'
                      : 'bg-white text-gray-700 border-gray-100 hover:border-yellow-300 hover:-translate-y-2'
                      }`}
                  >
                    <span className="flex-1 text-center">{option}</span>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedOption === option ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-yellow-50'}`}>
                      <Volume2 size={24} className={isReadingAloud === `opt-${option}` ? 'animate-pulse' : ''} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* DẠNG NỐI CẶP */}
            {activeExercise.type === 'matching' && activeExercise.matchingPairs && (
              <div className="space-y-10 p-10 rounded-[3rem] bg-indigo-50/50 border-4 border-dashed border-indigo-200 relative">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <MousePointer2 size={16} className="text-indigo-500 animate-bounce" />
                  <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Bé hãy nhấn chọn Chữ, rồi nhấn chọn Loa tương ứng nhé!</p>
                </div>
                <div className="grid grid-cols-2 gap-16 max-w-2xl mx-auto">
                  <div className="space-y-4">
                    {activeExercise.matchingPairs.map((pair) => (
                      <button
                        key={`word-${pair.id}`}
                        onClick={() => handleMatchSelect('word', pair)}
                        className={`w-full p-6 rounded-3xl text-2xl font-black shadow-md transition-all border-b-8 flex items-center justify-center ${matchedIds.includes(pair.id)
                          ? 'bg-green-500 text-white border-green-700 opacity-50 cursor-default'
                          : selectedWordId === pair.id
                            ? 'bg-indigo-600 text-white border-indigo-800 ring-4 ring-indigo-200 scale-105'
                            : 'bg-white text-gray-700 border-gray-100 hover:border-indigo-300'
                          }`}
                      >
                        {pair.word}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {shuffledTargets.map((pair) => (
                      <button
                        key={`target-${pair.id}`}
                        onClick={() => handleMatchSelect('target', pair)}
                        className={`w-full p-6 rounded-3xl flex items-center justify-center shadow-md transition-all border-b-8 ${matchedIds.includes(pair.id)
                          ? 'bg-green-500 text-white border-green-700 opacity-50 cursor-default'
                          : wrongId === pair.id
                            ? 'bg-red-500 text-white border-red-700 animate-shake'
                            : 'bg-white text-indigo-500 border-gray-100 hover:border-indigo-300'
                          }`}
                      >
                        <Volume2 size={32} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showFeedback && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm" onClick={() => { if (!isCorrect) setShowFeedback(false); }}></div>
            <div className={`bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl relative z-10 border-t-[12px] ${isCorrect ? 'border-green-400' : 'border-red-400'} animate-pop text-center space-y-8`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                {isCorrect ? <PartyPopper size={180} className="text-yellow-400" /> : <AlertCircle size={180} className="text-red-100" />}
              </div>
              <button onClick={() => setShowFeedback(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X /></button>

              <div className="space-y-4">
                <h3 className="text-4xl font-black text-gray-800">
                  {isCorrect ? 'Tuyệt Vời! 🌟' : 'Tiếc Quá! 🙊'}
                </h3>
                <p className="text-xl font-bold text-gray-500">
                  {isCorrect ? 'Bé đã hoàn thành thử thách xuất sắc.' : 'Bé chọn lại một lần nữa nhé!'}
                </p>
              </div>

              {isCorrect && (
                <div className="flex justify-center gap-2">
                  {renderStars(10)}
                </div>
              )}

              <div className={`py-8 rounded-[2.5rem] border-4 border-dashed ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <div className={`text-7xl font-black ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? '10' : '0'}<span className="text-2xl opacity-50">/10</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowFeedback(false);
                  if (isCorrect) {
                    setActiveExercise(null);
                    setSelectedOption(null);
                  }
                }}
                className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all text-white ${isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
              >
                {isCorrect ? 'Làm thử thách khác nào!' : 'Thử lại ngay'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/50 p-8 rounded-[3rem] backdrop-blur-sm border border-white/50 shadow-sm">
        <div>
          <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <Trophy className="text-yellow-500" /> Thử Thách Thông Thái
          </h2>
          <p className="text-gray-500 text-lg font-medium">Chọn một bài học để bắt đầu thử thách nối cặp hoặc trắc nghiệm nhé! 🚀</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lessonsWithExercises.map((lesson) => (
          <div key={lesson.id} className="bg-white p-8 rounded-[3rem] shadow-xl border-b-[12px] border-gray-100 hover:border-yellow-300 transition-all flex flex-col gap-6 group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">{lesson.title}</span>
                <h3 className="font-black text-2xl text-gray-800 group-hover:text-yellow-600 transition-colors">Vận dụng</h3>
              </div>
              <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500 shadow-inner group-hover:bg-yellow-500 group-hover:text-white transition-all">
                <Sparkles size={28} />
              </div>
            </div>

            <div className="space-y-3">
              {lesson.content.exercises?.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => startExercise(lesson, ex)}
                  className="w-full text-left p-5 bg-gray-50 rounded-2xl hover:bg-yellow-50 hover:translate-x-2 transition-all flex items-center justify-between group/item border border-transparent hover:border-yellow-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {ex.type === 'matching' ? <Link2 size={16} className="text-indigo-400" /> : <CheckCircle2 size={16} className="text-green-400" />}
                    </div>
                    <span className="font-bold text-gray-600 group-hover/item:text-yellow-700 text-sm line-clamp-1">{ex.question}</span>
                  </div>
                  <ChevronLeft size={16} className="rotate-180 text-gray-300 group-hover/item:text-yellow-500" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseView;

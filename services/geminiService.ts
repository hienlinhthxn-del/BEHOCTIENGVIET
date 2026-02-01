import { GoogleGenAI, Type, Modality } from "@google/genai";

export class GeminiService {
  private static instance: GeminiService;
  private audioCtx: AudioContext | null = null;

  private constructor() { }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  // Trò chuyện giáo dục
  async chat(message: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: 'gemini-1.5-pro',
      config: {
        systemInstruction: 'Bạn là một trợ lý giáo dục thân thiện dành cho học sinh lớp 1 tại Việt Nam. Hãy trả lời ngắn gọn, dễ hiểu và khích lệ bé học tập.',
      }
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  }

  // Tìm kiếm thông tin
  async searchInfo(query: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    return {
      text: response.text,
      links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }

  // Vẽ tranh
  async generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: size }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated");
  }

  // Tạo video
  async generateVideo(prompt: string, orientation: '16:9' | '9:16' = '16:9') {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: orientation
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed");
    }
    return `${downloadLink}&key=${apiKey}`;
  }

  // Chấm điểm đọc
  async evaluateReading(audioBase64: string, expectedText: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          { inlineData: { data: audioBase64, mimeType: 'audio/webm' } },
          {
            text: `Đây là âm thanh học sinh lớp 1 Việt Nam đọc bài: "${expectedText}". 
          Hãy nghe và chấm điểm từ 0-10. Nhận xét thật thân thiện kiểu cô giáo tiểu học.
          Định dạng trả về:
          DIEM: [số]
          NHANXET: [lời của cô]` }
        ]
      }
    });

    const text = response.text || "";
    const scoreMatch = text.match(/DIEM:\s*(\d+)/i);
    const commentMatch = text.match(/NHANXET:\s*(.+)/i);

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      comment: commentMatch ? commentMatch[1] : "Cô chưa nghe rõ, bé đọc lại nhé!"
    };
  }

  // Chấm điểm bài tập
  async evaluateExercise(audioBase64: string, question: string, concept: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          { inlineData: { data: audioBase64, mimeType: 'audio/webm' } },
          {
            text: `Câu hỏi: "${question}". Yêu cầu nhắc đến: "${concept}". 
          Nghe audio và chấm điểm 0-10.
          Định dạng:
          DIEM: [số]
          NHANXET: [lời của cô]` }
        ]
      }
    });

    const text = response.text || "";
    const scoreMatch = text.match(/DIEM:\s*(\d+)/i);
    const commentMatch = text.match(/NHANXET:\s*(.+)/i);

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      comment: commentMatch ? commentMatch[1] : "Bé hãy trả lời to hơn nhé!"
    };
  }

  // Chấm điểm tập viết
  async evaluateWriting(imageParts: string, expectedText: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = imageParts.includes(',') ? imageParts.split(',')[1] : imageParts;
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          {
            text: `Ảnh viết chữ: "${expectedText}". Chấm điểm 0-10 và nhận xét.
          Định dạng:
          DIEM: [số]
          NHANXET: [lời của cô]` }
        ]
      }
    });

    const text = response.text || "";
    const scoreMatch = text.match(/DIEM:\s*(\d+)/i);
    const commentMatch = text.match(/NHANXET:\s*(.+)/i);

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      comment: commentMatch ? commentMatch[1] : "Bé viết đẹp lắm, cố gắng nhé!"
    };
  }

  // Phát âm văn bản (TTS) với fallback và chẩn đoán
  async speak(text: string, onStart: () => void, onEnd: () => void) {
    // Đảm bảo onEnd luôn được gọi để không bị treo trạng thái
    let hasEnded = false;
    const safeOnEnd = () => {
      if (!hasEnded) {
        hasEnded = true;
        onEnd();
      }
    };

    // Hàm fallback dùng giọng đọc của trình duyệt (khi hết quota hoặc lỗi mạng)
    const playFallback = () => {
      console.log("Dùng giọng đọc trình duyệt (Fallback)");
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9; // Đọc chậm một chút cho bé dễ nghe

      // Lấy danh sách giọng hiện tại
      let voices = window.speechSynthesis.getVoices();

      // CHIẾN THUẬT CHỌN GIỌNG:
      const voices = window.speechSynthesis.getVoices();
      // Hàm thực hiện đọc (được gọi ngay hoặc sau khi giọng load xong)
      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9;

        // 1. Ưu tiên tuyệt đối các giọng Nữ chuẩn
        let viVoice = voices.find(v => v.name === 'Google Tiếng Việt') // Chrome (Nữ miền Bắc)
          || voices.find(v => v.name.includes('HoaiMy')) // Windows (Nữ miền Bắc)
          || voices.find(v => v.name.includes('Linh'));  // iOS (Nữ)
        // Cập nhật lại danh sách giọng (phòng trường hợp lúc đầu rỗng)
        if (voices.length === 0) voices = window.speechSynthesis.getVoices();

        // 2. Nếu không có, tìm giọng bất kỳ có chữ Female/Nữ
        if (!viVoice) {
          viVoice = voices.find(v => (v.lang.includes('vi') || v.name.includes('Vietnamese')) && (v.name.includes('Female') || v.name.includes('Nữ')));
        }
        // 1. Ưu tiên giọng Nữ chuẩn (Google, HoaiMy, Linh)
        let viVoice = voices.find(v => v.name === 'Google Tiếng Việt')
          || voices.find(v => v.name.includes('HoaiMy'))
          || voices.find(v => v.name.includes('Linh'));

        // 3. Đường cùng: Lấy bất kỳ giọng Việt nào (thường là Microsoft An)
        if (!viVoice) {
          viVoice = voices.find(v => v.lang.includes('vi') || v.name.includes('Vietnamese'));
        }
        // 2. Tìm giọng có chữ Female/Nữ
        if (!viVoice) {
          viVoice = voices.find(v => (v.lang.includes('vi') || v.name.includes('Vietnamese')) && (v.name.includes('Female') || v.name.includes('Nữ')));
        }

        if (viVoice) {
          utterance.voice = viVoice;
          // QUAN TRỌNG: Nếu phát hiện giọng Nam (An, Nam, Male), tăng Pitch thật cao để giả giọng Nữ
          if (viVoice.name.includes('An') || viVoice.name.includes('Nam') || viVoice.name.includes('Male')) {
            utterance.pitch = 1.8; // Mức 1.8 sẽ biến giọng nam trầm thành giọng thanh
            // 3. Lấy bất kỳ giọng Việt nào còn lại
            if (!viVoice) {
              viVoice = voices.find(v => v.lang.includes('vi') || v.name.includes('Vietnamese'));
            }

            if (viVoice) {
              utterance.voice = viVoice;
              // CHIẾN THUẬT PITCH MỚI:
              // Nếu KHÔNG PHẢI là các giọng nữ đã biết -> Mặc định coi là Nam và tăng Pitch lên 1.6
              if (viVoice.name === 'Google Tiếng Việt' || viVoice.name.includes('HoaiMy') || viVoice.name.includes('Linh') || viVoice.name.includes('Female') || viVoice.name.includes('Nữ')) {
                utterance.pitch = 1.0; // Giọng nữ chuẩn thì để tự nhiên
              } else {
                utterance.pitch = 1.6; // Giọng lạ/Nam -> Tăng cao độ để giả giọng nữ
              }
            } else {
              utterance.pitch = 1.1; // Giọng nữ thì giữ tự nhiên
              // Không tìm thấy giọng Việt nào -> Dùng giọng hệ thống nhưng ép pitch cao
              utterance.pitch = 1.6;
            }

            utterance.onend = safeOnEnd;
            utterance.onerror = (e) => {
              console.error("Lỗi giọng đọc trình duyệt:", e);
              safeOnEnd();
            };
            window.speechSynthesis.speak(utterance);
          };

          // Xử lý trường hợp trình duyệt chưa load kịp danh sách giọng (Chrome thường bị)
          if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              doSpeak();
              window.speechSynthesis.onvoiceschanged = null; // Cleanup sự kiện
            };
            // Fallback an toàn: nếu sau 300ms không có sự kiện thì cứ đọc đại
            setTimeout(() => {
              if (window.speechSynthesis.speaking) return;
              doSpeak();
            }, 300);
          } else {
            // Không tìm thấy giọng nào, cứ tăng pitch đề phòng mặc định là nam
            utterance.pitch = 1.6;
            doSpeak();
          }

          utterance.onend = safeOnEnd;
          utterance.onerror = (e) => {
            console.error("Lỗi giọng đọc trình duyệt:", e);
            safeOnEnd();
          };
          window.speechSynthesis.speak(utterance);
        };

        try {
          onStart();

          // Lấy API Key từ nhiều nguồn để đảm bảo không bị lỗi undefined
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY;

          // Chẩn đoán lỗi API Key
          if (!apiKey || apiKey.includes("PLACEHOLDER") || apiKey.length < 10) {
            // Nếu không có key, chuyển ngay sang fallback để tránh delay gây lỗi trên mobile
            console.warn("Chưa có API Key, dùng giọng máy tính ngay lập tức.");
            playFallback();
            return;
          }

          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `Hãy đọc văn bản sau bằng giọng nữ miền Bắc, nhẹ nhàng: "${text}"`,
            contents: `Đọc văn bản sau với giọng nữ, tình cảm, dành cho trẻ em: "${text}"`,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
              },
            },
          });

          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            // Sử dụng HTML5 Audio thay vì Web Audio API để ổn định hơn
            const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
            audio.onended = safeOnEnd;
            audio.onerror = (e) => {
              console.error("Lỗi phát audio:", e);
              playFallback();
            };
            await audio.play();
            return;
          } else {
            throw new Error("AI_NO_AUDIO");
          }
        } catch (err: any) {
          console.warn("Lỗi Gemini Audio, chuyển sang giọng máy:", err);
          playFallback();
        }
      }
    }

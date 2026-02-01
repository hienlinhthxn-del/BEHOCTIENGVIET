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

      // Cố gắng tìm giọng Google Tiếng Việt (thường là Nữ miền Bắc) hoặc giọng Việt bất kỳ
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.name === 'Google Tiếng Việt') || voices.find(v => v.lang.includes('vi') || v.name.includes('Vietnamese'));
      if (viVoice) utterance.voice = viVoice;

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
        contents: `Đọc văn bản sau bằng tiếng Việt, giọng nữ miền Bắc, nhẹ nhàng, chuẩn xác: "${text}"`,
        config: {
          responseModalities: [Modality.AUDIO],
          // Bỏ voiceName cụ thể để tránh lỗi nếu model không hỗ trợ, để mặc định
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

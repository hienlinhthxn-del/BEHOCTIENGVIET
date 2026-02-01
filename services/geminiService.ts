import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private static instance: GeminiService;

  private constructor() { }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  // Lấy API Key an toàn
  private getApiKey(): string {
    let apiKey = '';
    try {
      apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    } catch { }

    if (!apiKey && typeof process !== 'undefined') {
      apiKey = (process.env as any).VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    }

    if (apiKey) {
      console.log(`[Gemini Info] API Key found (Length: ${apiKey.length}, Starts with: ${apiKey.substring(0, 4)}...)`);
    } else {
      console.error("[Gemini Error] API Key NOT FOUND!");
    }

    return apiKey || "";
  }

  // Chấm điểm đọc
  async evaluateReading(audioBase64: string, expectedText: string, mimeType: string = 'audio/webm') {
    console.log(`[Chấm Điểm] Đang gửi bài đọc (${mimeType})...`);
    const apiKey = this.getApiKey();
    if (!apiKey) return { score: 0, comment: "LỖI: Chưa cấu hình API Key!" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const result = await model.generateContent([
        { inlineData: { data: audioBase64, mimeType } },
        {
          text: `Bạn là giáo viên lớp 1. Hãy nghe bé đọc: "${expectedText}". 
        Hãy chấm điểm (0-10) và nhận xét khích lệ. 
        PHẢI TRẢ VỀ JSON: {"score": số, "comment": "nhận xét"}` }
      ]);

      const response = await result.response;
      const text = response.text();
      console.log("[AI Response]:", text);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI không trả về đúng định dạng JSON.");

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Number(parsed.score) || 0,
        comment: parsed.comment || "Bé đọc lại nhé!"
      };
    } catch (err: any) {
      console.error("[Lỗi Chấm Điểm]:", err);
      return { score: 0, comment: `LỖI: ${err.message || "Không thể kết nối cô Gemini"}` };
    }
  }

  // Chấm điểm bài tập (Dùng chung logic)
  async evaluateExercise(audioBase64: string, question: string, concept: string, mimeType: string = 'audio/webm') {
    return this.evaluateReading(audioBase64, `Câu hỏi: ${question}. Phải trả lời đúng ý: ${concept}`, mimeType);
  }

  // Chấm điểm tập viết
  async evaluateWriting(imageParts: string, expectedText: string) {
    const apiKey = this.getApiKey();
    if (!apiKey) return { score: 0, comment: "LỖI: Chưa có API Key!" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const base64Data = imageParts.includes(',') ? imageParts.split(',')[1] : imageParts;

    try {
      const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType: 'image/png' } },
        { text: `Ảnh viết chữ: "${expectedText}". Chấm điểm 0-10 và nhận xét (JSON: {"score": số, "comment": "..."})` }
      ]);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON fail");
      const parsed = JSON.parse(jsonMatch[0]);
      return { score: Number(parsed.score) || 0, comment: parsed.comment };
    } catch (err) {
      return { score: 0, comment: "Bé thử viết lại nhé!" };
    }
  }

  // Phát âm văn bản (TTS)
  async speak(text: string, onStart: () => void, onEnd: () => void) {
    let hasEnded = false;
    const safeOnEnd = () => { if (!hasEnded) { hasEnded = true; onEnd(); } };

    const playFallback = () => {
      console.log("[TTS] Chuyển vùng sang giọng máy.");
      window.speechSynthesis.cancel();
      let voices = window.speechSynthesis.getVoices();

      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';

        // Tìm giọng tốt nhất
        let viVoice = voices.find(v => v.name.includes('Online') && (v.name.includes('HoaiMy') || v.name.includes('Lan')))
          || voices.find(v => v.name.includes('Google') && v.name.includes('Tiếng Việt'))
          || voices.find(v => v.lang.startsWith('vi'));

        if (viVoice) {
          utterance.voice = viVoice;
          const isFemale = /female|nữ|hoaimy|lan|linh|online|trang/i.test(viVoice.name);
          console.log(`[TTS Fallback] Giọng: ${viVoice.name} (${isFemale ? "Nữ" : "Nam - Ép giọng"})`);
          if (!isFemale) {
            utterance.pitch = 2.0;
            utterance.rate = 0.8;
          }
        } else {
          utterance.pitch = 2.0;
        }

        utterance.onend = safeOnEnd;
        utterance.onerror = safeOnEnd;
        window.speechSynthesis.speak(utterance);
      };

      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); doSpeak(); };
      } else {
        doSpeak();
      }
    };

    try {
      onStart();
      const apiKey = this.getApiKey();
      if (!apiKey) { playFallback(); return; }

      const genAI = new GoogleGenerativeAI(apiKey);
      // Sử dụng gemini-1.5-flash với API chuẩn
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      console.log("[TTS] Đang gọi cô Gemini đọc...");
      const result = await model.generateContent([
        { text: `Bạn là giáo viên Hà Nội. Đọc chuẩn giọng nữ miền Bắc, chậm rãi: "${text}"` }
      ]);

      // Hỗ trợ Audio modality nếu có (Lưu ý: Một số vùng chưa bật Audio output cho public SDK)
      // Nếu không hỗ trợ inlineData audio, fallback về giọng máy
      const response = await result.response;
      // Ở phiên bản SDK hiện tại, Audio được trả về qua inlineData trong parts
      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (audioPart?.inlineData?.data) {
        const audio = new Audio(`data:audio/wav;base64,${audioPart.inlineData.data}`);
        audio.onended = safeOnEnd;
        audio.onerror = playFallback;
        await audio.play();
      } else {
        console.warn("[TTS] AI không trả về âm thanh, dùng giọng máy thay thế.");
        playFallback();
      }
    } catch (err) {
      console.error("[TTS AI Error]:", err);
      playFallback();
    }
  }

  // Chat/Search (Rút gọn)
  async chat(message: string) {
    const genAI = new GoogleGenerativeAI(this.getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(message);
    return result.response.text();
  }
}

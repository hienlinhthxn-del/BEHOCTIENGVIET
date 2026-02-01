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
  async evaluateReading(audioBase64: string, expectedText: string, mimeType: string = 'audio/webm') {
    console.log(`Đang gửi audio (${mimeType}, size: ${Math.round(audioBase64.length / 1024)}KB) để chấm điểm...`);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: {
          parts: [
            { inlineData: { data: audioBase64, mimeType } },
            {
              text: `Đây là âm thanh học sinh lớp 1 Việt Nam luyện đọc: "${expectedText}". 
            Hãy chấm điểm (0-10) và nhận xét ngắn gọn, thân thiện.
            
            BẮT BUỘC TRẢ VỀ DƯỚI DẠNG JSON (KHÔNG THÊM CHỮ KHÁC):
            {
              "score": [số từ 0-10],
              "comment": "[lời nhận xét]"
            }` }
          ]
        }
      });

      let rawText = "";
      try {
        // Một số phiên bản dùng .text(), một số dùng .text
        rawText = (typeof response.text === 'function') ? await (response as any).text() : (response.text || "");
      } catch (e) {
        console.error("Lỗi lấy text từ Gemini:", e);
        rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      console.log("Raw AI response:", rawText);

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI_RESPONSE_NOT_JSON");
      const result = JSON.parse(jsonMatch[0]);

      return {
        score: Number(result.score) || 0,
        comment: result.comment || "Cô chưa nghe rõ, bé đọc lại nhé!"
      };
    } catch (err: any) {
      console.error("Lỗi evaluateReading:", err);
      return { score: 0, comment: "Cô đang bận một chút, bé thử lại sau nhé!" };
    }
  }

  // Chấm điểm bài tập
  async evaluateExercise(audioBase64: string, question: string, concept: string, mimeType: string = 'audio/webm') {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: {
          parts: [
            { inlineData: { data: audioBase64, mimeType } },
            {
              text: `Câu hỏi: "${question}". Yêu cầu nhắc đến: "${concept}". 
            Chấm điểm và nhận xét (JSON format: { "score": 0-10, "comment": "..." })` }
          ]
        }
      });

      let rawText = (typeof response.text === 'function') ? await (response as any).text() : (response.text || "");
      const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleanedJson);

      return {
        score: Number(result.score) || 0,
        comment: result.comment || "Bé trả lời to rõ hơn nhé!"
      };
    } catch (err) {
      console.error("evaluateExercise failed:", err);
      return { score: 0, comment: "Bé thử trả lời lại nhé!" };
    }
  }

  // Chấm điểm tập viết
  async evaluateWriting(imageParts: string, expectedText: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = imageParts.includes(',') ? imageParts.split(',')[1] : imageParts;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
            {
              text: `Ảnh viết chữ: "${expectedText}". Chấm điểm và nhận xét (JSON format: { "score": 0-10, "comment": "..." })`
            }
          ]
        }
      });

      let rawText = (typeof response.text === 'function') ? await (response as any).text() : (response.text || "");
      const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleanedJson);

      return {
        score: Number(result.score) || 0,
        comment: result.comment || "Bé viết đẹp lắm, cố gắng nhé!"
      };
    } catch (err) {
      console.error("evaluateWriting failed:", err);
      return { score: 0, comment: "Bé thử viết lại nhé!" };
    }
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
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        safeOnEnd();
        return;
      }
      window.speechSynthesis.cancel();

      let voices = window.speechSynthesis.getVoices();

      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';

        // Log all voices to help remote debugging
        if (voices.length > 0 && !(window as any).hasLoggedVoices) {
          console.log("Danh sách giọng đọc khả dụng:");
          console.table(voices.map(v => ({ name: v.name, lang: v.lang })));
          (window as any).hasLoggedVoices = true;
        }

        // 1. Tìm giọng phù hợp (Ưu tiên Online/Nữ)
        let viVoice = voices.find(v => v.name.includes('Online') && (v.name.includes('HoaiMy') || v.name.includes('Lan') || v.name.includes('Trang')))
          || voices.find(v => v.name.includes('Google') && v.name.includes('Tiếng Việt'))
          || voices.find(v => v.name.includes('HoaiMy') || v.name.includes('Lan') || v.name.includes('Linh'))
          || voices.find(v => (v.name.includes('Female') || v.name.includes('Nữ')) && (v.lang.startsWith('vi')))
          || voices.find(v => v.lang.startsWith('vi'));

        if (viVoice) {
          utterance.voice = viVoice;
          const name = viVoice.name.toLowerCase();
          const femaleKeywords = ['female', 'nữ', 'hoaimy', 'lan', 'linh', 'online', 'trang', 'thuy', 'hương'];
          const isFemale = femaleKeywords.some(k => name.includes(k));

          console.log(`[Giọng Máy] Chọn: ${viVoice.name} (${isFemale ? "Nữ" : "Nam - Ép giọng"})`);

          if (isFemale) {
            utterance.pitch = 1.0;
            utterance.rate = 0.9;
          } else {
            console.warn("[Giọng Máy] Đang dùng giọng Nam với pitch 2.0");
            utterance.pitch = 2.0;
            utterance.rate = 0.8;
          }
        } else {
          utterance.pitch = 2.0;
        }

        utterance.onend = safeOnEnd;
        utterance.onerror = (e) => {
          console.error("[TTS] Lỗi:", e);
          safeOnEnd();
        };
        window.speechSynthesis.speak(utterance);
      };

      // Xử lý trường hợp trình duyệt chưa load kịp danh sách giọng
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          doSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
        // Fallback an toàn
        setTimeout(() => {
          if (!window.speechSynthesis.speaking) doSpeak();
        }, 300);
      } else {
        doSpeak();
      }
    };

    try {
      onStart();

      // Lấy API Key từ nhiều nguồn để đảm bảo không bị lỗi undefined
      let apiKey = '';
      try {
        apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      } catch {
        // Ignore if import.meta is not available
      }

      if (!apiKey && typeof process !== 'undefined') {
        apiKey = (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY;
      }

      // Chẩn đoán lỗi API Key
      if (!apiKey || apiKey.includes("PLACEHOLDER") || apiKey.length < 10) {
        console.warn("Chưa có API Key, dùng giọng máy tính ngay lập tức.");
        playFallback();
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: {
          parts: [{
            text: `Bạn là một giáo viên tiểu học ở Hà Nội. Hãy đọc văn bản sau bằng giọng nữ miền Bắc chuẩn (accent Hà Nội), nhẹ nhàng, truyền cảm, tốc độ chậm rãi để học sinh lớp 1 dễ dàng nghe và bắt chước theo: "${text}"`
          }]
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        console.log("Đang phát: Giọng mẫu AI (Aoede)");
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

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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    return `${downloadLink}&key=${import.meta.env.VITE_GEMINI_API_KEY}`;
  }

  // Chấm điểm đọc
  async evaluateReading(audioBase64: string, expectedText: string) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    try {
      onStart();

      // Khởi tạo AudioContext ngay khi click
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      // Chẩn đoán lỗi API Key
      if (!apiKey || apiKey.includes("PLACEHOLDER") || apiKey.length < 10) {
        throw new Error("MISSING_API_KEY");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Đọc to rõ ràng cho học sinh lớp 1 nghe: ${text}`,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = onEnd;
        source.start();
        return;
      } else {
        throw new Error("AI_NO_AUDIO");
      }
    } catch (err: any) {
      console.error("Audio error:", err);

      if (err.message === "MISSING_API_KEY") {
        alert("⚠️ Bạn chưa cấu hình VITE_GEMINI_API_KEY trên Vercel. Sẽ dùng giọng máy tính.");
      }

      // Fallback
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.onend = onEnd;
        utterance.onerror = () => onEnd();
        window.speechSynthesis.speak(utterance);
      } catch (f) {
        alert("❌ Lỗi loa. Hãy dùng Chrome.");
        onEnd();
      }
    }
  }
}


import { GoogleGenAI, Type, Modality } from "@google/genai";

export class GeminiService {
  private static instance: GeminiService;

  private constructor() { }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  // Trò chuyện giáo dục với Gemini 3 Pro
  async chat(message: string) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: 'Bạn là một trợ lý giáo dục thân thiện dành cho học sinh lớp 1 tại Việt Nam. Hãy trả lời ngắn gọn, dễ hiểu và khích lệ bé học tập.',
      }
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  }

  // Tìm kiếm thông tin chính xác với Google Search grounding
  async searchInfo(query: string) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

  // Vẽ tranh bằng trí tuệ nhân tạo Gemini 3 Pro Image
  async generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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

  // Tạo video sinh động bằng mô hình Veo 3.1
  async generateVideo(prompt: string, orientation: '16:9' | '9:16' = '16:9') {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: orientation
      }
    });

    // Thực hiện polling để kiểm tra trạng thái hoàn thành của video
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed");
    }

    // Link tải video cần đính kèm API key để truy cập
    return `${downloadLink}&key=${import.meta.env.VITE_GEMINI_API_KEY}`;
  }

  // Chấm điểm và nhận xét bài tập đọc từ âm thanh của bé
  async evaluateReading(audioBase64: string, expectedText: string) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

  // Chấm điểm câu trả lời bằng giọng nói cho bài tập vận dụng
  async evaluateExercise(audioBase64: string, question: string, concept: string) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

  // Chấm điểm bài viết chữ dựa trên hình ảnh bé đã viết
  async evaluateWriting(imageParts: string, expectedText: string) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const base64Data = imageParts.includes(',') ? imageParts.split(',')[1] : imageParts;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
}

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, EducationLevel, Difficulty, DifficultyMode } from "../types";

// --- CONFIGURATION & HELPERS ---

const FALLBACK_ORDER = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

const getApiKey = (): string => {
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey) return localKey;

  // Fallback to env if available
  return process.env.REACT_APP_GEMINI_API_KEY || (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
};

const getModel = (): string => {
  return localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';
};

const getDifficultyLabel = (diff: Difficulty): string => {
  switch (diff) {
    case 'recognition': return 'Nhận biết';
    case 'understanding': return 'Thông hiểu';
    case 'application': return 'Vận dụng';
  }
};

interface Distribution {
  recognition: number;
  understanding: number;
  application: number;
}

const getDistribution = (level: EducationLevel, grade: number): Distribution => {
  if (level === 'primary') {
    if (grade === 1 || grade === 2) {
      return { recognition: 12, understanding: 6, application: 2 };
    }
    return { recognition: 10, understanding: 6, application: 4 };
  }

  if (level === 'middle') {
    return { recognition: 6, understanding: 8, application: 6 };
  }

  return { recognition: 4, understanding: 8, application: 8 };
};

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "Nội dung câu hỏi tiếng Việt (Unicode Math)" },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "4 lựa chọn A, B, C, D (Unicode Math).",
    },
    correctAnswer: { type: Type.STRING, description: "Đáp án đúng (chỉ ký tự 'A', 'B', 'C' hoặc 'D')" },
    explanation: { type: Type.STRING, description: "Giải thích chi tiết (xuống dòng rõ ràng, Unicode Math)" },
    difficulty: { type: Type.STRING, description: "'recognition', 'understanding', hoặc 'application'" }
  },
  required: ["text", "options", "correctAnswer", "explanation", "difficulty"]
};

const arraySchema: Schema = {
  type: Type.ARRAY,
  items: questionSchema
};

// --- CORE GENERATION LOGIC ---

export const generateQuizQuestions = async (
  level: EducationLevel,
  grade: number,
  topic: string,
  difficultyMode: DifficultyMode = 'mixed'
): Promise<Question[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key not found. Please set it in Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Determine distribution based on difficulty mode
  let dist: Distribution;
  if (difficultyMode === 'mixed') {
    dist = getDistribution(level, grade);
  } else if (difficultyMode === 'recognition') {
    dist = { recognition: 20, understanding: 0, application: 0 };
  } else if (difficultyMode === 'understanding') {
    dist = { recognition: 0, understanding: 20, application: 0 };
  } else {
    dist = { recognition: 0, understanding: 0, application: 20 };
  }

  // Helper with Fallback/Retry Logic
  const generateBatch = async (count: number, difficulty: Difficulty, difficultyLabel: string): Promise<Question[]> => {
    if (count === 0) return [];

    // Start with selected model, then fallback through the list
    const preferredModel = getModel();
    // Create a list starting with preferred, then others in order, filtering duplicates
    const modelChain = [preferredModel, ...FALLBACK_ORDER].filter((v, i, a) => a.indexOf(v) === i);

    const prompt = `
      Generate ${count} [${difficulty}] level math questions for Grade ${grade} on topic '${topic}' following Vietnamese curriculum.
      
      CRITICAL FORMATTING RULES (MATHJAX LATEX):
      1. USE LaTeX syntax wrapped in \\(...\\) for ALL inline math formulas.
         Examples:
         - Powers: \\(x^2\\), \\(a^n\\)
         - Fractions: \\(\\frac{1}{2}\\), \\(\\frac{a+b}{c}\\)
         - Roots: \\(\\sqrt{x}\\), \\(\\sqrt[3]{x}\\)
         - Subscripts: \\(x_1\\), \\(x_2\\)
         - Multiplication: \\(a \\cdot b\\) or \\(a \\times b\\)
         - Geometry: \\(\\angle A\\), \\(\\triangle ABC\\), \\(\\perp\\), \\(\\parallel\\)
         - Sets: \\(\\in\\), \\(\\subset\\), \\(\\cup\\), \\(\\cap\\), \\(\\emptyset\\)
         - Comparison: \\(\\neq\\), \\(\\leq\\), \\(\\geq\\)
         - Arrows: \\(\\Rightarrow\\), \\(\\Leftrightarrow\\)
      2. Use \\[...\\] for display (block) math only when needed for complex expressions.
      3. Regular Vietnamese text stays as plain text, only math expressions use LaTeX.
      
      4. CONTENT STRUCTURE:
         - Questions must be in Vietnamese.
         - Explanation must be step-by-step using bullet points (-) or new lines for readability.
         - CORRECT ANSWER: Must be one of A, B, C, D.
      
      5. ANSWER DISTRIBUTION (IMPORTANT):
         - Ensure that the correct answers are evenly distributed among A, B, C, and D.
         - Avoid making 'A' the correct answer too frequently.
         - For ${count} questions, aim for approximately ${Math.ceil(count / 4)} of each option.
      
      Difficulty Definition for ${difficultyLabel} (${difficulty}):
      - Nhận biết (Recognition): Direct recall, simple calculation (1 step).
      - Thông hiểu (Understanding): Multi-step problem, apply formula (2-3 steps).
      - Vận dụng (Application): Complex scenario, integrate multiple concepts (3+ steps).
      
      Output JSON format:
      [
        { 
          "text": "Question with \\\\(LaTeX\\\\) formulas...", 
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."], 
          "correctAnswer": "A", 
          "explanation": "- Bước 1: ...\n- Bước 2: ...\n⇒ Kết luận...", 
          "difficulty": "${difficulty}" 
        }
      ]
    `;

    for (const model of modelChain) {
      try {
        // console.log(`Generating ${difficulty} using model: ${model}`); // Debug
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: arraySchema,
            temperature: 0.7,
          }
        });

        const rawQuestions = JSON.parse(response.text || "[]");
        if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
          throw new Error("Empty or invalid JSON response");
        }

        return rawQuestions.map((q: any, index: number) => ({
          id: `${difficulty}-${index}-${Date.now()}-${Math.random()}`,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer ? q.correctAnswer.replace(/[^ABCD]/g, '').trim() : 'A',
          explanation: q.explanation,
          difficulty: difficulty,
          difficultyLabel: getDifficultyLabel(difficulty)
        }));

      } catch (error: any) {
        console.warn(`Model ${model} failed for ${difficulty}:`, error);
        // Continue to next model in chain
        if (model === modelChain[modelChain.length - 1]) {
          // If this was the last model, throw the error with specific API code if possible
          const errorMsg = error.toString();
          if (errorMsg.includes("429")) throw new Error("429 RESOURCE_EXHAUSTED");
          throw error;
        }
      }
    }

    return []; // Should throw before reaching here if all fail
  };

  // Run in parallel for speed, but each batch has its own internal fallback/retry
  try {
    const [recogQs, underQs, applyQs] = await Promise.all([
      generateBatch(dist.recognition, 'recognition', 'Nhận biết'),
      generateBatch(dist.understanding, 'understanding', 'Thông hiểu'),
      generateBatch(dist.application, 'application', 'Vận dụng')
    ]);

    const allQuestions = [...recogQs, ...underQs, ...applyQs];

    if (allQuestions.length === 0) {
      throw new Error("Không thể tạo câu hỏi. Tất cả các model đều thất bại. Vui lòng kiểm tra API Key và Quota.");
    }

    return allQuestions.sort(() => Math.random() - 0.5);
  } catch (e: any) {
    throw e;
  }
};

// --- CHAT TUTOR SERVICE ---

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export const getChatTutorResponse = async (history: ChatMessage[], newMessage: string, imageBase64?: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Vui lòng nhập API Key trong Settings để sử dụng Chat.";

  const ai = new GoogleGenAI({ apiKey });

  const preferredModel = getModel();
  const modelChain = [preferredModel, ...FALLBACK_ORDER].filter((v, i, a) => a.indexOf(v) === i);

  const systemInstruction = `
    VAI TRÒ:
    - Bạn là "Thầy Toán AI", một gia sư toán học thân thiện, kiên nhẫn và thông thái.
    - Nhiệm vụ: Giúp học sinh hiểu bài, giải toán từ ảnh (OCR), và hướng dẫn tư duy.
    - Đối tượng: Học sinh từ lớp 1 đến lớp 12.

    QUY TẮC ĐỊNH DẠNG TOÁN HỌC (MATHJAX LATEX):
    - Dùng cú pháp LaTeX cho TẤT CẢ công thức toán:
      + Inline math: \\(...\\) — ví dụ: \\(x^2 + 3x + 2 = 0\\)
      + Display math: \\[...\\] — cho công thức phức tạp, ví dụ: \\[\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]
    - KHÔNG dùng $ hoặc $$ làm delimiter.
    - Các ký hiệu thường dùng:
      + Phân số: \\(\\frac{a}{b}\\)
      + Căn: \\(\\sqrt{x}\\), \\(\\sqrt[n]{x}\\)
      + Lũy thừa: \\(x^n\\), chỉ số: \\(x_i\\)
      + Hình học: \\(\\triangle ABC\\), \\(\\angle A\\), \\(\\perp\\), \\(\\parallel\\)
      + Tích phân: \\(\\int_a^b f(x)dx\\)
      + Tổng: \\(\\sum_{i=1}^{n} a_i\\)
      + Giới hạn: \\(\\lim_{x \\to a} f(x)\\)
    - Văn bản thường (tiếng Việt) viết bình thường, chỉ công thức toán mới bọc trong \\(...\\) hoặc \\[...\\].

    QUY TẮC SƯ PHẠM CHUNG:
    1. Hiểu câu hỏi & Xác nhận.
    2. Phương pháp Socrate: Gợi mở để học sinh tự tư duy.
    3. Giải thích từng bước dễ hiểu.
    4. Kiểm tra lại bằng bài toán tương tự.
    5. Luôn tích cực, dùng emoji (👋😊💡🎯).

    WORKFLOW XỬ LÝ ẢNH (OCR):
    1. Trích xuất văn bản/công thức.
    2. Nếu mờ -> yêu cầu chụp lại.
    3. Nếu đọc được -> Trả lời theo cấu trúc: 
       ## 📷 Đề bài nhận dạng: ...
       ## ❓ Xác nhận: ...
       ## 📖 Hướng dẫn giải: ...
       ## 💡 Lưu ý: ...
  `;

  const chatHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  let contentParts: any[] = [];
  if (imageBase64) {
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const cleanBase64 = imageBase64.replace(/^data:([^;]+);base64,/, '');
    contentParts.push({ inlineData: { data: cleanBase64, mimeType: mimeType } });
  }
  contentParts.push({ text: newMessage || "Hãy giải bài này giúp em." });

  for (const model of modelChain) {
    try {
      const chat = ai.chats.create({
        model: model,
        config: { systemInstruction, temperature: 0.7 },
        history: chatHistory
      });

      const result = await chat.sendMessage({ message: { parts: contentParts } });
      return result.text;

    } catch (error) {
      console.warn(`Chat Model ${model} failed:`, error);
      if (model === modelChain[modelChain.length - 1]) {
        const errStr = String(error);
        if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
          return "⚠️ Hệ thống đang quá tải (Lỗi 429). Vui lòng thử lại sau giây lát hoặc đổi API Key.";
        }
        return `⚠️ Lỗi kết nối: ${errStr}. Vui lòng kiểm tra API Key.`;
      }
    }
  }

  return "Xin lỗi, thầy không thể kết nối ngay lúc này. 😔";
};

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, WeekPlan } from "../types";

// Polyfill for TypeScript build to understand process.env
declare const process: {
  env: {
    API_KEY: string;
  }
};

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const explainConcept = async (topicName: string, concept: string, analogy: string): Promise<string> => {
  try {
    let prompt = `You are an expert Science Olympiad coach. Explain the concept "${concept}" as it relates to the event "${topicName}" for a middle school student.`;
    
    if (analogy !== 'Default') {
      prompt += ` Use a "${analogy}" analogy to explain it.`;
    } else {
      prompt += ` Keep the explanation simple, engaging, and conceptual.`;
    }

    prompt += `
    
    Instructions:
    1. Provide a comprehensive explanation (aim for 150-250 words) that makes the concept crystal clear.
    2. If there are math formulas involved (like F=ma or KE=1/2mv^2), explain them simply in text first, then show the formula.
    3. Format the output using simple HTML tags for readability:
       - Use <p> for paragraphs.
       - Use <ul> and <li> for bullet points.
       - Use <strong> to highlight key terms or physics principles.
       - Use <code> for formulas.
    4. Do NOT use markdown (no # or *). Do NOT wrap in \`\`\`html blocks. Just return the raw HTML string.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Error explaining concept:", error);
    return "Sorry, our AI coach is taking a break. Please try again later.";
  }
};

export const askQuestion = async (topicName: string, question: string, history: {role: 'user' | 'model', text: string}[] = []): Promise<string> => {
  try {
    let context = "";
    if (history.length > 0) {
      // Take last 4 turns to keep context relevance high and token usage managed
      const recentHistory = history.slice(-4);
      context = `
      Previous conversation context:
      ${recentHistory.map(h => `${h.role === 'user' ? 'Student' : 'Coach'}: ${h.text}`).join('\n')}
      `;
    }

    const prompt = `You are an expert Science Olympiad coach for the event "${topicName}". 
    ${context}
    
    A student asks: "${question}"
    
    Provide a clear, accurate, and helpful answer suited for a middle school student. 
    Focus on the official rules and scientific principles of the event.
    Format the output with simple HTML tags (p, ul, li, strong, code) for readability. Do not use Markdown blocks.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "I couldn't generate an answer at this time.";
  } catch (error) {
    console.error("Error asking question:", error);
    return "Sorry, I'm having trouble connecting to the knowledge base.";
  }
};

export const generateQuizForTopic = async (topicName: string, concept?: string): Promise<QuizQuestion[]> => {
  const isSpecific = !!concept;
  const questionCount = isSpecific ? 3 : 10;
  
  const context = isSpecific 
    ? `specifically about the concept "${concept}" within "${topicName}"`
    : `covering ALL major concepts of "${topicName}" (Rules, Physics, Construction, etc)`;

  const quizSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Exactly 4 options"
            },
            correctAnswer: { type: Type.STRING, description: "Must exactly match one of the options" },
            explanation: { type: Type.STRING, description: "Why this answer is correct" }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a ${questionCount}-question multiple choice quiz ${context} for a middle school science olympiad student. 
      
      Requirements:
      1. Questions should test conceptual understanding. 
      2. If math is required, keep numbers simple enough for mental math or quick calculation.
      3. Focus on accuracy regarding Science Olympiad rules and physics principles.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data.questions || [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

export const generateWeeklyPlan = async (eventDate: string, topics: string[]): Promise<WeekPlan[]> => {
  const planSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        weekNumber: { type: Type.INTEGER },
        focus: { type: Type.STRING },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              completed: { type: Type.BOOLEAN },
              type: { type: Type.STRING, enum: ["read", "quiz", "build"] }
            }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `I have a Science Olympiad competition on ${eventDate}. 
      My topics are: ${topics.join(", ")}.
      Generate a 4-week study plan.
      Tasks should be small and manageable for a student.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating plan:", error);
    return [];
  }
};
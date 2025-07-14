"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getOrCreateUser } from "@/app/lib/getOrCreateUser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

type Question = {
  question: string;
  correctAnswer: string;
  explanation: string;
};

type QuestionResult = {
  question: string;
  answer: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
};

// ✅ REFACTORED: Uses getOrCreateUser
export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  const user = await getOrCreateUser(
    userId,
    clerkUser?.emailAddresses[0]?.emailAddress || ""
  );

  const prompt = `
    Generate 10 technical interview questions for a ${user.industry ?? "tech"} professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = await response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

// ✅ REFACTORED: Uses getOrCreateUser
export async function saveQuizResult(
  questions: Question[],
  answers: string[],
  score: number
): Promise<any> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  const user = await getOrCreateUser(
    userId,
    clerkUser?.emailAddresses[0]?.emailAddress || ""
  );

  const questionResults: QuestionResult[] = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  let improvementTip: string | null = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
The user got the following ${user.industry ?? "tech"} technical interview questions wrong:

${wrongQuestionsText}

Based on these mistakes, provide a concise, specific improvement tip.
Focus on the knowledge gaps revealed by these wrong answers.
Keep the response under 2 sentences and make it encouraging.
Don't explicitly mention the mistakes, instead focus on what to learn/practice.
`;

    try {
      const tipResult = await model.generateContent(improvementPrompt);
      const tipText = await tipResult.response.text();
      improvementTip = tipText.trim();
    } catch (error) {
      console.error("Error generating improvement tip:", error);
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

// ✅ REFACTORED: Uses getOrCreateUser
export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  const user = await getOrCreateUser(
    userId,
    clerkUser?.emailAddresses[0]?.emailAddress || ""
  );

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

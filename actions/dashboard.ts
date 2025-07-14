"use server";

import { getOrCreateUser } from "@/app/lib/getOrCreateUser";
import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry: any) => {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "High" | "Medium" | "Low",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "Positive" | "Neutral" | "Negative",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }

    IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
    Include at least 5 common roles for salary ranges.
    Growth rate should be a percentage.
    Include at least 5 skills and trends.
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = await response.text(); // 🧠 Await it as it's a Promise
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  const user = await getOrCreateUser(
    userId,
    clerkUser?.emailAddresses[0]?.emailAddress || ""
  );

  const fullUser = await db.user.findUnique({
    where: {
      id: user.id,
    },
    include: {
      industryInsight: true,
    },
  });

  if (!fullUser) {
    throw new Error("User not found after getOrCreate");
  }

  if (!fullUser.industryInsight) {
    if (!fullUser.industry) {
      throw new Error("User industry not set");
    }

    const insights = await generateAIInsights(fullUser.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: fullUser.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // fixed 360→1000
      },
    });

    return industryInsight;
  }

  return fullUser.industryInsight;
}

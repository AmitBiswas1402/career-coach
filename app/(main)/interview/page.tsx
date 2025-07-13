import { getAssessments } from "@/actions/interview";
import StatsCards from "./(components)/StatsCards";
import PerformanceChart from "./(components)/PerformanceChart";
import QuizList from "./(components)/QuizList";

interface Assessment {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  quizScore: number;
  category: string;
  improvementTip?: string;
  questions: {
    question: string;
    answer: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export default async function InterviewPrepPage() {
  const raw = await getAssessments();

  const assessments: Assessment[] = raw.map((item) => ({
    ...item,
    improvementTip: item.improvementTip ?? undefined,
    questions: (item.questions ?? []).filter(
      Boolean
    ) as Assessment["questions"],
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">
          Interview Preparation
        </h1>
      </div>
      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}

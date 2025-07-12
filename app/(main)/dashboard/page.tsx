import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import Dashboard from "./(components)/Dashboard";
import { getIndustryInsights } from "@/actions/dashboard";

const IndustryInsights = async () => {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const rawInsights = await getIndustryInsights();

  const insights = {
    ...rawInsights,
    salaryRanges: (rawInsights.salaryRanges ?? [])
      .filter(Boolean)
      .map((range: any) => ({
        role: range.role,
        min: Number(range.min),
        max: Number(range.max),
        median: Number(range.median),
      })),
    lastUpdated: new Date(rawInsights.lastUpdated).toISOString(),
    nextUpdate: new Date(rawInsights.nextUpdate).toISOString(),
  };

  return (
    <div>
      <Dashboard insights={insights} />
    </div>
  );
};

export default IndustryInsights;

import { getUserOnboardingStatus } from "@/actions/user"
import { redirect } from "next/navigation"


const OnboardingPage = async () => {
  const {isOnboarded} = await getUserOnboardingStatus()

  if (isOnboarded) {
    redirect("/dashboard")
  }

  return (
    <main>
    </main>
  )
}

export default OnboardingPage
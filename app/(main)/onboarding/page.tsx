import { getUserOnboardingStatus } from "@/actions/user"
import { redirect } from "next/navigation"
import OnboardingForm from "./(components)/OnboardingForm"
import { industries } from "@/data/industries"


const OnboardingPage = async () => {
  const {isOnboarded} = await getUserOnboardingStatus()

  if (isOnboarded) {
    redirect("/dashboard")
  }

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  )
}

export default OnboardingPage
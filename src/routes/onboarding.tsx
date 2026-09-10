import { createFileRoute } from "@tanstack/react-router";
import OnboardingForm from "@/kadai/OnboardingForm";
export const Route=createFileRoute("/onboarding")({ssr:false,component:()=> <main className="shell"><OnboardingForm/></main>});

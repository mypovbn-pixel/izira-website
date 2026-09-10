import { createFileRoute } from "@tanstack/react-router";
import PlanUsage from "@/kadai/PlanUsage";
export const Route=createFileRoute("/dashboard/plan")({ssr:false,component:PlanUsage});

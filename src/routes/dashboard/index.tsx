import { createFileRoute } from "@tanstack/react-router";
import MerchantDashboard from "@/kadai/MerchantDashboard";
export const Route=createFileRoute("/dashboard/")({ssr:false,component:MerchantDashboard});

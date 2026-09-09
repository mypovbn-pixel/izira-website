import Link from "next/link";
import MerchantDashboard from "@/components/MerchantDashboard";

export default function DashboardPage(){
  return <>
    <Link href="/dashboard/plan" style={{position:"fixed",right:18,bottom:18,zIndex:50}} className="btn">Plan & usage</Link>
    <MerchantDashboard/>
  </>;
}

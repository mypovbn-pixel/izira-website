import Link from "next/link";
import MerchantDashboard from "@/components/MerchantDashboard";

export default function DashboardPage(){
  return <>
    <div style={{position:"fixed",right:18,bottom:18,zIndex:50,display:"flex",gap:10,flexWrap:"wrap",justifyContent:"flex-end"}}>
      <Link href="/dashboard/transport" className="btn secondary">Runner & Transport</Link>
      <Link href="/dashboard/appointments" className="btn secondary">Appointments</Link>
      <Link href="/dashboard/whatsapp" className="btn secondary">WhatsApp</Link>
      <Link href="/dashboard/plan" className="btn">Plan & usage</Link>
    </div>
    <MerchantDashboard/>
  </>;
}

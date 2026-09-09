import Link from "next/link";
import AppointmentManager from "@/components/AppointmentManager";

export default function AppointmentsPage(){
  return <>
    <div className="shell" style={{paddingTop:20,paddingBottom:0,textAlign:"right"}}>
      <Link className="btn secondary" href="/dashboard/transport">Runner & Transport →</Link>
    </div>
    <AppointmentManager/>
  </>;
}

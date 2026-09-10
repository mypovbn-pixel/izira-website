import KadaiAssistant from "@/components/KadaiAssistant";

export default function KadaiLayout({children}:{children:React.ReactNode}){
  return <>{children}<KadaiAssistant/></>;
}

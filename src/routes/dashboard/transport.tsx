import { createFileRoute } from "@tanstack/react-router";
import TransportManager from "@/kadai/TransportManager";
import TransportNotifier from "@/kadai/TransportNotifier";
function Page(){return <><TransportNotifier/><TransportManager/></>}
export const Route=createFileRoute("/dashboard/transport")({ssr:false,component:Page});

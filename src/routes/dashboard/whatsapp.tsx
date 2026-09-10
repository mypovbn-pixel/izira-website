import { createFileRoute } from "@tanstack/react-router";
import WhatsAppSettings from "@/kadai/WhatsAppSettings";
export const Route=createFileRoute("/dashboard/whatsapp")({ssr:false,component:WhatsAppSettings});

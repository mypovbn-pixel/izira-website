import { createFileRoute } from "@tanstack/react-router";
import AppointmentManager from "@/kadai/AppointmentManager";
export const Route=createFileRoute("/dashboard/appointments")({ssr:false,component:AppointmentManager});

import { createFileRoute } from "@tanstack/react-router";
import AuthForm from "@/kadai/AuthForm";
export const Route=createFileRoute("/login")({ssr:false,component:()=> <main className="shell"><AuthForm mode="login"/></main>});

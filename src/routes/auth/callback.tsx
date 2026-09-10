import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { createClient } from "@/kadai/supabase";
function AuthCallback(){const router=useRouter();useEffect(()=>{(async()=>{const supabase=createClient();const code=new URLSearchParams(window.location.search).get("code");if(code){try{await supabase.auth.exchangeCodeForSession(code)}catch{}}router.navigate({to:"/onboarding",replace:true})})()},[router]);return <div className="kadai-loading">Finishing sign-in…</div>}
export const Route=createFileRoute("/auth/callback")({ssr:false,component:AuthCallback});

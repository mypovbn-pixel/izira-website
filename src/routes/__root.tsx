import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useLocation, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import kadaiCss from "../kadai.css?url";
import kadaiEnhancementsCss from "../kadai-enhancements.css?url";
import KadaiAssistant from "../kadai/KadaiAssistant";
function NotFound(){return <main className="shell"><div className="card" style={{margin:"80px auto",maxWidth:520,textAlign:"center"}}><h1>Page not found</h1><p className="muted">The page you're looking for doesn't exist.</p><Link to="/kadai" className="btn">Explore KADAI</Link></div></main>}
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width, initial-scale=1, viewport-fit=cover"},{title:"IZIRA — Useful digital products for Brunei"},{name:"description",content:"IZIRA builds thoughtful digital products in Brunei, including KADAI."},{name:"theme-color",content:"#FAF6F1"}],links:[{rel:"stylesheet",href:appCss},{rel:"stylesheet",href:kadaiCss},{rel:"stylesheet",href:kadaiEnhancementsCss}]}),shellComponent:RootShell,component:RootComponent,notFoundComponent:NotFound});
function RootShell({children}:{children:ReactNode}){return <html lang="en"><head><HeadContent/></head><body>{children}<Scripts/></body></html>}
function RootComponent(){const {queryClient}=Route.useRouteContext();const path=useLocation().pathname;const showAssistant=path==="/kadai"||path==="/pricing"||path==="/login"||path==="/signup"||path==="/onboarding"||path.startsWith("/dashboard");return <QueryClientProvider client={queryClient}><Outlet/>{showAssistant&&<KadaiAssistant/>}</QueryClientProvider>}

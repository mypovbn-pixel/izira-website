"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Turn={from:"bot"|"user";text:string};
type Knowledge={keywords:string[];answer:string};

const knowledge:Knowledge[]=[
 {keywords:["price","pricing","free","starter","pro","harga"],answer:"KADAI has Free (BND 0), Starter (BND 10/month) and Pro (BND 24/month). Free is genuinely useful; paid plans add more scale, automation and advanced controls."},
 {keywords:["what is kadai","what kadai","apa kadai","kadai buat apa"],answer:"KADAI is a simple online place for small businesses to sell products, take bookings, manage capacity, accept runner/transport requests and keep customer activity organised."},
 {keywords:["product","sell","jual","store","storefront"],answer:"You can add products, prices, stock limits, preorders, pickup/delivery options and share your KADAI link directly on Instagram, TikTok or WhatsApp."},
 {keywords:["appointment","booking","service","makeup","salon"],answer:"Yes. KADAI supports services and appointments with duration, availability, blocked time, deposits, reminders and rescheduling."},
 {keywords:["runner","delivery","errand"],answer:"Runner businesses can receive pickup and destination details, item notes, one-off or recurring jobs, quote fares and send collected/delivered updates."},
 {keywords:["uber","transport","school","school run","ride"],answer:"KADAI supports Brunei-style individual transport: one-off trips, airport runs, school transport and recurring schedules. Parents can opt in for WhatsApp pickup/drop-off updates."},
 {keywords:["whatsapp business","automation","automatic whatsapp","meta"],answer:"KADAI Pro can connect to Meta WhatsApp Business Platform for official transactional updates. Manual WhatsApp buttons remain available on lower plans."},
 {keywords:["payment","bank transfer","receipt"],answer:"KADAI supports bank-transfer payment instructions and receipt handling. Sellers review payments before confirming orders or bookings."},
 {keywords:["currency","bnd","dollar"],answer:"KADAI uses Brunei Dollars (BND)."},
 {keywords:["capacity","slot","sold out","full"],answer:"Set how many orders or bookings you can accept. KADAI can close availability when capacity is full so you do not have to manually answer whether slots are still available."},
 {keywords:["customer account","login customer","guest checkout"],answer:"Customers do not need an account to order or request a booking from a KADAI storefront."},
 {keywords:["website","link","url"],answer:"Each seller gets a direct KADAI storefront link such as izira.xyz/yourbusinessname, designed to be easy to share from social media and WhatsApp."},
];

const suggestions=["What is KADAI?","How much is KADAI?","Can KADAI do school runs?","How does WhatsApp automation work?"];

function answerFor(input:string){
 const text=input.toLowerCase().trim();
 let best:Knowledge|null=null;let bestScore=0;
 for(const item of knowledge){
  const score=item.keywords.reduce((n,k)=>n+(text.includes(k)?Math.max(2,k.split(/\s+/).length):0),0);
  if(score>bestScore){best=item;bestScore=score}
 }
 if(best)return best.answer;
 if(/^(hi|hello|hey|salam|assalam)/.test(text))return "Hi! 👋 I’m the KADAI Assistant. Ask me about selling, appointments, runner/transport, pricing or WhatsApp.";
 return "I’m still learning that one. I can help with KADAI pricing, products, bookings, runner/transport, capacity and WhatsApp. For something account-specific, use human support rather than sharing passwords, OTPs or banking login details here.";
}

export default function KadaiAssistant(){
 const [open,setOpen]=useState(false);
 const [input,setInput]=useState("");
 const [turns,setTurns]=useState<Turn[]>([{from:"bot",text:"Hi! 👋 I’m the KADAI Assistant. How can I help?"}]);
 const botName=useMemo(()=>process.env.NEXT_PUBLIC_KADAI_BOT_NAME||"KADAI Assistant",[]);
 const bubblaSiteId=process.env.NEXT_PUBLIC_KADAI_BUBBLAV_SITE_ID||"";

 useEffect(()=>{
  if(!bubblaSiteId)return;
  const existing=document.querySelector('script[data-kadai-bubblav="true"]');
  if(existing)return;
  const script=document.createElement('script');
  script.src='https://www.bubblav.com/widget.js';
  script.defer=true;
  script.dataset.siteId=bubblaSiteId;
  script.dataset.kadaiBubblav='true';
  document.body.appendChild(script);
 },[bubblaSiteId]);

 function ask(value?:string){
  const question=(value??input).trim();if(!question)return;
  setTurns(v=>[...v,{from:"user",text:question},{from:"bot",text:answerFor(question)}]);setInput("");
 }

 if(bubblaSiteId)return null;

 return <>
  {open&&<div style={{position:"fixed",right:18,bottom:88,width:"min(380px,calc(100vw - 24px))",height:"min(590px,calc(100vh - 120px))",background:"#fffaf6",border:"1px solid #e7d8ce",borderRadius:24,boxShadow:"0 20px 70px rgba(60,35,25,.18)",zIndex:1000,display:"flex",flexDirection:"column",overflow:"hidden"}}>
   <div style={{padding:"17px 18px",background:"#A6533D",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><b style={{fontSize:17}}>{botName}</b><div style={{fontSize:12,opacity:.82}}>Buka Kadai. Start Jual.</div></div><button onClick={()=>setOpen(false)} aria-label="Close chat" style={{border:0,background:"transparent",color:"white",fontSize:24,cursor:"pointer"}}>×</button></div>
   <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
    {turns.map((t,i)=><div key={i} style={{alignSelf:t.from==="user"?"flex-end":"flex-start",maxWidth:"86%",padding:"10px 12px",borderRadius:16,background:t.from==="user"?"#A6533D":"#f2e7df",color:t.from==="user"?"white":"#332720",fontSize:14,lineHeight:1.45}}>{t.text}</div>)}
    {turns.length<=1&&<div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:4}}>{suggestions.map(s=><button key={s} onClick={()=>ask(s)} style={{border:"1px solid #d9c5b9",background:"white",borderRadius:999,padding:"7px 9px",fontSize:12,cursor:"pointer"}}>{s}</button>)}</div>}
   </div>
   <div style={{padding:12,borderTop:"1px solid #eadfd6",background:"white"}}><div style={{display:"flex",gap:8}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')ask()}} placeholder="Ask about KADAI…" style={{flex:1,minWidth:0,border:"1px solid #d9cbc0",borderRadius:14,padding:"11px 12px",fontSize:14}}/><button onClick={()=>ask()} style={{border:0,borderRadius:14,background:"#A6533D",color:"white",padding:"0 15px",fontWeight:800,cursor:"pointer"}}>Send</button></div><div style={{fontSize:10,color:"#8a756a",marginTop:7,textAlign:"center"}}>Never share passwords or OTPs. <Link href="/kadai" style={{textDecoration:"underline"}}>About KADAI</Link></div></div>
  </div>}
  <button onClick={()=>setOpen(v=>!v)} aria-label="Open KADAI Assistant" style={{position:"fixed",right:18,bottom:18,width:56,height:56,borderRadius:"50%",border:0,background:"#A6533D",color:"white",fontSize:20,fontWeight:900,boxShadow:"0 12px 30px rgba(80,45,30,.28)",zIndex:1001,cursor:"pointer"}}>{open?"×":"K"}</button>
 </>
}

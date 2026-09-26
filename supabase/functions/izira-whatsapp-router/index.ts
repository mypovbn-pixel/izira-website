import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

const TEAM_BY_BUTTON: Record<string, { key: string; label: string }> = {
  team_kadai: { key: "kadai", label: "KADAI" },
  team_mypov: { key: "mypov", label: "myPOV" },
  team_izira_solutions: { key: "izira_solutions", label: "IZIRA Solutions" },
};

async function verifySignature(raw: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = signatureHeader.slice(7);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const actual = Array.from(new Uint8Array(sig))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) {
    diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}

async function sendMetaMessage(phoneNumberId: string, accessToken: string, payload: unknown) {
  const graphVersion = Deno.env.get("META_GRAPH_VERSION") || "v23.0";
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || "Meta WhatsApp send failed");
  }
  return body;
}

function greetingPayload(to: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "Welcome to IZIRA Solutions.\nPlease select the team you would like to contact.",
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "team_kadai", title: "KADAI" } },
          { type: "reply", reply: { id: "team_mypov", title: "myPOV" } },
          { type: "reply", reply: { id: "team_izira_solutions", title: "IZIRA Solutions" } },
        ],
      },
    },
  };
}

function handoffPayload(to: string, teamLabel: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: `Thank you. Your message has been directed to ${teamLabel}. A team member will reply shortly.`,
    },
  };
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const raw = await req.text();
    const appSecret = Deno.env.get("META_APP_SECRET");
    const accessToken = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN");
    const configuredPhoneNumberId = Deno.env.get("IZIRA_WHATSAPP_PHONE_NUMBER_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!appSecret || !accessToken || !configuredPhoneNumberId || !supabaseUrl || !serviceRoleKey) {
      return json({ error: "WhatsApp router is not fully configured." }, 503);
    }

    const valid = await verifySignature(raw, req.headers.get("x-hub-signature-256"), appSecret);
    if (!valid) return json({ error: "Invalid signature." }, 401);

    const payload = JSON.parse(raw);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    for (const entry of payload?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value || {};
        const phoneNumberId = String(value?.metadata?.phone_number_id || "");
        if (phoneNumberId !== configuredPhoneNumberId) continue;

        for (const message of value?.messages || []) {
          const metaMessageId = String(message?.id || "");
          const sender = digits(message?.from || "");
          if (!metaMessageId || !sender) continue;

          const messageType = String(message?.type || "unknown");
          const buttonId =
            messageType === "interactive"
              ? String(message?.interactive?.button_reply?.id || "")
              : messageType === "button"
                ? String(message?.button?.payload || "")
                : "";
          const body =
            messageType === "text"
              ? String(message?.text?.body || "")
              : messageType === "interactive"
                ? String(message?.interactive?.button_reply?.title || message?.interactive?.list_reply?.title || "")
                : messageType === "button"
                  ? String(message?.button?.text || "")
                  : "";

          const { data: inserted, error: insertError } = await supabase
            .from("whatsapp_support_messages")
            .insert({
              meta_message_id: metaMessageId,
              customer_phone: sender,
              direction: "inbound",
              message_type: messageType,
              body: body || null,
              payload: message,
            })
            .select("id")
            .maybeSingle();

          if (insertError && insertError.code !== "23505") throw insertError;
          if (!inserted) continue;

          const now = new Date();
          const { data: conversation } = await supabase
            .from("whatsapp_support_conversations")
            .select("customer_phone,selected_team,expires_at")
            .eq("customer_phone", sender)
            .maybeSingle();

          const expired = !conversation?.expires_at || new Date(conversation.expires_at) <= now;
          const team = TEAM_BY_BUTTON[buttonId];

          if (team) {
            const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            await supabase.from("whatsapp_support_conversations").upsert({
              customer_phone: sender,
              selected_team: team.key,
              first_message_at: expired ? now.toISOString() : undefined,
              last_message_at: now.toISOString(),
              routed_at: now.toISOString(),
              expires_at: expiresAt,
              updated_at: now.toISOString(),
            });

            const outbound = handoffPayload(sender, team.label);
            const meta = await sendMetaMessage(phoneNumberId, accessToken, outbound);
            await supabase.from("whatsapp_support_messages").insert({
              meta_message_id: meta?.messages?.[0]?.id || null,
              customer_phone: sender,
              direction: "outbound",
              message_type: "text",
              body: `Thank you. Your message has been directed to ${team.label}. A team member will reply shortly.`,
              payload: outbound,
            });
            continue;
          }

          if (conversation && !expired && conversation.selected_team) {
            await supabase
              .from("whatsapp_support_conversations")
              .update({ last_message_at: now.toISOString(), updated_at: now.toISOString() })
              .eq("customer_phone", sender);
            continue;
          }

          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          await supabase.from("whatsapp_support_conversations").upsert({
            customer_phone: sender,
            selected_team: null,
            first_message_at: now.toISOString(),
            last_message_at: now.toISOString(),
            routed_at: null,
            expires_at: expiresAt,
            updated_at: now.toISOString(),
          });

          const outbound = greetingPayload(sender);
          const meta = await sendMetaMessage(phoneNumberId, accessToken, outbound);
          await supabase.from("whatsapp_support_messages").insert({
            meta_message_id: meta?.messages?.[0]?.id || null,
            customer_phone: sender,
            direction: "outbound",
            message_type: "interactive",
            body: "Welcome to IZIRA Solutions. Please select the team you would like to contact.",
            payload: outbound,
          });
        }
      }
    }

    return json({ received: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Webhook processing failed." }, 500);
  }
});

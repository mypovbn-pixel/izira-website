# IZIRA Solutions WhatsApp support router

This is the corporate support router for the official IZIRA Solutions WhatsApp hotline.

It is intentionally separate from KADAI's tenant-scoped WhatsApp integration and from myPOV.

## Customer flow

1. A customer messages the official IZIRA Solutions WhatsApp number.
2. If the customer does not already have an active routed conversation, the webhook replies:

   **Welcome to IZIRA Solutions.**  
   **Please select the team you would like to contact.**

   Buttons:
   - KADAI
   - myPOV
   - IZIRA Solutions

3. After a selection, the webhook replies:

   **Thank you. Your message has been directed to <team>. A team member will reply shortly.**

4. Automation then stays silent for the rest of the 24-hour routing window so a human can continue the conversation.
5. After 24 hours, a new inbound message starts a fresh routing session.

## Architecture

The corporate router should run in its own Supabase project. Do not deploy it into KADAI's `izira-commerce` project and do not use myPOV's backend.

Repository files:
- `supabase/functions/izira-whatsapp-router/index.ts`
- `supabase/migrations/20260926100000_add_whatsapp_support_router.sql`

## Required Supabase secrets

Set these in the dedicated corporate Supabase project. Never commit them:

- `META_APP_SECRET`
- `META_WHATSAPP_ACCESS_TOKEN`
- `IZIRA_WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- optional `META_GRAPH_VERSION`

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime.

## Meta webhook

The deployed Edge Function URL becomes the Meta webhook callback URL.

The function supports:
- Meta GET verification challenge
- HMAC SHA-256 validation using `x-hub-signature-256`
- inbound text messages
- interactive reply-button selections
- idempotent inbound processing using Meta message IDs
- 24-hour routing sessions
- human handoff after selection

The Edge Function must be deployed with JWT verification disabled because Meta will call it directly. Security is instead enforced by Meta webhook signature validation and the verification token.

## Production checklist

- Create a dedicated corporate Supabase project.
- Apply the migration.
- Set all required secrets.
- Deploy `izira-whatsapp-router` with JWT verification disabled.
- Register the function URL as the WhatsApp webhook in Meta.
- Subscribe to WhatsApp message events.
- Confirm the configured Meta phone-number ID belongs to the official IZIRA Solutions hotline.
- Test each of the three buttons from a non-admin phone.
- Confirm that free-form messages after selection do not trigger another automated greeting during the same 24-hour window.
- Test a new session after the routing window expires.

Do not place Meta credentials, access tokens, app secrets, or Supabase service-role keys in GitHub.

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type NotificationRecord = {
  id?: string;
  user_id?: string;
  content?: string;
  type?: string;
  url?: string | null;
  actor_id?: string | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const vapidSubject = Deno.env.get("VAPID_SUBJECT");
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

if (!supabaseUrl || !serviceRoleKey || !vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
  throw new Error("Missing push notification environment variables");
}

const admin = createClient(supabaseUrl, serviceRoleKey);
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" }
});

Deno.serve(async request => {
  if (request.method !== "POST") return json({ error: "POST required" }, 405);

  let payload: { record?: NotificationRecord };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const record = payload.record;
  if (!record?.user_id || !record.content) {
    return json({ error: "Notification record is required" }, 400);
  }

  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", record.user_id);

  if (error) return json({ error: error.message }, 500);

  const message = JSON.stringify({
    title: "Maxe",
    body: record.content,
    url: record.url || "/",
    notificationId: record.id,
    type: record.type || "default",
    image: record.actor_id ? (await admin
      .from("profiles")
      .select("avatar_url")
      .eq("id", record.actor_id)
      .maybeSingle()).data?.avatar_url || undefined : undefined
  });
  const expired: string[] = [];

  for (const subscription of subscriptions || []) {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      }, message);
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      const responseBody = (error as { body?: string }).body;
      if (statusCode === 404 || statusCode === 410) expired.push(subscription.id);
      else console.error("Push delivery failed", {
        subscriptionId: subscription.id,
        statusCode,
        responseBody,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (expired.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expired);
  }

  return json({ delivered: (subscriptions || []).length - expired.length, removed: expired.length });
});

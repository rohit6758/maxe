# Maxe Implementation History

This document records the Maxe work completed from the initial community/profile request through the current notification and Web Push implementation.

## 1. Initial product goals

The original upgrade request covered:

- Fixing profile and community-group image cropping.
- Making community chat reliable and easier to use.
- Adding profile avatars, usernames, typing indicators, and fast updates.
- Making notifications reliable.
- Improving calendar reminders and study-tracker reminders.
- Improving profile search and showing current profile information.
- Creating a more polished Pro experience.
- Improving mobile and Android/PWA behavior.
- Deploying the application to GitHub, Vercel, and `rohitbase.me`.
- Using a compact Maxe mark instead of the full logo for notifications.
- Showing notification sender and message details in a WhatsApp-style format.
- Supporting notifications outside the open app, including after the app is swiped away.

## 2. Community and profile improvements

### Community avatars and profile synchronization

Community members now use current profile data instead of stale or missing avatar information.

Implemented in:

- `src/screens/Explore.jsx`
- `src/components/NotificationsMenu.jsx`
- Related Supabase profile queries and Realtime subscriptions.

The community UI preserves sender identity, avatar, username, and profile updates when messages are loaded or refreshed.

### Community chat behavior

Community chat was restored and improved with:

- Message loading.
- Sender profiles.
- Mobile visibility.
- Typing indicator support.
- Community group access.
- Notification history access.
- Better optimistic message handling.

Important commits:

- `94e0011` — typing indicator bubble.
- `e5fc9d5` — community profiles and typing state.
- `9b1eb1c` — community chat access and notification history.
- `872e615` — mobile community chat visibility.

### Fixed repeated community reloads

The community was visibly resetting every few seconds because fallback polling replaced the current state even when the data had not changed.

The fix:

- Changed polling to silent mode.
- Added equality checks before replacing community or message state.
- Preserved optimistic pending messages.
- Preserved sender profile data.
- Avoided setting loading state during silent background refreshes.

Implemented in:

- `src/screens/Explore.jsx`

Commit:

- `7eb70c5` — stopped community polling from resetting the UI.

## 3. Notification database foundation

The notification system was moved from frontend-only behavior to database-backed behavior.

Implemented in:

- `supabase_maxe_schema.sql`
- `src/components/NotificationsMenu.jsx`
- `src/screens/Explore.jsx`
- `src/screens/CalendarModal.jsx`
- `src/screens/StudyTracker.jsx`

The notification table supports notification records containing information such as:

- Recipient user ID.
- Actor or sender information.
- Notification type.
- Notification content.
- Related URL.
- Read state.
- Creation timestamp.

The central SQL schema was made repeatable/idempotent so it can be run again without unnecessarily breaking an existing setup.

Commit:

- `a6a7d24` — database-driven notifications.

## 4. Database notification triggers

Supabase database triggers now create notification rows for important events.

The trigger functions include:

- `maxe_notify_follow`
- `maxe_notify_community_message`
- `maxe_notify_community_post`
- `maxe_notify_community_update`

These triggers handle notification creation for:

- New followers.
- Community messages.
- Community posts.
- Community/profile updates.

The frontend was also adjusted to avoid inserting duplicate notifications when the database trigger already creates the notification.

Request acceptance and rejection notifications remain client-created because they are direct actions handled by the request UI. Those notifications include a request type and actor ID.

## 5. Realtime notification delivery

Supabase Realtime was added for in-app notification updates.

Implemented behavior:

- Notification rows appear without a full page refresh.
- The bell badge updates.
- New notifications can display a banner.
- Notification history refreshes.
- Read and unread state is tracked.

Realtime channel lifecycle handling was fixed so subscriptions are cleaned up correctly and do not multiply over time.

Commit:

- `98265f6` — fixed Supabase Realtime channel lifecycle.

## 6. Notification panel and banners

The notification interface was upgraded from a basic list to an Instagram/WhatsApp-style notification experience.

Implemented in `src/components/NotificationsMenu.jsx`:

- Slide-in notification banners.
- Grouped notification history by date.
- Type-specific icons and colors.
- Unread badge counts.
- Read state updates.
- Dismiss controls.
- Sender lookup.
- Sender name or username.
- Notification message content.
- Related navigation URLs.
- Browser/device permission handling.

Notification text now explains:

- Who generated the notification.
- What happened.
- The relevant message or activity content when available.

Commits:

- `e9b2d5e` — device notification permission flow.
- `9d54d11` — full notification system upgrade.
- `79a4c15` — upgraded notification experience.
- `5fd0d86` — sender and message details.

## 7. Calendar and study reminders

Calendar and study tracker notification creation was connected to the notification system.

Implemented in:

- `src/screens/CalendarModal.jsx`
- `src/screens/StudyTracker.jsx`

Calendar notifications now include:

```text
type: "calendar"
```

Study reminders now include:

```text
type: "study"
```

These reminders can create notification rows while the application is running.

Important limitation:

- Browser timers do not guarantee delivery when Android has fully stopped the app.
- Server-side scheduling or Supabase cron would be needed for guaranteed reminders while the app is closed.

## 8. Profile search freshness

Updated profiles were not always appearing in search immediately.

The fix added:

- `profiles` to the Supabase Realtime publication.
- Realtime profile update handling.
- Refreshing active search results when profile data changes.
- Refreshing recent-search cards.
- A five-second fallback refresh while an active search is open.

Implemented in:

- `src/screens/UserSearch.jsx`
- `supabase_maxe_schema.sql`

Commit:

- `0f368f3` — refreshed updated profiles in search.

## 9. Mobile and Android/PWA improvements

The mobile experience was hardened for Android and PWA use.

Implemented changes included:

- Mobile overflow and tap handling.
- Safe-area support.
- Mobile install control.
- PWA metadata.
- `viewport-fit=cover`.
- Better notification placement on narrow screens.
- Mobile community chat visibility.

Files:

- `src/index.css`
- `src/Layout.jsx`
- `index.html`

Commit:

- `f98da6b` — hardened Android mobile experience.

## 10. Compact notification branding

The notification icon was changed from the full Maxe logo to the compact Maxe `M` mark.

Implemented in:

- `src/sw.js`
- Notification display code.

The service worker uses:

```text
/icon-96x96.png
```

for notification icons.

Commit:

- `4469034` — compact Maxe mark for push notifications.

## 11. Browser notification behavior

The app can request browser notification permission and show a device notification while the browser/PWA is running.

The flow now:

1. Checks whether the browser supports notifications.
2. Requests permission only when permission is still `default`.
3. Reuses an already-granted permission.
4. Registers the service worker.
5. Shows a notification using the service worker when available.
6. Shows the sender and message content.
7. Uses the compact Maxe icon.

The latest registration adjustment also shows a button for devices that already granted browser permission but have not yet registered a push subscription.

File:

- `src/components/NotificationsMenu.jsx`

Latest commit:

- `d015f7c` — registers already-approved devices for push.

## 12. Why Realtime alone was not enough

Supabase Realtime works while the app is open and connected.

It does not reliably deliver an event after Android has fully stopped or swiped away the PWA because:

- The JavaScript application is no longer running.
- The Realtime WebSocket is closed.
- No browser code is available to display the alert.

A service worker `push` event also cannot create a notification by itself. A server must first send a Web Push message to the device subscription.

This led to the closed-app Web Push implementation.

## 13. Web Push subscription storage

A `push_subscriptions` table was added to `supabase_maxe_schema.sql`.

The table stores:

- `id`
- `user_id`
- `endpoint`
- `p256dh`
- `auth`
- `created_at`
- `updated_at`

Row-level security allows an authenticated user to manage only their own subscriptions.

The browser subscription flow is implemented in:

- `src/components/NotificationsMenu.jsx`

The browser:

1. Registers or obtains the service worker.
2. Reads the public VAPID key from `VITE_VAPID_PUBLIC_KEY`.
3. Calls `pushManager.subscribe`.
4. Extracts the endpoint and encryption keys.
5. Upserts the subscription into `push_subscriptions`.

The private VAPID key is never needed in the frontend.

## 14. Service worker push receiver

The service worker was updated to receive push messages.

File:

- `src/sw.js`

The service worker:

- Handles the `push` event.
- Reads the push payload.
- Displays a notification.
- Uses the compact Maxe icon.
- Opens or focuses the application when the notification is clicked.

The payload is expected to contain information such as:

- Title.
- Message/body.
- URL.
- Notification type.

## 15. Supabase Edge Function sender

A real Web Push sender replaced the generated Supabase function placeholder.

Files:

- `supabase/functions/send-web-push/index.ts`
- `supabase/functions/send-web-push/deno.json`
- `supabase/functions/send-web-push/.npmrc`
- `supabase/config.toml`

The function:

1. Receives a notification webhook payload.
2. Reads the inserted notification record.
3. Finds the recipient's rows in `push_subscriptions`.
4. Reads VAPID secrets from Supabase secrets.
5. Sends a Web Push message to every active subscription.
6. Removes expired subscriptions when the push provider returns HTTP 404 or 410.

Expected webhook payload shape:

```json
{
  "record": {
    "user_id": "recipient-user-id",
    "content": "Notification text",
    "type": "message",
    "url": "/"
  }
}
```

The function uses:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

The service role key and VAPID private key remain server-side Supabase secrets.

`supabase/config.toml` currently disables JWT verification for webhook-style invocation:

```toml
[functions.send-web-push]
verify_jwt = false
```

This is useful for the initial Database Webhook connection, but a webhook secret should be added before treating the endpoint as fully hardened.

## 16. Supabase function deployment

The function was deployed to the correct Supabase project:

```powershell
npx.cmd supabase functions deploy send-web-push --project-ref dgveleeduexjklzojkcj
```

The correct project reference is:

```text
dgveleeduexjklzojkcj
```

An earlier inactive project was accidentally selected:

```text
sswrgkesmqzodcywmvla
```

That project was not used for the final deployment.

Docker was not running locally, but the remote Supabase deployment completed successfully.

## 17. VAPID key configuration

The public VAPID key belongs in the frontend environment:

```text
VITE_VAPID_PUBLIC_KEY
```

The public key may be visible in the browser.

The private VAPID key belongs only in Supabase Edge Function secrets:

```text
VAPID_PRIVATE_KEY
```

The VAPID subject belongs in Supabase secrets:

```text
VAPID_SUBJECT
```

The private key that was previously pasted into chat must be treated as compromised. A new VAPID key pair should be generated and both sides should be updated with the new matching pair.

Do not put the private key in:

- React source files.
- `Vercel` frontend environment variables.
- GitHub.
- `src`.
- `index.html`.

## 18. Production deployment

The complete upgrade set was promoted to production.

Production site:

```text
https://www.rohitbase.me
```

Important deployment commits:

- `dad24bc` — complete Maxe upgrades promoted to production.
- `2db5fdd` — notification delivery and unread-state hardening.
- `5cc6fbe` — closed-app Web Push implementation.
- `d015f7c` — already-approved device push registration.

The direct Vercel CLI deployment later returned `Not authorized`, but the GitHub-triggered production deployment exists and `origin/main` contains the latest commit.

The production branch currently includes:

```text
d015f7c
```

## 19. Current file map

### Frontend

```text
src/components/NotificationsMenu.jsx
src/sw.js
src/screens/Explore.jsx
src/screens/CalendarModal.jsx
src/screens/StudyTracker.jsx
src/screens/UserSearch.jsx
src/Layout.jsx
src/index.css
index.html
```

### Supabase

```text
supabase_maxe_schema.sql
supabase/config.toml
supabase/functions/send-web-push/index.ts
supabase/functions/send-web-push/deno.json
supabase/functions/send-web-push/.npmrc
```

## 20. What is complete now

Completed:

- Community avatar synchronization.
- Community chat access and mobile visibility.
- Typing indicator.
- Database-backed notifications.
- Notification triggers.
- Realtime notification updates.
- Notification banners.
- Grouped notification history.
- Read/unread state.
- Dismiss controls.
- Sender names and message details.
- Calendar and study reminder notification rows.
- Profile search refresh.
- Mobile/PWA hardening.
- Compact Maxe notification mark.
- Browser notification permission flow.
- Push subscription registration code.
- `push_subscriptions` database schema.
- Service worker push receiver.
- Supabase `send-web-push` Edge Function.
- Production deployment to `rohitbase.me`.

## 21. What remains to finish closed-app notifications

The remaining production connection is the Supabase Database Webhook.

In Supabase:

1. Open the project `dgveleeduexjklzojkcj`.
2. Open **Database → Webhooks**.
3. Create a webhook for `public.notifications`.
4. Select the `INSERT` event.
5. Target the deployed Edge Function `send-web-push`.
6. Save the webhook.

Then confirm a phone subscription exists:

```sql
select user_id, endpoint, created_at, updated_at
from public.push_subscriptions
order by created_at desc;
```

The phone must:

1. Open `https://www.rohitbase.me`.
2. Sign in.
3. Open the notification bell.
4. Tap the device registration button.
5. Allow notifications.
6. Be fully swiped away.
7. Receive a new follow or message from another account.

If the table has no row, the phone has not successfully registered its push subscription.

## 22. Final end-to-end notification flow

After the Database Webhook is configured, the complete flow is:

```text
User action
    ->
Supabase notification trigger or frontend notification insert
    ->
public.notifications INSERT
    ->
Supabase Database Webhook
    ->
send-web-push Edge Function
    ->
push_subscriptions lookup
    ->
Web Push provider
    ->
Android/browser service worker
    ->
Maxe notification with sender, message, sound, and compact M icon
```

## 23. Useful validation commands

Build the frontend:

```powershell
npm.cmd run build
```

Deploy the Edge Function:

```powershell
npx.cmd supabase functions deploy send-web-push --project-ref dgveleeduexjklzojkcj
```

Check recent GitHub deployments:

```powershell
gh api repos/rohit6758/maxe/deployments?per_page=3
```

Check push subscriptions in Supabase SQL Editor:

```sql
select user_id, endpoint, created_at, updated_at
from public.push_subscriptions
order by created_at desc;
```


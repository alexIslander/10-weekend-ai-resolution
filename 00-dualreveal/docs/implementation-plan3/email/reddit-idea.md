In the Reddit thread from r/selfhosted, the community discusses several ways to get a custom domain email (`you@yourdomain.com`) for free or at a very low cost. The options generally fall into three categories:

### 1. Free Options

* **Zoho Mail (Forever Free Plan):** This is the most frequently recommended "truly free" option.
* **Pros:** Supports up to 5 users, 5GB per user, and works with a custom domain.
* **Cons:** No POP/IMAP/SMTP access on the free tier (you must use their website or app), and the sign-up link is often hidden at the bottom of their pricing page.


* **Cloudflare Email Routing:**
* **Pros:** Completely free if you use Cloudflare for DNS. It lets you create any number of addresses and forward them to your personal Gmail/Outlook.
* **Cons:** It is **receive-only**. You cannot reply *from* your custom domain unless you pair it with a sending service (like Gmail's "Send Mail As" via an SMTP relay).


* **iCloud+ (Low Cost / "Free" for Apple Users):** If you already pay for any iCloud storage (starting at $0.99/mo), "Custom Email Domain" is included. It is highly recommended for users already in the Apple ecosystem.

### 2. Cheap Paid Options (Best Value)

If you need reliable sending/receiving with IMAP/SMTP support for third-party apps, these are the top community picks:

* **PurelyMail:** Often cited as the best "no-frills" budget option at **$10 per year** for unlimited domains and users.
* **MXRoute:** Extremely popular in the self-hosted community. They often have "Lifetime" or Black Friday deals. Unlike others, they charge for storage, not per user/mailbox.
* **Migadu:** Offers a "Micro" plan (approx. $19/year). They use a "pay for what you use" model based on outgoing volume rather than number of accounts.
* **Forward Email:** A privacy-focused service that offers email forwarding for free and a "send" feature for a low monthly fee (~$3/mo).

### 3. Self-Hosting (The "Hard Way")

While it is the theme of the subreddit, many users **warn against** self-hosting your own mail server (e.g., via Mailcow, Mail-in-a-Box, or Stalwart) unless you want a hobby.

* **The Issue:** Major providers (Gmail/Outlook) often block IP addresses from residential or cheap VPS ranges, meaning your emails will go to spam.
* **The Compromise:** Many "self-host" the server but use a free or cheap **SMTP Relay** (like **Brevo**, **Amazon SES**, or **SMTP2GO**) to ensure the emails actually get delivered.

### Summary Table

| Service | Cost | Best For |
| --- | --- | --- |
| **Zoho Mail** | Free | Someone who doesn't mind using a specific app/webmail. |
| **Cloudflare** | Free | Forwarding only (no direct sending). |
| **iCloud+** | ~$1/mo | Apple users who want a simple setup. |
| **PurelyMail** | ~$10/yr | The absolute cheapest full-featured service. |
| **MXRoute** | ~$30-40/yr | Multiple domains and power users. |
| **Amazon SES** | Pennies | Technical users who just need a way to send mail from a script/server. |
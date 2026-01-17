This guide details how to set up unlimited custom domain email addresses for free using **Cloudflare Email Routing** and a personal **Gmail** account.

---

## 🛠 Prerequisites

1. **A Gmail Account:** A standard `@gmail.com` address. [[00:51](http://www.youtube.com/watch?v=NmXWA08ly_s&t=51)]
2. **A Custom Domain:** You must own or have full control over a domain name. [[01:03](http://www.youtube.com/watch?v=NmXWA08ly_s&t=63)]
3. **Cloudflare Account:** Your domain must be added to Cloudflare (Free plan is sufficient). [[01:50](http://www.youtube.com/watch?v=NmXWA08ly_s&t=110)]

---

## Step 1: Add Your Domain to Cloudflare

If your domain is registered elsewhere (e.g., Name.com, GoDaddy):

1. Log in to **Cloudflare** and click **Add Domain**. [[01:55](http://www.youtube.com/watch?v=NmXWA08ly_s&t=115)]
2. Select the **Free Plan**. [[02:23](http://www.youtube.com/watch?v=NmXWA08ly_s&t=143)]
3. Cloudflare will provide two **Nameservers**. Copy these. [[04:02](http://www.youtube.com/watch?v=NmXWA08ly_s&t=242)]
4. Go to your domain registrar (where you bought the domain) and replace the existing nameservers with Cloudflare's. [[04:11](http://www.youtube.com/watch?v=NmXWA08ly_s&t=251)]
5. Wait for the status to change to **Active** in Cloudflare (usually 5–15 minutes). [[05:42](http://www.youtube.com/watch?v=NmXWA08ly_s&t=342)]

---

## Step 2: Configure Email Routing

1. In the Cloudflare dashboard, select your domain and go to **Email > Email Routing**. [[06:08](http://www.youtube.com/watch?v=NmXWA08ly_s&t=368)]
2. Click **Get Started** and create your first custom address (e.g., `hello@yourdomain.com`). [[06:13](http://www.youtube.com/watch?v=NmXWA08ly_s&t=373)]
3. Set the **Destination Address** to your personal Gmail account. [[06:21](http://www.youtube.com/watch?v=NmXWA08ly_s&t=381)]
4. **Verify Destination:** Check your Gmail inbox for a verification email from Cloudflare and click the link to confirm. [[06:52](http://www.youtube.com/watch?v=NmXWA08ly_s&t=412)]
5. **DNS Records:** Cloudflare will prompt you to add specific MX and TXT records. Click **Add records and enable** to do this automatically. [[07:54](http://www.youtube.com/watch?v=NmXWA08ly_s&t=474)]

---

## Step 3: Create a Google App Password

To send emails from your custom domain *through* Gmail, you need a secure way for Gmail to authenticate with itself.

1. Go to your **Google Account Settings**. [[14:13](http://www.youtube.com/watch?v=NmXWA08ly_s&t=853)]
2. Search for **App Passwords** (Ensure 2-Step Verification is enabled first). [[14:18](http://www.youtube.com/watch?v=NmXWA08ly_s&t=858)]
3. Give it a name (e.g., "Custom Email") and click **Create**. [[14:32](http://www.youtube.com/watch?v=NmXWA08ly_s&t=872)]
4. **Copy the 16-character password** provided. You will need this in the next step. [[15:21](http://www.youtube.com/watch?v=NmXWA08ly_s&t=921)]

---

## Step 4: Configure Gmail to "Send Mail As"

1. Open **Gmail Settings** (gear icon) > **See all settings** > **Accounts and Import**. [[13:32](http://www.youtube.com/watch?v=NmXWA08ly_s&t=812)]
2. In the "Send mail as" section, click **Add another email address**. [[16:19](http://www.youtube.com/watch?v=NmXWA08ly_s&t=979)]
3. **Name:** Your Name.
4. **Email Address:** Your custom domain email (e.g., `hello@yourdomain.com`). [[16:25](http://www.youtube.com/watch?v=NmXWA08ly_s&t=985)]
5. Check **Treat as an alias** and click Next. [[16:32](http://www.youtube.com/watch?v=NmXWA08ly_s&t=992)]
6. **SMTP Server Settings:** [[17:11](http://www.youtube.com/watch?v=NmXWA08ly_s&t=1031)]
* **SMTP Server:** `smtp.gmail.com`
* **Port:** `587`
* **Username:** Your full **Gmail** address (e.g., `user@gmail.com`). [[17:31](http://www.youtube.com/watch?v=NmXWA08ly_s&t=1051)]
* **Password:** The **16-character App Password** you generated in Step 3. [[17:00](http://www.youtube.com/watch?v=NmXWA08ly_s&t=1020)]
* Select **Secured connection using TLS**.


7. Click **Add Account**.
8. Gmail will send a confirmation code to your custom email. Since routing is active, this will arrive in your Gmail inbox. Copy the code and verify. [[18:24](http://www.youtube.com/watch?v=NmXWA08ly_s&t=1104)]

---

## Step 5: Final Adjustments

1. Go back to **Settings > Accounts and Import**. [[21:32](http://www.youtube.com/watch?v=NmXWA08ly_s&t=1292)]
2. Under "When replying to a message," select **Reply from the same address the message was sent to**. [[21:39](http://www.youtube.com/watch?v=NmXWA08ly_s&t=1299)]
3. You can now compose new emails and select your custom domain from the "From" dropdown menu. [[18:45](http://www.youtube.com/watch?v=NmXWA08ly_s&t=1125)]

---

**Video Source:** [Free Unlimited Custom Domain Email Addresses with Gmail and Cloudflare](https://www.youtube.com/watch?v=NmXWA08ly_s)
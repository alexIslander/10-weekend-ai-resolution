This guide covers two methods to set up a custom business email for free (or very cheap) using Gmail, based on the video from **Self-Employment Sidekick**.

---

## Method 1: The "Quick and Dirty" Way (Email Forwarding)

This is the easiest method but is **one-way only**: you can receive emails at your custom address, but replies will come from your personal `@gmail.com` address. [[03:09](http://www.youtube.com/watch?v=aMOzEjQALAM&t=189)]

1. **Purchase a Domain:** Use a registrar like **Namecheap** ($10–$15/year). [[01:21](http://www.youtube.com/watch?v=aMOzEjQALAM&t=81)]
2. **Set Up Forwarding:**
* Log in to your registrar and find your **Domain List**. [[01:59](http://www.youtube.com/watch?v=aMOzEjQALAM&t=119)]
* Go to **Manage** > **Redirect Email**. [[02:17](http://www.youtube.com/watch?v=aMOzEjQALAM&t=137)]
* Add a forwarder: `hello@yourdomain.com` forwards to `yourname@gmail.com`. [[02:25](http://www.youtube.com/watch?v=aMOzEjQALAM&t=145)]


3. **Test:** Send an email to the custom address and verify it arrives in your Gmail inbox. [[02:45](http://www.youtube.com/watch?v=aMOzEjQALAM&t=165)]

---

## Method 2: The Professional Way (Send & Receive via SMTP/POP3)

This method allows you to both **send and receive** emails using your custom domain through the Gmail interface. This typically requires email hosting, which often comes free with web hosting (like **Hostinger**). [[03:39](http://www.youtube.com/watch?v=aMOzEjQALAM&t=219)]

### 1. Configure DNS Records (if domain is elsewhere)

If your domain is at Cloudflare or Namecheap but your email host is Hostinger/Titan:

* **MX Records:** Add the MX records provided by your host (e.g., `mx1.titan.email`, Priority 10). [[06:29](http://www.youtube.com/watch?v=aMOzEjQALAM&t=389)]
* **SPF Record:** Add a `TXT` record with the SPF value provided by your host to ensure your emails aren't marked as spam. [[07:09](http://www.youtube.com/watch?v=aMOzEjQALAM&t=429)]

### 2. Connect Gmail to Receive Mail (POP3)

1. In **Gmail Settings** > **Accounts and Import** > **Check mail from other accounts**, click **Add a mail account**. [[08:17](http://www.youtube.com/watch?v=aMOzEjQALAM&t=497)]
2. Enter your custom email address. [[08:29](http://www.youtube.com/watch?v=aMOzEjQALAM&t=509)]
3. **POP Settings:** [[09:18](http://www.youtube.com/watch?v=aMOzEjQALAM&t=558)]
* **Username:** Your full custom email address.
* **POP Server:** `pop.base_host_url` (e.g., `pop.titan.email`).
* **Port:** `995`.
* **Security:** Check **Always use a secure connection (SSL)**.
* **Tip:** Uncheck "Leave a copy of retrieved messages" to save space on your host's server. [[09:40](http://www.youtube.com/watch?v=aMOzEjQALAM&t=580)]



### 3. Connect Gmail to Send Mail (SMTP)

1. After adding the POP account, Gmail will ask if you want to be able to **send mail** as that address. Select **Yes**. [[10:06](http://www.youtube.com/watch?v=aMOzEjQALAM&t=606)]
2. **SMTP Settings:** [[10:29](http://www.youtube.com/watch?v=aMOzEjQALAM&t=629)]
* **SMTP Server:** `smtp.base_host_url` (e.g., `smtp.titan.email`).
* **Port:** `465` or `587`.
* **Username/Password:** Use your business email credentials.


3. **Verify:** Click the confirmation link in the email Gmail sends to your custom address. [[11:07](http://www.youtube.com/watch?v=aMOzEjQALAM&t=667)]

---

## Important Final Settings

To make the experience seamless:

1. Go to **Gmail Settings** > **Accounts and Import**. [[12:07](http://www.youtube.com/watch?v=aMOzEjQALAM&t=727)]
2. Under "Send mail as," select **Reply from the same address the message was sent to**. [[12:16](http://www.youtube.com/watch?v=aMOzEjQALAM&t=736)]
3. (Optional) **Labeling:** Assign a specific color to the label of your custom domain so you can easily spot business emails in your primary inbox. [[11:22](http://www.youtube.com/watch?v=aMOzEjQALAM&t=682)]

---

**Video Source:** [Use Gmail with a Custom Domain for FREE (or almost free)](https://www.youtube.com/watch?v=aMOzEjQALAM)
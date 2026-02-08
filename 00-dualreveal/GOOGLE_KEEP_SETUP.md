# Google Keep Master Token Setup

This guide helps you generate a master token for authenticating with Google Keep using `gkeepapi`.

## Quick Start

### Option 1: Python Script (Recommended)

1. Install dependencies:
   ```bash
   pip install gpsoauth
   ```

2. Run the script:
   ```bash
   python3 get_google_master_token.py
   ```

3. Enter:
   - Your Google email
   - Your app password (not your regular password if 2FA is enabled)
   - Android ID (press Enter to use default)

### Option 2: Docker (from gkeepapi docs)

```bash
docker run --rm -it --entrypoint /bin/sh python:3 -c 'pip install gpsoauth; python3 -c '\''print(__import__("gpsoauth").exchange_token(input("Email: "), input("OAuth Token: "), input("Android ID: ")))'\'
```

**Note:** This requires an OAuth token, not a password. See "Getting an OAuth Token" below.

### Option 3: Direct Python

```python
from gpsoauth import perform_master_login

email = "your-email@gmail.com"
password = "your-app-password"  # Use app password if 2FA enabled
android_id = "9774d56d682e549c"  # Default Android ID

result = perform_master_login(email, password, android_id)
master_token = result['Token']
print(master_token)
```

## What You Need

### 1. App Password (if 2FA is enabled)

If you have 2-Step Verification enabled:
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password (not your regular password)

### 2. Android ID

You can use:
- Default: `9774d56d682e549c`
- Generate one: Visit https://www.android-id.net/ or use any 16-character hex string

### 3. OAuth Token (for Docker method only)

If using the Docker method that requires an OAuth token:
1. Visit https://accounts.google.com/EmbeddedSetup/select-device
2. Complete the OAuth flow
3. Extract the token from the response

## Using the Master Token

Once you have the master token, use it with gkeepapi:

```python
import gkeepapi

keep = gkeepapi.Keep()
keep.authenticate('your-email@gmail.com', master_token)
keep.sync()

# Create a note
note = keep.createNote('My Note', 'Note content')
keep.sync()
```

## Security Best Practices

**Never commit the master token to version control!**

Store it securely:

```python
import keyring

# Save token
keyring.set_password('google-keep-token', 'your-email@gmail.com', master_token)

# Retrieve token
master_token = keyring.get_password('google-keep-token', 'your-email@gmail.com')
```

Or use environment variables:

```bash
export GOOGLE_KEEP_MASTER_TOKEN="your-token-here"
```

```python
import os
master_token = os.environ.get('GOOGLE_KEEP_MASTER_TOKEN')
```

## Troubleshooting

### "NeedsBrowser" or "CaptchaRequired" error
- Use an app password instead of your regular password
- Try from a different network/IP
- Ensure you're using Python 3.7+

### "DeviceManagementRequiredOrSyncDisabled" error
- This is a G-Suite account restriction
- Disable device management policies in your admin console

### Token generation fails
- Verify your app password is correct
- Try a different Android ID
- Check that your account allows API access

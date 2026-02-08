#!/usr/bin/env python3
"""
Generate a Google master token for gkeepapi authentication.

Requirements:
- pip install gpsoauth

You'll need:
1. Your Google email address
2. An OAuth token (see instructions below)
3. An Android ID (see instructions below)
"""

import sys

try:
    from gpsoauth import perform_master_login, perform_oauth
except ImportError:
    print("Error: gpsoauth not installed. Install it with:")
    print("  pip install gpsoauth")
    sys.exit(1)


def get_master_token(email, password, android_id):
    """
    Generate a master token using gpsoauth.
    
    Args:
        email: Your Google email address
        password: Your Google password or app password
        android_id: A valid Android ID (16 hex characters)
    
    Returns:
        Master token string
    """
    try:
        # First, perform master login to get token
        res = perform_master_login(email, password, android_id)
        
        if 'Token' not in res:
            print(f"Error: Failed to get token. Response: {res}")
            if 'Error' in res:
                print(f"Error message: {res.get('Error')}")
            return None
        
        return res['Token']
    except Exception as e:
        print(f"Error generating master token: {e}")
        return None


def main():
    print("Google Master Token Generator for gkeepapi")
    print("=" * 50)
    
    # Get inputs
    email = input("Enter your Google email: ").strip()
    password = input("Enter your Google password or app password: ").strip()
    android_id = input("Enter Android ID (16 hex chars, or press Enter for default): ").strip()
    
    # Use default Android ID if not provided
    if not android_id:
        android_id = "9774d56d682e549c"  # Default Android ID
        print(f"Using default Android ID: {android_id}")
    
    print("\nGenerating master token...")
    master_token = get_master_token(email, password, android_id)
    
    if master_token:
        print("\n" + "=" * 50)
        print("SUCCESS! Your master token:")
        print("=" * 50)
        print(master_token)
        print("=" * 50)
        print("\n⚠️  SECURITY WARNING:")
        print("This token has full access to your Google account.")
        print("Store it securely (e.g., using keyring or environment variables).")
        print("\nExample usage with gkeepapi:")
        print(f"  keep = gkeepapi.Keep()")
        print(f"  keep.authenticate('{email}', '{master_token}')")
    else:
        print("\nFailed to generate master token.")
        print("\nTroubleshooting:")
        print("1. Make sure you're using an app password if 2FA is enabled")
        print("2. Try a different Android ID (generate one at https://www.android-id.net/)")
        print("3. Check that your account allows less secure apps (if applicable)")
        sys.exit(1)


if __name__ == "__main__":
    main()

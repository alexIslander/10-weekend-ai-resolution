To secure your onboarding architecture and protect it from structural bypasses, spoofing, or data corruption, data validation must occur directly at the database layer.

This comprehensive SQL configuration contains fine-grained **CHECK Constraints** for data sanitization and strict **Row-Level Security (RLS) Policies** tailored for the Supabase authentication ecosystem (`auth.uid()`).

---

DB data: project url: https://tjxlxtvqzbkqzqzlsrmc.supabase.co
connectionstring: postgresql://postgres:my-life-ops-dev@db.tjxlxtvqzbkqzqzlsrmc.supabase.co:5432/postgres


## 🛠️ 1. Data Validation Guardrails (CHECK Constraints)

These constraints prevent malicious or malformed inputs (such as empty strings, zero-width characters, negative progress tracking, or invalid timezone configurations) from entering the database, regardless of frontend validation status.

```sql
-- Apply defensive integrity rules to the user_profiles table
ALTER TABLE public.user_profiles
  -- 1. Enforce display name boundaries (No empty names, no leading/trailing spaces, 2-50 characters)
  ADD CONSTRAINT chk_display_name_format
    CHECK (
      char_length(trim(both ' ' from display_name)) >= 2 
      AND char_length(display_name) <= 50
      AND display_name = trim(both ' ' from display_name)
    ),

  -- 2. Prevent hidden/zero-width space spoofing exploits
  ADD CONSTRAINT chk_no_zero_width_spaces
    CHECK (display_name !~ '[\u200B-\u200D\uFEFF]'),

  -- 3. Verify IANA/Olson standard timezone structural format (e.g., 'UTC', 'America/New_York')
  ADD CONSTRAINT chk_timezone_structural_format
    CHECK (timezone ~ '^[A-Za-z0-9_\-+]+(/[A-Za-z0-9_\-+]+)*$'),

  -- 4. Secure core tracking metrics against integer overflow or negative anomalies
  ADD CONSTRAINT chk_total_xp_non_negative
    CHECK (total_xp >= 0),

  -- 5. Enforce progression baseline tracking parameters
  ADD CONSTRAINT chk_current_level_positive
    CHECK (current_level >= 1);

```

### Why these constraints are critical:

* **`display_name = trim(...)`**: Rejects inputs that mask their actual length with whitespace padding.
* **`!~ '[\u200B-\u200D\uFEFF]'`**: Rejects non-printable unicode anomalies that malicious users might exploit to create visually identical usernames or disrupt frontend DOM text arrays.
* **`timezone ~ '...'`**: Imposes strict structural syntax validation for standard timezone fields without needing to reference mutable system timezone catalogs.

---

## 🔒 2. Identity Isolation (Row-Level Security Policies)

These policies enforce data isolation. They ensure users can only see, create, or update their own specific profile records. It strictly maps operations against the authenticated Supabase token payload (`auth.uid()`).

```sql
-- Enable Row Level Security safely
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Clear pre-existing loose policies to avoid rule collisions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile during onboarding" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile fields" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

-- 1. SELECT: Authorization to read personal tracking telemetry
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. INSERT: Handles the Phase 3 manual initialization block 
CREATE POLICY "Users can create their own profile during onboarding"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. UPDATE: Restricts mutation paths exclusively to the owner's record
CREATE POLICY "Users can update their own profile fields"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. DELETE: Complete identity erasure containment policy
CREATE POLICY "Users can delete their own profile"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

```

### RLS Implementation Guardrails Explained:

* **`FOR INSERT WITH CHECK (auth.uid() = id)`**: This rule prevents a compromised client machine from generating or inserting data records for other user accounts.
* **`FOR UPDATE USING / WITH CHECK`**: The `USING` clause confirms that you own the existing target row, while the `WITH CHECK` clause ensures that you cannot change the row's ownership `id` to someone else during the modification.

---

## 🧼 3. Automated Data Sanitization (Triggers)

To make your application even more robust, you can use a `BEFORE` database trigger to automatically sanitize user input. For example, it can clean up accidental double-spaces or strange whitespace formatting in the `display_name` before evaluating the `CHECK` constraints.

```sql
CREATE OR REPLACE FUNCTION public.sanitize_profile_onboarding_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Collapse multiple consecutive internal space inputs into a single space character
    IF NEW.display_name IS NOT NULL THEN
        NEW.display_name := regexp_replace(trim(both ' ' from NEW.display_name), '\s+', ' ', 'g');
    END IF;
    
    -- Force structural timezone parameters to fallback to UTC if left unassigned
    IF NEW.timezone IS NULL OR trim(NEW.timezone) = '' THEN
        NEW.timezone := 'UTC';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the sanitization processor to execute right before evaluation steps occur
DROP TRIGGER IF EXISTS trigger_sanitize_profile ON public.user_profiles;
CREATE TRIGGER trigger_sanitize_profile
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_profile_onboarding_data();

```

---

## 🎯 Verification: Testing Database Safeguards

You can verify these database safeguards directly within your Supabase SQL Editor by executing the following test mutations to confirm that invalid data is caught:

```sql
-- ❌ TEST A: This should FAIL (Violates display name character length constraint)
INSERT INTO public.user_profiles (id, display_name, timezone) 
VALUES ('00000000-0000-0000-0000-000000000000', 'X', 'UTC');

-- ❌ TEST B: This should FAIL (Violates timezone structural syntax regex)
INSERT INTO public.user_profiles (id, display_name, timezone) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Valid Name', 'Invalid/Timezone/Format/String!!!');

--  TEST C: This should SUCCESS (Trigger automatically cleans up excessive internal spacing)
INSERT INTO public.user_profiles (id, display_name, timezone) 
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Operator    Name   With   Spaces', 'America/New_York');
-- Result saved to disk: 'Operator Name With Spaces'

```
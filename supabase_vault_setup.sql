-- 1. Enable Vault Extension (Requires Supabase superuser, but usually enabled via Dashboard or automatically in Supabase)
-- If it's not enabled, you can run this in the Supabase SQL Editor:
create extension if not exists supabase_vault;

-- 2. Insert your NEW OneSignal REST API key securely.
-- DO NOT COMMIT THIS FILE OR KEY TO GITHUB.
-- Replace 'ENTER_YOUR_NEW_ONESIGNAL_REST_API_KEY_HERE' with your actual new API key.
SELECT vault.create_secret(
  'ENTER_YOUR_NEW_ONESIGNAL_REST_API_KEY_HERE',
  'onesignal_rest_api_key',
  'The REST API key used to send OneSignal push notifications.'
);

-- Note: You should execute this SQL exactly once in your Supabase SQL Editor.
-- Once executed, the key will be securely stored and retrievable only by Postgres using the vault helper functions.

/**
 * Client-safe 的 session／密碼政策常數。
 *
 * 資訊安全需求：這些值同時被 server（`auth.ts`）與 client（後台 UI）使用，
 * 因此不能放在會 import `node:crypto` / `next/headers` 的模組裡。
 * 單一來源，避免前後端驗證規則不一致。
 */
export const MIN_PASSWORD_LENGTH = 12;

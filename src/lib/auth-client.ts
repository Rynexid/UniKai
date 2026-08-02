import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL as string,
  fetchOptions: {
    credentials: "include", // wajib agar cookie session ikut terkirim cross-origin
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

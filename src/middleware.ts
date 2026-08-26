export { auth as default } from "./auth";

// Auth.js decrypts the encrypted session cookie, which requires the Node.js
// runtime in this Next.js version.
export const runtime = "nodejs";

export const config = {
  matcher: ["/protected/:path*", "/permissions/:path*"],
};

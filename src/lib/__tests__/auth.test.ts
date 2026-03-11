// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify, SignJWT } from "jose";

vi.mock("server-only", () => ({}));

type CookieEntry = { value: string; options?: Record<string, any> };
const cookieStore = new Map<string, CookieEntry>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const entry = cookieStore.get(name);
      return entry !== undefined ? { value: entry.value } : undefined;
    },
    set: (name: string, value: string, options?: Record<string, any>) => {
      cookieStore.set(name, { value, options });
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  })),
}));

beforeEach(() => {
  cookieStore.clear();
});

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

test("createSession sets auth-token cookie", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  expect(cookieStore.has("auth-token")).toBe(true);
});

test("createSession stores a valid JWT in the cookie", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  const token = cookieStore.get("auth-token")!.value;
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload).toBeTruthy();
});

test("createSession encodes userId and email in the token", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-42", "hello@example.com");

  const token = cookieStore.get("auth-token")!.value;
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("hello@example.com");
});

test("createSession sets expiresAt approximately 7 days from now", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();

  await createSession("user-1", "test@example.com");

  const token = cookieStore.get("auth-token")!.value;
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const expiresAt = new Date(payload.expiresAt as string).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expiresAt).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expiresAt).toBeLessThanOrEqual(before + sevenDays + 1000);
});

test("createSession sets httpOnly cookie option", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  const options = cookieStore.get("auth-token")!.options;
  expect(options?.httpOnly).toBe(true);
});

test("createSession sets cookie path to /", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  const options = cookieStore.get("auth-token")!.options;
  expect(options?.path).toBe("/");
});

test("createSession sets sameSite to lax", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  const options = cookieStore.get("auth-token")!.options;
  expect(options?.sameSite).toBe("lax");
});

// --- getSession ---

async function createTestToken(
  userId: string,
  email: string,
  expiresIn = "7d"
): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new SignJWT({ userId, email, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

test("getSession returns null when no cookie is present", async () => {
  const { getSession } = await import("@/lib/auth");

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns session payload for a valid token", async () => {
  const { getSession } = await import("@/lib/auth");

  const token = await createTestToken("user-1", "a@b.com");
  cookieStore.set("auth-token", { value: token });

  const session = await getSession();

  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("a@b.com");
});

test("getSession returns null for a tampered token", async () => {
  const { getSession } = await import("@/lib/auth");

  cookieStore.set("auth-token", { value: "tampered.invalid.token" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const { getSession } = await import("@/lib/auth");

  const token = await createTestToken("user-1", "a@b.com", "-1s");
  cookieStore.set("auth-token", { value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

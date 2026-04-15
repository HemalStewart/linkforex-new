"use client";

import { API_BASE_URL, isApiRequestUrl } from "@/lib/api";
import { getStoredUser } from "@/lib/authStorage";

declare global {
  interface Window {
    __linkforexApiFetchWrapped__?: boolean;
    __linkforexOriginalFetch__?: typeof window.fetch;
  }
}

const buildHeaders = (input: RequestInfo | URL, init?: RequestInit): Headers => {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  return headers;
};

const resolveApiUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

export function ApiAuthBridge() {
  if (typeof window !== "undefined" && !window.__linkforexApiFetchWrapped__) {
    window.__linkforexApiFetchWrapped__ = true;
    window.__linkforexOriginalFetch__ = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveApiUrl(input);

      if (!isApiRequestUrl(url, window.location.origin)) {
        return window.__linkforexOriginalFetch__!(input, init);
      }

      const headers = buildHeaders(input, init);
      const storedUser = getStoredUser<{ id?: string | number }>();
      const actingUserId = storedUser?.id;

      if (actingUserId && !headers.has("X-Acting-User-Id")) {
        headers.set("X-Acting-User-Id", String(actingUserId));
      }

      if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
      }

      const nextInit: RequestInit = {
        ...init,
        headers,
      };

      if (input instanceof Request) {
        return window.__linkforexOriginalFetch__!(new Request(input, nextInit));
      }

      return window.__linkforexOriginalFetch__!(input, nextInit);
    };
  }

  return null;
}

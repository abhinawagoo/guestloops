"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Script from "next/script";

type WhatsAppStatus = {
  connected: boolean;
  account: {
    id: string;
    displayName: string | null;
    status: string;
    connectedAt: string;
  } | null;
};

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string }; status?: string }) => void,
        options: { config_id: string; response_type: string; override_default_response_type: boolean }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
const META_WHATSAPP_CONFIG_ID = process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID ?? "";

export function WhatsAppSettings() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fbReady, setFbReady] = useState(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/status");
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch {
      setStatus({ connected: false, account: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.FB) {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v22.0",
      });
      setFbReady(true);
    }
  }, []);

  const handleConnect = () => {
    if (!META_APP_ID || !META_WHATSAPP_CONFIG_ID) {
      setError("WhatsApp Embedded Signup is not configured. Add NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID.");
      return;
    }

    if (!window.FB) {
      setError("Facebook SDK is still loading. Please try again.");
      return;
    }

    setConnecting(true);
    setError(null);

    // Timeout: if callback never fires (popup blocked, user closes, etc.), reset after 60s
    connectTimeoutRef.current = setTimeout(() => {
      setConnecting(false);
      setError("Connection timed out. Check if a popup was blocked, or try again.");
      connectTimeoutRef.current = null;
    }, 60000);

    window.FB.login(
      (response) => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }

        if (response.status !== "connected" || !response.authResponse?.code) {
          const msg =
            response.status === "unknown"
              ? "Connection failed. Ensure your Meta App has WhatsApp Embedded Signup configured and Valid OAuth Redirect URIs include this page."
              : "WhatsApp connection was cancelled or failed. Please try again.";
          setError(msg);
          setConnecting(false);
          return;
        }

        const redirectUri = typeof window !== "undefined" ? window.location.origin + window.location.pathname : undefined;
        fetch("/api/admin/whatsapp/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: response.authResponse.code, redirect_uri: redirectUri }),
        })
          .then((res) => res.json().then((data) => ({ res, data })))
          .then(({ res, data }) => {
            if (!res.ok) {
              setError(data.error ?? "Failed to connect WhatsApp");
              return;
            }
            return fetchStatus();
          })
          .catch((e) => setError((e as Error).message ?? "Failed to connect"))
          .finally(() => setConnecting(false));
      },
      {
        config_id: META_WHATSAPP_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
      }
    );
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to disconnect");
        return;
      }
      await fetchStatus();
    } catch (e) {
      setError((e as Error).message ?? "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="admin-card overflow-hidden border bg-card">
        <CardContent className="pt-6 pb-6">
          <p className="text-sm text-muted-foreground">Loading WhatsApp status…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.FB) {
            window.FB.init({
              appId: META_APP_ID,
              cookie: true,
              xfbml: false,
              version: "v22.0",
            });
            setFbReady(true);
          }
        }}
      />
      <Card className="admin-card overflow-hidden border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">WhatsApp</CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect your WhatsApp Business number to send messages to guests. Each business connects their own number via Meta Embedded Signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {status?.connected && status.account ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {status.account.displayName ?? "WhatsApp Business"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connected {status.account.connectedAt ? new Date(status.account.connectedAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-lg">
                  {status.account.status}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your WhatsApp Business number to send template messages, review requests, and offers to guests.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="rounded-xl"
                  onClick={handleConnect}
                  disabled={connecting || !META_APP_ID || !META_WHATSAPP_CONFIG_ID}
                >
                  {connecting ? "Connecting…" : "Connect WhatsApp"}
                </Button>
                {connecting && (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        if (connectTimeoutRef.current) {
                          clearTimeout(connectTimeoutRef.current);
                          connectTimeoutRef.current = null;
                        }
                        setConnecting(false);
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <p className="w-full text-xs text-muted-foreground mt-1">
                      A Meta signup popup should open. If nothing appears, check for popup blockers or allow third-party cookies.
                    </p>
                  </>
                )}
              </div>
              {(!META_APP_ID || !META_WHATSAPP_CONFIG_ID) && (
                <p className="text-xs text-muted-foreground">
                  Configure NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID in your Meta App to enable Embedded Signup.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

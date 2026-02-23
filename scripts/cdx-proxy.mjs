/**
 * Local CDX proxy for development.
 * Proxies requests to web.archive.org CDX API through the system HTTP proxy.
 * Required because workerd (wrangler dev) cannot use HTTP proxies for outbound fetch.
 *
 * Usage: node scripts/cdx-proxy.mjs
 * Listens on http://localhost:8799
 */
import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import { URL } from "node:url";

const CDX_ORIGIN = "https://web.archive.org";
const PORT = 8799;
const PROXY_URL =
  process.env.HTTP_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.http_proxy ||
  process.env.https_proxy;

if (PROXY_URL) {
  console.log(`[cdx-proxy] Using proxy: ${PROXY_URL}`);
} else {
  console.log("[cdx-proxy] No proxy detected, connecting directly");
}

/**
 * Fetch a URL through an HTTP CONNECT proxy.
 */
function fetchViaProxy(targetUrl, proxyUrl) {
  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyUrl);
    const target = new URL(targetUrl);
    const timeout = 30000;

    // Step 1: Send CONNECT request to proxy
    const connectReq = http.request({
      host: proxy.hostname,
      port: proxy.port,
      method: "CONNECT",
      path: `${target.hostname}:${target.port || 443}`,
      timeout,
    });

    connectReq.on("connect", (_res, socket) => {
      // Step 2: Establish TLS over the tunnel
      const tlsOptions = {
        host: target.hostname,
        socket,
        servername: target.hostname,
      };
      const tlsSocket = tls.connect(tlsOptions, () => {
        // Step 3: Send the actual HTTPS request
        const req = https.request(
          targetUrl,
          {
            createConnection: () => tlsSocket,
            headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
            timeout,
          },
          (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body: Buffer.concat(chunks),
              });
            });
          }
        );
        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Request timeout"));
        });
        req.end();
      });
      tlsSocket.on("error", reject);
    });

    connectReq.on("error", reject);
    connectReq.on("timeout", () => {
      connectReq.destroy();
      reject(new Error("Proxy CONNECT timeout"));
    });
    connectReq.end();
  });
}

/**
 * Fetch a URL directly (no proxy).
 */
function fetchDirect(targetUrl) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
        timeout: 30000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

const server = http.createServer(async (req, res) => {
  const targetUrl = `${CDX_ORIGIN}${req.url}`;
  console.log(`[cdx-proxy] -> ${targetUrl}`);

  try {
    const result = PROXY_URL
      ? await fetchViaProxy(targetUrl, PROXY_URL)
      : await fetchDirect(targetUrl);

    console.log(`[cdx-proxy] <- ${result.status} (${result.body.length} bytes)`);
    res.writeHead(result.status, {
      "Content-Type": result.headers["content-type"] || "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(result.body);
  } catch (e) {
    console.error(`[cdx-proxy] Error:`, e.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`[cdx-proxy] Ready on http://localhost:${PORT}`);
});

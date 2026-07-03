// Cloudflare Worker — serves WhatsApp web app + proxies WuzAPI calls
import html from './index.html';

const WUZAPI = 'https://entertaining-sciences-bedford-molecules.trycloudflare.com';

// API paths to proxy through to WuzAPI
const API_ROUTES = ['/session', '/user', '/chat', '/webhook', '/admin', '/message'];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Proxy API calls to WuzAPI (same-origin from browser's perspective)
    if (API_ROUTES.some(r => path.startsWith(r))) {
      const target = new URL(path + url.search, WUZAPI);
      const headers = new Headers(request.headers);
      headers.set('Origin', WUZAPI);
      // If the client sent an Authorization, use it; otherwise use the token header
      if (!headers.has('token') && !headers.has('Token')) {
        // Token comes from the client's request
      }

      const proxyRequest = new Request(target, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? await request.arrayBuffer()
          : undefined,
      });

      let response = await fetch(proxyRequest);

      // Add CORS headers for the browser
      response = new Response(response.body, response);
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', '*');
      return response;
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // Serve the app HTML
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
};

import type { APIRoute } from 'astro';

/**
 * Note: on a GitHub *project* page the served path is /<base>/robots.txt, which
 * crawlers ignore — they only read the origin root. This becomes authoritative
 * the moment the site moves to a custom domain. Until then, submit the sitemap
 * URL directly in Google Search Console.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://darkify19.github.io');
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + '/';

  const body = `User-agent: *
Allow: /

Sitemap: ${new URL(`${base}sitemap.xml`, origin).href}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

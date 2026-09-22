import type { APIRoute } from 'astro';

/**
 * Hand-rolled instead of @astrojs/sitemap: the site is a single page, so the
 * integration would be a dependency for four lines of XML. Add the integration
 * if this ever grows real routes.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://darkify19.github.io');
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + '/';

  const pages = [{ path: base, changefreq: 'monthly', priority: '1.0' }];
  const lastmod = new Date().toISOString().slice(0, 10);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${new URL(p.path, origin).href}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

// Portfolio events for the GA4 tag in Layout.astro. The tag loads only in
// production; open the live site with ?ga_debug=1 to see these in DebugView.
//
// Mark as key events: resume_download, email_click, github_click, linkedin_click.
// Register event-scoped custom dimensions for section_id, section_name,
// ui_region, repository, content_type, and content_id. Register section_index
// as a custom metric.
//
// Names sit beside enhanced measurement (click, file_download) so both can
// stay on. Nothing here includes the email address or the résumé cache-buster.

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

export interface AnchorClick {
  /** Absolute URL (HTMLAnchorElement.href, or an SVG link resolved against the page). */
  href: string;
  text: string;
  target: string;
  mapNode: string | null;
  uiRegion: string;
  pageUrl: string;
}

export interface TrackedEvent {
  name: string;
  params: Record<string, string | number>;
}

const CLIP = 100;

const SECTION_INDEX: Record<string, number> = {
  hero: 1,
  work: 2,
  practice: 3,
  cadence: 4,
  experience: 5,
  ai: 6,
  stack: 7,
  contact: 8,
};

function clip(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length > CLIP ? trimmed.slice(0, CLIP) : trimmed;
}

function event(
  name: string,
  params: Record<string, string | number>,
  beacon = false,
): TrackedEvent {
  const clean: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      if (value === '') continue;
      clean[key] = value;
    } else if (Number.isFinite(value)) {
      clean[key] = value;
    }
  }
  if (beacon) clean.transport_type = 'beacon';
  return { name, params: clean };
}

function pathKey(url: URL): string {
  return url.origin + url.pathname.replace(/\/$/, '');
}

function linkUrl(url: URL): string {
  const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  return clip(url.origin + path);
}

function leavesPage(target: string): boolean {
  return target.toLowerCase() !== '_blank';
}

export function classifyAnchor(click: AnchorClick): TrackedEvent | null {
  if (click.mapNode) {
    return event('select_content', {
      content_type: 'map_node',
      content_id: clip(click.mapNode),
      ui_region: 'map',
    });
  }

  let url: URL;
  let page: URL;
  try {
    url = new URL(click.href);
    page = new URL(click.pageUrl);
  } catch {
    return null;
  }

  const region = clip(click.uiRegion);
  const text = clip(click.text);

  if (url.protocol === 'mailto:') {
    return event('email_click', { ui_region: region }, true);
  }

  const fileName = decodeURIComponent(url.pathname.split('/').pop() ?? '');
  if (/\.pdf$/i.test(fileName)) {
    return event(
      'resume_download',
      {
        file_name: clip(fileName),
        file_extension: 'pdf',
        link_text: text,
        ui_region: region,
      },
      leavesPage(click.target),
    );
  }

  if (pathKey(url) === pathKey(page) && url.hash) {
    return event('select_content', {
      content_type: 'nav',
      content_id: clip(decodeURIComponent(url.hash.slice(1)) || 'top'),
      ui_region: region,
    });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (pathKey(url) === pathKey(page)) return null;

  const host = url.host;
  const shared = {
    link_url: linkUrl(url),
    link_domain: host,
    link_text: text,
    ui_region: region,
  };
  const beacon = leavesPage(click.target);

  if (host === 'github.com' || host === 'www.github.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    return event(
      'github_click',
      { ...shared, repository: clip(parts.length <= 1 ? 'profile' : parts[1]) },
      beacon,
    );
  }

  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    return event('linkedin_click', shared, beacon);
  }

  if (host.endsWith('.github.io')) {
    const parts = url.pathname.split('/').filter(Boolean);
    return event('docs_click', { ...shared, site: clip(parts[0] || 'home') }, beacon);
  }

  return event('outbound_click', shared, beacon);
}

export function classifyControl(paused: boolean): TrackedEvent {
  return event('select_content', {
    content_type: 'map_control',
    content_id: paused ? 'pause' : 'play',
    ui_region: 'map',
  });
}

export function sectionView(id: string, name: string): TrackedEvent {
  const params: Record<string, string | number> = {
    section_id: clip(id),
    section_name: clip(name),
  };
  const index = SECTION_INDEX[id];
  if (index) params.section_index = index;
  return event('section_view', params);
}

function uiRegion(el: Element): string {
  if (el.closest('.topbar')) return 'topbar';
  if (el.closest('[data-eco-map]')) return 'map';
  if (el.closest('#contact')) return 'contact';
  if (el.closest('[data-hero]')) return 'hero';
  const section = el.closest('section[id]');
  if (section instanceof HTMLElement && section.id) return section.id;
  return 'page';
}

function absoluteHref(anchor: Element): string {
  if (anchor instanceof HTMLAnchorElement) return anchor.href;
  const raw = anchor.getAttribute('href') || '';
  try {
    return new URL(raw, location.href).href;
  } catch {
    return raw;
  }
}

function sectionId(el: HTMLElement): string {
  if (el.id) return el.id;
  if (el.hasAttribute('data-hero')) return 'hero';
  return '';
}

function sectionLabel(el: HTMLElement, id: string): string {
  if (id === 'hero') return 'Hero';
  return el.querySelector('h2')?.textContent ?? id;
}

export function startPortfolioAnalytics(): void {
  if (typeof document === 'undefined') return;
  const gtag = window.gtag;
  if (typeof gtag !== 'function') return;

  const send = (tracked: TrackedEvent | null) => {
    if (!tracked) return;
    gtag('event', tracked.name, tracked.params);
  };

  // Bubble, not capture: the map updates aria-pressed in its own click
  // handler before this runs, so pause/play matches the state just set.
  document.addEventListener('click', (domEvent) => {
    const target = domEvent.target;
    if (!(target instanceof Element)) return;

    const control = target.closest('[data-events-toggle]');
    if (control) {
      send(classifyControl(control.getAttribute('aria-pressed') === 'true'));
      return;
    }

    const anchor = target.closest('a[href]');
    if (!anchor) return;
    send(
      classifyAnchor({
        href: absoluteHref(anchor),
        text: anchor.textContent ?? '',
        target: anchor.getAttribute('target') ?? '',
        mapNode: anchor.getAttribute('data-node'),
        uiRegion: uiRegion(anchor),
        pageUrl: location.href,
      }),
    );
  });

  const sections = document.querySelectorAll<HTMLElement>('[data-hero], main section[id]');
  if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

  const seen = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        if (!(el instanceof HTMLElement)) continue;
        const id = sectionId(el);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        send(sectionView(id, sectionLabel(el, id)));
        observer.unobserve(el);
      }
    },
    // Any pixel in the upper part of the viewport. A ratio threshold never
    // fires for the long Work section, which is taller than the screen.
    { threshold: 0, rootMargin: '-8% 0px -35% 0px' },
  );

  sections.forEach((el) => observer.observe(el));
}

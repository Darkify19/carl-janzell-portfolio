import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyAnchor, classifyControl, sectionView } from './analytics.ts';
import type { AnchorClick } from './analytics.ts';

const page = 'https://darkify19.github.io/carl-janzell-portfolio/';

function click(over: Partial<AnchorClick> & Pick<AnchorClick, 'href'>): AnchorClick {
  return {
    text: '',
    target: '',
    mapNode: null,
    uiRegion: 'page',
    pageUrl: page,
    ...over,
  };
}

describe('classifyAnchor', () => {
  it('records a map node without also recording the hash as navigation', () => {
    const tracked = classifyAnchor(
      click({
        href: `${page}#tks`,
        mapNode: 'tks',
        uiRegion: 'hero',
      }),
    );
    assert.deepEqual(tracked, {
      name: 'select_content',
      params: { content_type: 'map_node', content_id: 'tks', ui_region: 'map' },
    });
  });

  it('records in-page navigation and ignores a trailing-slash mismatch', () => {
    const tracked = classifyAnchor(
      click({
        href: 'https://darkify19.github.io/carl-janzell-portfolio#work',
        text: 'work',
        uiRegion: 'topbar',
        pageUrl: page,
      }),
    );
    assert.equal(tracked?.name, 'select_content');
    assert.equal(tracked?.params.content_type, 'nav');
    assert.equal(tracked?.params.content_id, 'work');
    assert.equal(tracked?.params.ui_region, 'topbar');
  });

  it('records the résumé without the cache-buster or a full URL', () => {
    const tracked = classifyAnchor(
      click({
        href: `${page}OropesaCarlJanzell-CV.pdf?v=abc12345`,
        text: 'résumé.pdf',
        target: '_blank',
        uiRegion: 'hero',
      }),
    );
    assert.equal(tracked?.name, 'resume_download');
    assert.equal(tracked?.params.file_name, 'OropesaCarlJanzell-CV.pdf');
    assert.equal(tracked?.params.file_extension, 'pdf');
    assert.equal(tracked?.params.ui_region, 'hero');
    assert.equal(tracked?.params.link_text, 'résumé.pdf');
    assert.equal(tracked?.params.transport_type, undefined);
    assert.equal(JSON.stringify(tracked).includes('abc12345'), false);
  });

  it('sends a mailto click on unload and never includes the address', () => {
    const tracked = classifyAnchor(
      click({
        href: 'mailto:carl.oropesa11@gmail.com',
        text: 'carl.oropesa11@gmail.com',
        uiRegion: 'contact',
      }),
    );
    assert.deepEqual(tracked, {
      name: 'email_click',
      params: { ui_region: 'contact', transport_type: 'beacon' },
    });
  });

  it('splits a GitHub profile from a repository', () => {
    const profile = classifyAnchor(
      click({
        href: 'https://github.com/Darkify19',
        text: 'github',
        target: '_blank',
        uiRegion: 'hero',
      }),
    );
    const repo = classifyAnchor(
      click({
        href: 'https://github.com/Darkify19/samyang-back',
        text: 'samyang-back ↗',
        target: '_blank',
        uiRegion: 'stack',
      }),
    );
    assert.equal(profile?.name, 'github_click');
    assert.equal(profile?.params.repository, 'profile');
    assert.equal(profile?.params.link_url, 'https://github.com/Darkify19');
    assert.equal(repo?.params.repository, 'samyang-back');
    assert.equal(repo?.params.ui_region, 'stack');
    assert.equal(profile?.params.transport_type, undefined);
  });

  it('records LinkedIn and the docs site', () => {
    const linkedin = classifyAnchor(
      click({
        href: 'https://www.linkedin.com/in/carl-janzell-764399179/',
        text: 'linkedin',
        target: '_blank',
        uiRegion: 'contact',
      }),
    );
    const docs = classifyAnchor(
      click({
        href: 'https://darkify19.github.io/filament-page-builder/',
        text: 'docs ↗',
        target: '_blank',
        uiRegion: 'stack',
      }),
    );
    assert.equal(linkedin?.name, 'linkedin_click');
    assert.equal(linkedin?.params.link_domain, 'www.linkedin.com');
    assert.equal(
      linkedin?.params.link_url,
      'https://www.linkedin.com/in/carl-janzell-764399179',
    );
    assert.equal(docs?.name, 'docs_click');
    assert.equal(docs?.params.site, 'filament-page-builder');
  });

  it('beacons an outbound link that leaves this tab', () => {
    const tracked = classifyAnchor(
      click({ href: 'https://example.com/writeup', text: 'writeup', uiRegion: 'work' }),
    );
    assert.equal(tracked?.name, 'outbound_click');
    assert.equal(tracked?.params.link_domain, 'example.com');
    assert.equal(tracked?.params.transport_type, 'beacon');
  });

  it('ignores a same-page link with no hash', () => {
    assert.equal(classifyAnchor(click({ href: page })), null);
  });
});

describe('classifyControl', () => {
  it('names the state the map just entered', () => {
    assert.equal(classifyControl(true).params.content_id, 'pause');
    assert.equal(classifyControl(false).params.content_id, 'play');
    assert.equal(classifyControl(true).params.content_type, 'map_control');
  });
});

describe('sectionView', () => {
  it('numbers the known sections and keeps the heading', () => {
    const tracked = sectionView('work', 'Work');
    assert.equal(tracked.name, 'section_view');
    assert.equal(tracked.params.section_id, 'work');
    assert.equal(tracked.params.section_name, 'Work');
    assert.equal(tracked.params.section_index, 2);
  });

  it('still records a section that is not in the index', () => {
    const tracked = sectionView('notes', 'Notes');
    assert.equal(tracked.params.section_index, undefined);
    assert.equal(tracked.params.section_id, 'notes');
  });
});

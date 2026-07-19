const MARKER_HEIGHT = 18;
const PIN_SETTLE_MS = 800;

function resolveHeaderOffset() {
  if (typeof getComputedStyle !== 'function') {
    return 88;
  }
  let raw = getComputedStyle(document.documentElement).getPropertyValue('--lp-header-height');
  let parsed = Number.parseInt(raw, 10);
  return (Number.isFinite(parsed) ? parsed : 64) + 24;
}

/**
 * Picks the active outline entry for a scroll position. The reading line
 * sits at headerOffset below the viewport top; the active section is the
 * last heading above that line. Headings too close to the document end can
 * never reach the line, so the final stretch of scrolling is divided into
 * equal segments and each remaining heading is activated in turn as the
 * page presses into the bottom edge.
 * @param {{tops: number[], scrollY: number, maxScroll: number, headerOffset: number}} state
 * @returns {number} active heading index, or -1 for none
 */
export function resolveActiveIndex({ tops, scrollY, maxScroll, headerOffset }) {
  let count = tops.length;
  if (count === 0) {
    return -1;
  }

  let line = scrollY + headerOffset;
  let index = -1;
  for (let i = 0; i < count; i++) {
    if (tops[i] > line) {
      break;
    }
    index = i;
  }

  if (maxScroll <= 0) {
    return index;
  }

  let firstUnreachable = -1;
  for (let i = 0; i < count; i++) {
    if (tops[i] > maxScroll + headerOffset) {
      firstUnreachable = i;
      break;
    }
  }

  if (firstUnreachable !== -1) {
    let base = firstUnreachable > 0
      ? Math.max(tops[firstUnreachable - 1] - headerOffset, 0)
      : 0;
    let span = maxScroll - base;
    if (span > 0 && scrollY >= base) {
      let step = span / (count - firstUnreachable + 1);
      let advance = Math.floor((scrollY - base) / step);
      if (advance > 0) {
        index = Math.min(firstUnreachable - 1 + advance, count - 1);
      }
    }
  }

  if (maxScroll - scrollY < 2) {
    index = count - 1;
  }

  return index;
}

/**
 * Tracks the reading position on docs pages: highlights the outline link
 * for the section in view, slides the rail marker to it, and mirrors the
 * section into the URL hash. Hash navigation (outline clicks, heading
 * anchors, direct links) pins its target until the reader scrolls again.
 * The static outline stays fully usable without this enhancement.
 * @returns {() => void} cleanup
 */
export function enhanceDocsOutline() {
  let aside = document.querySelector('.lp-toc');
  if (!aside) {
    return () => {};
  }
  let marker = aside.querySelector('.lp-toc-marker');
  let links = Array.from(aside.querySelectorAll('.lp-toc-link'));
  if (!marker || links.length === 0) {
    return () => {};
  }

  let linksById = new Map();
  for (let link of links) {
    let hash = link.hash || '';
    if (hash.length > 1) {
      linksById.set(decodeURIComponent(hash.slice(1)), link);
    }
  }

  let headings = Array.from(
    document.querySelectorAll('.lp-article :is(h2, h3)[id]')
  ).filter(heading => linksById.has(heading.id));
  if (headings.length === 0) {
    return () => {};
  }

  let headerOffset = resolveHeaderOffset();
  let activeLink = null;
  let pinned = false;
  let pinnedAt = 0;
  let currentHash = () => (window.location && window.location.hash) || '';

  let setActive = link => {
    if (link === activeLink) {
      return;
    }
    if (activeLink) {
      activeLink.classList.remove('active');
    }
    activeLink = link;
    if (link) {
      link.classList.add('active');
      let top = link.offsetTop + (link.offsetHeight - MARKER_HEIGHT) / 2;
      marker.style.top = `${top}px`;
      marker.classList.add('is-visible');
    } else {
      marker.classList.remove('is-visible');
    }
  };

  let syncHash = link => {
    let history = window.history;
    if (!window.location || !history || typeof history.replaceState !== 'function') {
      return;
    }
    let hash = link ? link.hash : '';
    if (hash === window.location.hash) {
      return;
    }
    let url = hash ? hash : window.location.pathname + window.location.search;
    history.replaceState(history.state, '', url);
  };

  let update = () => {
    let tops = headings.map(heading => heading.getBoundingClientRect().top + window.scrollY);
    let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    let index = resolveActiveIndex({
      tops,
      scrollY: window.scrollY,
      maxScroll,
      headerOffset
    });
    let link = index === -1 ? null : linksById.get(headings[index].id) || null;
    setActive(link);
    syncHash(link);
  };

  let pinTo = id => {
    let link = linksById.get(id);
    if (!link) {
      return false;
    }
    pinned = true;
    pinnedAt = Date.now();
    setActive(link);
    return true;
  };

  let releasePin = () => {
    if (!pinned) {
      return;
    }
    pinned = false;
    update();
  };

  let onScroll = () => {
    if (pinned) {
      if (Date.now() - pinnedAt < PIN_SETTLE_MS) {
        return;
      }
      pinned = false;
    }
    update();
  };

  let onInput = () => releasePin();

  let onHashChange = () => {
    let id = decodeURIComponent(currentHash().slice(1));
    if (!id || !pinTo(id)) {
      releasePin();
    }
  };

  let onLinkClick = event => {
    let link = event.currentTarget;
    let hash = link.hash || '';
    if (hash.length > 1) {
      pinTo(decodeURIComponent(hash.slice(1)));
    }
  };

  for (let link of links) {
    link.addEventListener('click', onLinkClick);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('wheel', onInput, { passive: true });
  window.addEventListener('touchmove', onInput, { passive: true });
  window.addEventListener('hashchange', onHashChange);

  let initialId = decodeURIComponent(currentHash().slice(1));
  if (!initialId || !pinTo(initialId)) {
    update();
  }

  return () => {
    for (let link of links) {
      link.removeEventListener('click', onLinkClick);
    }
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    window.removeEventListener('wheel', onInput);
    window.removeEventListener('touchmove', onInput);
    window.removeEventListener('hashchange', onHashChange);
    setActive(null);
  };
}

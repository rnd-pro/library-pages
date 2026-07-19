const MARKER_HEIGHT = 18;

function resolveHeaderOffset() {
  if (typeof getComputedStyle !== 'function') {
    return 88;
  }
  let raw = getComputedStyle(document.documentElement).getPropertyValue('--lp-header-height');
  let parsed = Number.parseInt(raw, 10);
  return (Number.isFinite(parsed) ? parsed : 64) + 24;
}

/**
 * Tracks the reading position on docs pages: highlights the outline link for
 * the section currently in view and slides the rail marker to it. The static
 * outline stays fully usable without this enhancement.
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

  let onScroll = () => {
    let scrollBottom = window.innerHeight + window.scrollY;
    let scrollHeight = document.documentElement.scrollHeight;
    if (scrollHeight - scrollBottom < 2) {
      setActive(links[links.length - 1]);
      return;
    }
    let current = null;
    for (let heading of headings) {
      if (heading.getBoundingClientRect().top > headerOffset) {
        break;
      }
      current = heading;
    }
    setActive(current ? linksById.get(current.id) : null);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    setActive(null);
  };
}

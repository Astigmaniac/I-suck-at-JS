/* index.js
    Tailwind-friendly: toggles a site "BW" (light) mode by adding/removing `bw` on <html>,
    creates a Tailwind-styled floating toolbar, back-to-top, and a comments box
    matching the blonded archive aesthetic. Images/media are explicitly left untouched.
*/

(function () {
  const LS_KEY = 'blog_bw_mode_v1';
  const COMMENTS_KEY = 'blog_comments_v1';
  const SCROLL_SHOW_PX = 300;

  // CSS overrides used when html.bw is active.
  // We target the literal Tailwind utility class names in your HTML so we can
  // flip backgrounds/text/borders to light equivalents while preserving accents.
  const style = document.createElement('style');
  style.textContent = `
     /* Ensure media are not affected when switching theme */
     html.bw img, html.bw picture, html.bw video, html.bw svg {
        filter: none !important;
        opacity: 1 !important;
        background: transparent !important;
     }

     /* Body defaults (your site starts dark) -> light equivalents when bw active */
     html.bw body, html.bw .min-h-screen {
        background-color: #ffffff !important;
        color: #0b0b0d !important;
     }

     /* override common explicit text/util classes used in markup */
     html.bw .text-\\[\\#e9eef1\\], html.bw .text-white {
        color: #0b0b0d !important;
     }

     /* cards / panel dark backgrounds -> subtle light backgrounds */
     html.bw .bg-\\[\\#0b0b0d\\], html.bw .bg-\\[\\#18181b\\] {
        background-color: #ffffff !important;
     }
     html.bw .bg-\\[\\#18181b\\] {
        /* give cards a very light neutral to keep separation from body */
        background-color: #fafafa !important;
     }

     /* borders that were dark -> light gray in bw mode */
     html.bw .border-\\[\\#232325\\], html.bw .border-\\[\\#232325\\] {
        border-color: #e6e6e6 !important;
     }

     /* muted text in dark -> muted dark in light mode */
     html.bw .text-\\[\\#fffde4\\], html.bw .text-\\[\\#fffde4\\]\\/80 {
        color: #3a3a3a !important;
     }

     /* keep gold accents unchanged (don't override .text-[#f2c94c] or .bg-[#b08a13]) */
     /* toolbar/button fine tuning for both states */
     .bw-toggle-btn-on {
        background-color: #ffffff !important;
        color: #0b0b0d !important;
        border-color: #d1d1d1 !important;
     }
     .bw-toggle-btn-off {
        background-color: #0b0b0d !important;
        color: #f5f7f8 !important;
        border-color: #232325 !important;
     }

     /* accessibility fallback for sr-only */
     .sr-only {
        position: absolute !important;
        height: 1px; width: 1px;
        overflow: hidden;
        clip: rect(1px, 1px, 1px, 1px);
        white-space: nowrap;
     }
  `;
  document.head.appendChild(style);

  // Create toolbar using Tailwind utility classes
  const toolbar = document.createElement('div');
  toolbar.className = 'fixed right-4 bottom-4 flex flex-col gap-2 z-[99999] select-none';
  toolbar.setAttribute('aria-hidden', 'false');

  // Helper to build button with Tailwind classes
  function mkBtn({ title, html, pressed = false, extraClasses = '' }) {
     const b = document.createElement('button');
     b.type = 'button';
     b.title = title;
     b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
     b.className = [
        'w-11 h-11 rounded-lg border flex items-center justify-center',
        // base look (we will toggle bw classes when state changes)
        'bg-white text-black border-gray-200 shadow-sm',
        'hover:-translate-y-1 transition-transform',
        extraClasses
     ].join(' ');
     b.innerHTML = html;
     return b;
  }

  // BW toggle (we add/remove 'bw' on <html>)
  const bwBtn = mkBtn({
     title: 'Toggle theme (press "b")',
     html: '<span aria-hidden="true">B/W</span><span class="sr-only">Toggle theme (light / dark)</span>',
     pressed: false
  });
  toolbar.appendChild(bwBtn);

  // Back-to-top button (initially hidden)
  const topBtn = mkBtn({
     title: 'Back to top (press "t")',
     html: '<span aria-hidden="true">↑</span><span class="sr-only">Back to top</span>',
     extraClasses: 'hidden'
  });
  toolbar.appendChild(topBtn);

  document.body.appendChild(toolbar);

  // Comments panel built with Tailwind classes (light + dark variants included)
  const commentsPanel = document.createElement('section');
  commentsPanel.className = [
     'max-w-3xl mx-auto my-10 p-5 rounded-lg border',
     'bg-white text-black border-gray-200 shadow-lg',
     'font-sans'
  ].join(' ');
  commentsPanel.setAttribute('aria-label', 'Comments');
  commentsPanel.innerHTML = `
        <h3 id="comments-title" class="text-xs uppercase tracking-wider font-semibold mb-2">Comments</h3>
        <div class="comments-list space-y-2 max-h-72 overflow-auto pr-2" id="comments-list" role="list" aria-labelledby="comments-title">
             <div class="comment empty text-sm text-gray-600" id="comments-empty">No comments yet. Be the first to write one!</div>
        </div>

        <form class="comment-form mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" id="comment-form" aria-describedby="comments-title">
             <div class="left space-y-2">
                 <label class="sr-only" for="comment-name">Name (optional)</label>
                 <input type="text" id="comment-name" name="name" placeholder="Your name (optional)" maxlength="60"
                     class="w-full p-2 rounded border bg-gray-50 text-black border-gray-200 placeholder-gray-500" />
                 <label class="sr-only" for="comment-body">Comment</label>
                 <textarea id="comment-body" name="body" placeholder="Write a comment..." required maxlength="2000" aria-required="true"
                     class="w-full p-2 rounded border bg-gray-50 text-black border-gray-200 placeholder-gray-500 min-h-[88px] resize-vertical"></textarea>
             </div>
             <div class="comment-actions flex flex-col gap-2 items-end" aria-hidden="false">
                 <button type="submit" id="comment-submit"
                     class="px-3 py-2 rounded bg-white text-black border border-gray-200 hover:bg-gray-100">Post</button>
                 <button type="button" id="comment-clear"
                     class="px-3 py-2 rounded border border-gray-200 text-gray-700 bg-transparent">Clear all</button>
             </div>
        </form>
  `;
  // insert comments above toolbar so toolbar doesn't overlap
  document.body.insertBefore(commentsPanel, toolbar);

  // sanitize text to avoid XSS
  function escapeHtml(s) {
     return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
  }

  // Comments storage & rendering
  function loadComments() {
     try {
        const raw = localStorage.getItem(COMMENTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
     } catch (e) { /* ignore */ }
     return [];
  }
  function saveComments(arr) {
     try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(arr)); } catch (e) { /* ignore */ }
  }

  const commentsListEl = commentsPanel.querySelector('#comments-list');
  const commentsEmptyEl = commentsPanel.querySelector('#comments-empty');
  const form = commentsPanel.querySelector('#comment-form');
  const inputName = commentsPanel.querySelector('#comment-name');
  const inputBody = commentsPanel.querySelector('#comment-body');
  const btnClear = commentsPanel.querySelector('#comment-clear');

  let comments = loadComments();

  function renderComments() {
     commentsListEl.innerHTML = '';
     if (!comments.length) {
        commentsListEl.appendChild(commentsEmptyEl);
        return;
     }
     comments.forEach((c) => {
        const item = document.createElement('div');
        item.className = 'comment p-3 rounded bg-gray-50 border border-gray-100 text-sm';
        const meta = document.createElement('div');
        meta.className = 'text-xs text-gray-600 mb-1';
        const who = c.name ? escapeHtml(c.name) : 'Anonymous';
        const time = new Date(c.ts).toLocaleString();
        meta.innerHTML = `<strong class="font-medium text-gray-900">${who}</strong> · <span class="opacity-75">${escapeHtml(time)}</span>`;
        const body = document.createElement('div');
        body.className = 'body text-gray-900 whitespace-pre-wrap';
        body.innerHTML = escapeHtml(c.body);
        item.appendChild(meta);
        item.appendChild(body);
        commentsListEl.appendChild(item);
     });
     commentsListEl.scrollTop = commentsListEl.scrollHeight;
  }

  renderComments();

  form.addEventListener('submit', (ev) => {
     ev.preventDefault();
     const body = (inputBody.value || '').trim();
     if (!body || body.length < 2) {
        inputBody.focus();
        return;
     }
     const name = (inputName.value || '').trim();
     const entry = { name: name || '', body: body, ts: Date.now() };
     comments.push(entry);
     if (comments.length > 200) comments = comments.slice(-200);
     saveComments(comments);
     renderComments();
     form.reset();
     inputBody.focus();
  });

  btnClear.addEventListener('click', () => {
     if (!comments.length) return;
     if (!confirm('Clear all saved comments? This cannot be undone.')) return;
     comments = [];
     saveComments(comments);
     renderComments();
  });

  // Apply or remove "bw" mode (adds/removes 'bw' on <html>)
  function applyBW(enabled, persist = true) {
     const root = document.documentElement;
     if (enabled) {
        root.classList.add('bw');
        bwBtn.setAttribute('aria-pressed', 'true');
        bwBtn.classList.remove('bw-toggle-btn-off');
        bwBtn.classList.add('bw-toggle-btn-on');
     } else {
        root.classList.remove('bw');
        bwBtn.setAttribute('aria-pressed', 'false');
        bwBtn.classList.remove('bw-toggle-btn-on');
        bwBtn.classList.add('bw-toggle-btn-off');
     }
     if (persist) {
        try { localStorage.setItem(LS_KEY, enabled ? '1' : '0'); } catch (e) { /* ignore */ }
     }
  }

  // Load preference (if previously set)
  (function loadPref() {
     try {
        const v = localStorage.getItem(LS_KEY);
        if (v === '1') applyBW(true, false);
        else applyBW(false, false);
     } catch (e) { applyBW(false, false); }
  })();

  // initialize button visual state based on current root class
  if (document.documentElement.classList.contains('bw')) {
     bwBtn.classList.add('bw-toggle-btn-on');
  } else {
     bwBtn.classList.add('bw-toggle-btn-off');
  }

  // Toggle handler
  bwBtn.addEventListener('click', () => {
     const enabled = document.documentElement.classList.toggle('bw');
     bwBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
     if (enabled) {
        bwBtn.classList.remove('bw-toggle-btn-off');
        bwBtn.classList.add('bw-toggle-btn-on');
     } else {
        bwBtn.classList.remove('bw-toggle-btn-on');
        bwBtn.classList.add('bw-toggle-btn-off');
     }
     try { localStorage.setItem(LS_KEY, enabled ? '1' : '0'); } catch (e) { /* ignore */ }
  });

  // Smooth scroll to top
  topBtn.addEventListener('click', () => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Show/hide top button on scroll
  function onScroll() {
     const lastKnownScroll = window.scrollY || window.pageYOffset;
     if (lastKnownScroll > SCROLL_SHOW_PX) {
        topBtn.classList.remove('hidden');
     } else {
        topBtn.classList.add('hidden');
     }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Keyboard shortcuts: b -> toggle theme, t -> back to top, c -> focus comment textarea
  window.addEventListener('keydown', (ev) => {
     const target = ev.target;
     const tag = target && target.tagName;
     const isTyping = target && (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable);
     if (isTyping) return;

     if (ev.key === 'b' || ev.key === 'B') {
        ev.preventDefault();
        bwBtn.click();
     } else if (ev.key === 't' || ev.key === 'T') {
        ev.preventDefault();
        topBtn.click();
     } else if (ev.key === 'c' || ev.key === 'C') {
        ev.preventDefault();
        inputBody.focus();
     }
  });

  // Minimal external API
  window.__blogUI = {
     setBW: (v) => applyBW(Boolean(v)),
     isBW: () => document.documentElement.classList.contains('bw'),
     scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
     focusComment: () => inputBody.focus(),
     getComments: () => loadComments()
  };
})();
//yea i asked copilot to make my code neat as hell
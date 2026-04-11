---
layout: page
title: News
permalink: news/
---

Recent updates, achievements, and announcements.

{% include news-list.html %}

<button class="news-jump" type="button" aria-label="Jump to oldest" data-state="down">
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path class="news-jump__arrow" d="M10 4 L10 16 M5 11 L10 16 L15 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
</button>

<script>
(function() {
    var btn = document.querySelector('.news-jump');
    if (!btn) return;
    var timeline = document.querySelector('.news-timeline');
    if (!timeline) return;

    function update() {
        var scrolled = window.scrollY || document.documentElement.scrollTop;
        var max = (document.documentElement.scrollHeight - window.innerHeight);
        var visible = scrolled > 180;
        btn.classList.toggle('is-visible', visible);
        var nearBottom = scrolled > max - 240;
        btn.dataset.state = nearBottom ? 'up' : 'down';
        btn.setAttribute('aria-label', nearBottom ? 'Jump to latest' : 'Jump to oldest');
    }

    btn.addEventListener('click', function() {
        var nearBottom = btn.dataset.state === 'up';
        window.scrollTo({
            top: nearBottom ? 0 : document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.target.matches('input, textarea, [contenteditable]')) return;
        if (e.key === 'j') window.scrollBy({ top: 240, behavior: 'smooth' });
        if (e.key === 'k') window.scrollBy({ top: -240, behavior: 'smooth' });
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();
</script>

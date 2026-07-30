---
layout: page
bg: true
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

<!-- The inline script that used to live here (jump button + j/k) moved into
     assets/js/news-motion.js, so that j/k cannot be handled twice when the
     friction mode is on. -->

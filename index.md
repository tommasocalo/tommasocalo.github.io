---
layout: home
title: Home
---
<div id="intro-wrapper" class="l-text">
<div id="intro-title-wrapper">
   <div id="intro-image-wrapper">
      <img id="intro-image" src="/images/portrait.jpeg">
   </div>
   <div id="intro-title-text-wrapper">
      <h1 id="intro-title">Hi, I'm Tommaso</h1>
      <div id="intro-subtitle">I'm a Postdoctoral Researcher at Politecnico Di Torino</div>
      <div id="intro-title-socials">
         {% for link in site.data.social-links %}
         {% if link.on-homepage == true %}
         {% include social-link.html link=link %}
         {% endif %}
         {% endfor %}
      </div>
   </div>
</div>
<!-- <hr class="l-middle home-hr"> -->
<div id="everything-else" class="l-middle">
   <a href="{{ site.url }}/cv">
      <div><i class="fa fa-portrait icon icon-right-space"></i>CV</div>
   </a>
   <a href="{{ site.url }}/projects">
      <div><i class="fa fa-shapes icon icon-right-space"></i>Projects</div>
   </a>
   <a href="{{ site.url }}/everything-else">
      <div><i class="fa fa-list-ul icon icon-right-space"></i>Everything Else</div>
   </a>
</div>
<div>
   I study and develop methods to bridge humans and AI systems. My current main focus is on <b>UI design and development</b>, where I leverage modern Machine Learning, Human-Computer Interaction, and Human-AI Interaction techniques to make UI prototyping more efficient, simple, fun, and effective.
   <div style="height: 1rem"></div>
   <div>
      I am a Postdoctoral Researcher at <img class="intro-logo" style="width: 24px;" src="/images/polito.jpeg"> <a href="https://www.polito.it/"> Politecnico di Torino</a>, working in the <img class="intro-logo" style="width: 24px;" src="/images/elite.png"> <a href="https://elite.polito.it/">e-Lite research group</a>. Previously, I completed my Ph.D. under the supervision of <a href="https://www.polito.it/personale?p=luigi.derussis">Luigi De Russis</a> and visited the <a href="https://tail.cc.gatech.edu/">Teachable AI Lab</a> at the <a href="https://www.gatech.edu/"> <img class="intro-logo" style="width: 24px;" src="/images/gatech.svg"> Georgia Institute of Technology</a> under the supervision of <a href="https://chrismaclellan.com/">Christopher MacLellan</a>.
   </div>
   <div style="height: 1rem"></div>
</div>
</div>
<hr class="l-middle home-hr">
<h2 class="feature-title">Latest <a href="{{ site.url }}/news">News</a></h2>
<p class="feature-text">
   Recent updates, achievements, and announcements.
</p>
<div class="news-wrapper l-page">
   {% for news in site.categories.news limit:3 %}
   {% if news.summary %}
   {% assign summary_html = news.summary | markdownify %}
   {% else %}
   {% assign summary_html = news.excerpt | default: news.content %}
   {% endif %}
   <div class="news-item">
      <div class="news-content-wrapper">
         <div class="news-date">{{ news.date | date: "%B %d, %Y" }}</div>
         <div class="news-summary">{{ summary_html }}</div>
         {% if news.projects or news.pdfs or news.project or news.pdf %}
         <div class="cover-links summary-links">
            <span class="pub-misc">
               {% if news.projects %}
                 {% for link in news.projects %}
                 <a href="{{ link }}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Project</a>
                 {% endfor %}
               {% elsif news.project %}
                 <a href="{{ news.project }}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Project</a>
               {% endif %}
               {% if news.pdfs %}
                 {% for link in news.pdfs %}
                 <a href="{{ link }}"><i class="fas fa-file-pdf" aria-hidden="true"></i> PDF</a>
                 {% endfor %}
               {% elsif news.pdf %}
                 <a href="{{ news.pdf }}"><i class="fas fa-file-pdf" aria-hidden="true"></i> PDF</a>
               {% endif %}
            </span>
         </div>
         {% endif %}
         <div class="news-details">
            {{ news.content }}
            {% if news.projects or news.pdfs or news.project or news.pdf %}
            <div class="cover-links expanded-links">
               <span class="pub-misc">
                  {% if news.projects %}
                    {% for link in news.projects %}
                    <a href="{{ link }}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Project</a>
                    {% endfor %}
                  {% elsif news.project %}
                    <a href="{{ news.project }}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Project</a>
                  {% endif %}
                  {% if news.pdfs %}
                    {% for link in news.pdfs %}
                    <a href="{{ link }}"><i class="fas fa-file-pdf" aria-hidden="true"></i> PDF</a>
                    {% endfor %}
                  {% elsif news.pdf %}
                    <a href="{{ news.pdf }}"><i class="fas fa-file-pdf" aria-hidden="true"></i> PDF</a>
                  {% endif %}
               </span>
            </div>
            {% endif %}
         </div>
      </div>
   </div>
   {% endfor %}
</div>
<script>
(function() {
  var items = document.querySelectorAll('.news-item');
  Array.prototype.forEach.call(items, function(item) {
    var details = item.querySelector('.news-details');
    if (details) { details.style.display = 'none'; }

    var isMouseDown = false;
    var downX = 0, downY = 0;
    item.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return; // left click only
      isMouseDown = true;
      downX = e.clientX; downY = e.clientY;
    });
    item.addEventListener('mouseup', function(e) {
      if (!isMouseDown) return;
      isMouseDown = false;
      if (e.target.closest('a')) return; // ignore link clicks
      if (window.getSelection && window.getSelection().toString().length > 0) return; // ignore text selection
      var dx = Math.abs(e.clientX - downX);
      var dy = Math.abs(e.clientY - downY);
      if (dx > 3 || dy > 3) return; // ignore drag

      var isExpanded = item.classList.contains('expanded');
      if (isExpanded) {
        item.classList.remove('expanded');
        if (details) { details.style.display = 'none'; }
      } else {
        if (details) { details.style.display = 'block'; }
        requestAnimationFrame(function() {
          item.classList.add('expanded');
        });
      }
    });
  });
})();
</script>
<hr class="l-middle home-hr">
<h2 class="feature-title">Featured <a href="/cv/#publications">Research Publications</a></h2>
<p class="feature-text">
   Latest research for fans of Machine Learning and Human-Computer Interaction.
</p>
<div class="cover-wrapper cover-wrapper-3-col l-page">
   {% assign sortedPublications = site.categories.papers | sort: 'path'| reverse %}
   {% for feature in sortedPublications %}
   {% if feature.featured == true %}
   {% include feature.html feature=feature %}
   {% endif %}
   {% endfor %}
</div>
<br>
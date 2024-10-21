---
layout: page
title: Projects
permalink: projects/
---

Things I do, including research, academic course projects, and miscellaneous interests.


## Research

Research publications for fans of Machine Learning and Human-Computer Interaction.

<div class="project-spacer-small"></div>

<div class="l-page project-grid">
    {% for project in site.categories.papers %}
    {% include project.html project=project %}
    {% endfor %}
</div>

<div class="project-spacer"></div>


## Master Thesis

[Financial Time Series Summarization][finsum] <small style="color: #c0c0c0">2021</small>

<div class="project-spacer-small"></div>


## Other

<ul>
<li><a href="https://github.com/tommasocalo/tommasocalo.github.io"><code>tommasocalo.me</code> on Github</a></li>
</ul>

[finsum]: {{ site.url }}/projects/finsum "Generating Comparative Explanations of Financial Time Series"


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

[3D Printing the Trefoil Knot and its Pages][trefoil] <small style="color: #c0c0c0">2015</small>

<div class="project-spacer-small"></div>

## Course Projects

<ul>
    <li><a href="{{ site.url }}/projects/03QWZBH-health-pollution">Health Easel</a> <small style="color: #c0c0c0">2017</small></li>
</ul>

<div class="project-spacer-small"></div>

## Other

<ul>
<li><a href="https://github.com/tommasocalo/tommasocalo.github.io"><code>tommasocalo.me</code> on Github</a></li>
</ul>

[trefoil]: {{ site.url }}/projects/3d-printing-the-trefoil-knot-and-its-pages "3D Printing the Trefoil Knot and its Pages"


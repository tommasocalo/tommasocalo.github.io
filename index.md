---
layout: home
title: Home
---

<div id="intro-wrapper" class="l-text">
	<div id="intro-title-wrapper">
		<div id="intro-image-wrapper">
			<img id="intro-image" src="/images/portrait.jpeg"></div>
		<div id="intro-title-text-wrapper">
			<h1 id="intro-title">Hi, I'm Tommaso</h1>
			<div id="intro-subtitle">I'm a PhD Candidate at Politecnico Di Torino</div>
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
		<a href="{{ site.url }}/cv"><div><i class="fa fa-portrait icon icon-right-space"></i>CV</div></a>
		<a href="{{ site.url }}/projects"><div><i class="fa fa-shapes icon icon-right-space"></i>Projects</div></a>
		<a href="{{ site.url }}/everything-else"><div><i class="fa fa-list-ul icon icon-right-space"></i>Everything Else</div></a>
	</div>
<div>I develop human-centered applications that leverage AI to address user needs. My current research focus on enhancing <b>UI design and development</b> drawing on principles from human-computer interaction, particularly in the areas of human-centered AI and end-user development.




	<div style="height: 1rem"></div>
<div>
    I am currently in the third year of my Ph.D. at <img class="intro-logo" style="width: 24px;" src="/images/polito.jpeg"> <a href="https://www.polito.it/"> Politecnico di Torino</a>, working in the <a href="https://elite.polito.it/">e-Lite research group</a> under the supervision of <a href="https://www.polito.it/personale?p=luigi.derussis">Luigi De Russis</a>. During the last semester I visited the <a href="https://tail.cc.gatech.edu/">Teachable AI Lab</a> at the <a href="https://www.gatech.edu/"> <img class="intro-logo" style="width: 24px;" src="/images/gatech.svg"> Georgia Institute of Technology</a>, under the supervision of <a href="https://chrismaclellan.com/">Christopher MacLellan</a>.
</div>
	<div style="height: 1rem"></div>
</div>

<hr class="l-middle home-hr">

<h2 class="feature-title">Featured <a href="/cv/#publications">Research Publications</a></h2>

<p class="feature-text">
	Latest research for fans of Machine Learning and Human-Computer Interaction.
</p>

<div class="cover-wrapper cover-wrapper-3-col l-page">
	{% assign sortedPublications = site.categories.papers | sort: 'feature-order' %}
	{% for feature in sortedPublications %}
		{% if feature.featured == true %}
			{% include feature.html feature=feature %}
		{% endif %}
	{% endfor %}
</div>

<br>




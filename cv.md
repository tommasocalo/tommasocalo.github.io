---
layout: cv
title: CV
permalink: cv/
jsarr:
- js/scripts.js
---

<h1 id="cv-title"><a href="{{ site.url }}">Tommaso Calò</a></h1>

<p id="cv-subtitle"><i>Postdoctoral Researcher — <span class="cv-vis">HCI</span> + <span class="cv-ai">AI</span></i></p>

<div>
My research bridges <b>Human–Computer Interaction</b> and <b>Artificial Intelligence</b> to make the creation of interactive systems accessible to everyone. I work on <b>end-user development</b> and the <b>generation of user interfaces</b>, building authoring environments — sketch-to-code systems, visual programming tools, multimodal design tools, and AI-powered educational interfaces — that let people specify, inspect, and refine software without having to write it. My current focus is on <b>generative user interfaces</b>: how designers actually work with them, and how to make what these systems produce observable, accountable, and controllable.
</div>

<div class="cv-spacer"></div>

<div class="cv-image-links-wrapper">
	<div class="cv-image-links">
		{% for link in site.data.social-links %}
			{% if link.cv-group == 1 %}
				{% include cv-social-link.html link=link %}
			{% endif %}
		{% endfor %}
	</div>
	<div class="cv-image-links">
		{% for link in site.data.social-links %}
			{% if link.cv-group == 2 %}
				{% include cv-social-link.html link=link %}
			{% endif %}
		{% endfor %}
	</div>
</div>

***

## Education

{::nomarkdown}
{% for degree in site.data.education %}
{% include cv/degree.html degree=degree %}
{% endfor %}
{:/}

## Employment & Research Affiliations

{::nomarkdown}
{% for experience in site.data.employment %}
{% include cv/experience.html experience=experience %}
{% endfor %}
{:/}

## Selected Research Projects

{::nomarkdown}
{% for project in site.data.projects %}
{% include cv/project.html project=project %}
{% endfor %}
{:/}

## Honors, Awards & Funding

{% for award in site.data.awards %}
{% include cv/award.html award=award %}
{% endfor %}

## Publications

### Selected: Latest & Greatest

{% assign selectedBoolForBibtex = true %}

{% assign selected = site.categories.papers | where: 'selected', true %}
{% for pub in selected %}
{% include cv/publication.html pub=pub %}
{% endfor %}

{% assign selectedBoolForBibtex = false %}

### Journal

{% assign journal = site.categories.papers | where: 'type', "journal" %}
{% for pub in journal %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Conference

{% assign conference = site.categories.papers | where: 'type', "conference" %}
{% for pub in conference %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Extended Abstract

{% assign extended-abstract = site.categories.papers | where: 'type', "extended-abstract" %}
{% for pub in extended-abstract %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Workshop

{% assign workshop = site.categories.papers | where: 'type', "workshop" %}
{% for pub in workshop %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Doctoral Dissertation

<div><a href="{{ site.url }}/phd-thesis.pdf"><b>From Human Representations to AI Realization: Algorithms and Tools for Creating and Refining Interactive Systems</b></a></div>
<div class="cv-description cv-authors">Tommaso Calò</div>
<div class="cv-description"><i>Ph.D. Dissertation, Politecnico di Torino. Turin, Italy, 2025.</i></div>
<div class="pub-misc"><a href="{{ site.url }}/phd-thesis.pdf"><i class="fas fa-file-pdf" aria-hidden="true"></i> PDF</a></div>

<div class="cv-spacer-large"></div>

## Invited Talks

{::nomarkdown}
{% for talk in site.data.talks %}
{% include cv/talk.html talk=talk %}
{% endfor %}
{:/}

## Teaching

{% for teach in site.data.teaching %}
{% include cv/teaching.html teach=teach %}
{% endfor %}

## Supervision & Mentoring

{::nomarkdown}
{% for mentee in site.data.mentoring %}
{% include cv/mentee.html mentee=mentee %}
{% endfor %}
{:/}

## Service

<div class="cv-service-title"><b>Editorial & Judging Roles</b></div>
{% for venue in site.data.committees %}
{% include cv/venue.html venue=venue %}
{% endfor %}

<div class="cv-service-title"><b>Organizer</b></div>
{% for venue in site.data.organizer %}
{% include cv/venue.html venue=venue %}
{% endfor %}

<div class="cv-service-title"><b>Reviewer</b></div>
{% for venue in site.data.reviewer %}
{% include cv/venue.html venue=venue %}
{% endfor %}

<div class="cv-service-title"><b>Member</b></div>
{% for member in site.data.memberships %}
{% include cv/member.html member=member %}
{% endfor %}

## Certifications & Languages

**TOEFL iBT**: 98/120 (C1 Level)  
**Italian**: Native  
**English**: Fluent (C1)

## References

{% for reference in site.data.references %}
{% include cv/reference.html reference=reference %}
{% endfor %}

[cv]: {{ site.url }}/cv.pdf "My CV."

---
layout: cv
title: CV
permalink: cv/
jsarr:
- js/scripts.js
---

<h1 id="cv-title"><a href="{{ site.url }}">Tommaso Calò</a></h1>

<p id="cv-subtitle"><i>Research Scientist (<span class="cv-vis">HCI</span> + <span class="cv-ai">AI</span>)</i></p>

<!-- <div id="cv-toc">
<ul class="cv-description">
	<li>Education</li>
	<li>Industry Research</li>
	<li>Academic Research</li>
	<li>Honors and Awards</li>
	<li>Publications</li>
	<li>Talks</li>
	<li>Press</li>
	<li>Teaching</li>
	<li>Mentoring</li>
	<li>Grants and Funding</li>
	<li>Interactive Articles</li>
	<li>Service</li>
	<li>Design</li>
	<li>References</li>
</ul>
</div> -->

<div>
I create <b><span class="cv-vis">interactive systems</span></b> to empower people with <b><span class="cv-ai">AI</span></b>. My goal is to enhance <b>creativity </b>and<b> productivity</b> in <b>UI Design and Software Development</b>. In my projects, I use methods from <b>Human-Centered Design</b>, <b>Deep Learning</b> and <b>Software Engineering</b>. 
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

## Honors and Awards

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

<!-- ### All Publications -->

{% assign selectedBoolForBibtex = false %}

### Tech Report

{% assign tech-report = site.categories.papers | where: 'type', "tech-report" %}
{% for pub in tech-report %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

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

### Preprint

{% assign preprint = site.categories.papers | where: 'type', "preprint" %}
{% for pub in preprint %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Workshop

{% assign workshop = site.categories.papers | where: 'type', "workshop" %}
{% for pub in workshop %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Poster

{% assign poster = site.categories.papers | where: 'type', "poster" %}
{% for pub in poster %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Demo

{% assign demo = site.categories.papers | where: 'type', "demo" %}
{% for pub in demo %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Miscellaneous

{% assign preprint = site.categories.papers | where: 'type', "misc" %}
{% for pub in preprint %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

## Teaching

{% for teach in site.data.teaching %}
{% include cv/teaching.html teach=teach %}
{% endfor %}

## Mentoring

{::nomarkdown}
{% for mentee in site.data.mentoring %}
{% include cv/mentee.html mentee=mentee %}
{% endfor %}
{:/}



<!-- ## Technology Skills

{% for skill in site.data.skills %}
{% include cv/skill.html skill=skill %}
{% endfor %} -->

## Service

<div class="cv-service-title"><b>Organizer</b></div>
{% for venue in site.data.organizer %}
{% include cv/venue.html venue=venue %}
{% endfor %}

<div class="cv-service-title"><b>Program Commitee</b></div>
{% for venue in site.data.pc %}
{% include cv/venue.html venue=venue %}
{% endfor %}

<div class="cv-service-title"><b>Reviewer</b></div>
{% for venue in site.data.reviewer %}
{% include cv/venue.html venue=venue %}
{% endfor %}

<div class="cv-service-title"><b>Institutional</b></div>
{% for institution in site.data.institutional %}
{% include cv/institutional.html institution=institution %}
{% endfor %}

<div class="cv-service-title"><b>Member</b></div>
{% for member in site.data.memberships %}
{% include cv/member.html member=member %}
{% endfor %}

## References

{% for reference in site.data.references %}
{% include cv/reference.html reference=reference %}
{% endfor %}

<!-- 
## Contact

Fred Hohman  
`fredhohman@gatech.edu`  
CODA Tech Square  
Georgia Tech  
756 W Peachtree St NW  
Atlanta, GA 30308
<span style="background: linear-gradient(0deg, #34495e, #3498db); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block">
—  
USA  
Earth  
Solar System  
Milky Way  
Local Group  
Universe  
</span> -->


[cv]: {{ site.url }}/cv.pdf "My CV."

[poloclub]: http://poloclub.gatech.edu "Polo Club of Data Science"
[gt]: http://gatech.edu "Georgia Tech"
[cse]: http://cse.gatech.edu "GT Computational Science and Engineering"
[coc]: http://www.cc.gatech.edu "GT College of Computing"

[fred]: http://fredhohman.com "Fred Hohman"
[polo]: http://www.cc.gatech.edu/~dchau/ "Polo Chau"
[alex]: http://va.gatech.edu/endert/ "Alex Endert"

[jpl]: https://www.jpl.nasa.gov/ "NASA Jet Propulsion Lab"
[hi]: https://www.hi.jpl.nasa.gov/ "Human Interfaces Group at NASA JPL"
[pnnl]: https://www.pnnl.gov/ "Pacific Northwest National Laboratory"
[dsa]: http://www.pnnl.gov/nationalsecurity/technical/capabilities/computing/data_sciences.stm "Data Sciences and Analytics Group at PNNL"
[msr]: https://www.microsoft.com/en-us/research/ "Microsoft Research"
[msr-hci]: https://www.microsoft.com/en-us/research/group/human-computer-interaction/ "HCI@MSR"

[twitter]: https:/www.twitter.com/fredhohman "@fredhohman"
[github]: https:/www.github.com/fredhohman "github.com/fredhohman"
[nstrf]: https://www.nasa.gov/strg/nstrf "NASA Space Technology Research Fellowship"
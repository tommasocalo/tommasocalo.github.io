---
layout: paper
categories: papers
permalink: papers/web2figma
id: web2figma
title: "Bridging Web and Figma: Automating Large-Scale UI Dataset Generation for AI-Enhanced Design"
authors: 
  - Francesca Russo
  - Tommaso Calò
  - Luigi De Russis
venue: ACM SIGCHI Symposium on Engineering Interactive Computing Systems (Companion)
venue-shorthand: EICS Companion
location: Trier, Germany
year: 2025
url: /papers/web2figma
pdf: /papers/25-web2figma-eics.pdf
doi: 10.1145/3731406.3734974
type: conference
figure: /images/papers/25-web2figma-eics.png
selected: false
feature-title: From Web to Figma
feature-description: A pipeline to convert HTML into structured, Figma-compatible datasets for AI-driven UI design.
image: /images/papers/25-web2figma-eics.png
featured: true
feature-order: 5
award: Best Late Breaking Result Award
bibtex: |-

  @inproceedings{russo2025web2figma,
  author    = {Francesca Russo and Tommaso Calò and Luigi De Russis},
  title     = {Bridging Web and Figma: Automating Large-Scale UI Dataset Generation for AI-Enhanced Design},
  booktitle = {Companion Proceedings of the 17th ACM SIGCHI Symposium on Engineering Interactive Computing Systems (EICS Companion '25)},
  year      = {2025},
  pages     = {13--20},
  doi       = {10.1145/3731406.3734974},
  url       = {https://doi.org/10.1145/3731406.3734974}
  } 


---
Large-scale User Interface (UI) data is essential for developing Artificial Intelligence (AI)-driven tools that can support designers in creating interfaces. However, many publicly available datasets are either manually annotated, a time-consuming and costly process that limits their scale or lack crucial structural information, such as semantic labels and hierarchical relationships, necessary for effective design assistance. Moreover, no existing dataset offers a standard format designed for seamless integration of AI models into real-world design tools. In this work, we introduce a pipeline that automatically converts any HTML content into structured, Figma-compatible representations. To validate our pipeline, we apply it to WebUI, a large-scale HTML-based dataset, and conduct a comparative evaluation by training five state-of-the-art layout generation models on our data and the manually annotated Rico dataset. Experimental results demonstrate that the models achieve comparable performance across both datasets and suggest that our pipeline can effectively produce high-quality data suitable for training AI models integrable into design workflows.
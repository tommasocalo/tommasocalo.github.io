---
layout: paper
categories: papers
permalink: papers/design2code
id: design2code
title: "Advancing Code Generation from Visual Designs through Transformer-Based Architectures and Specialized Datasets"
authors: 
  - Tommaso Calò
  - Luigi De Russis
venue: Proceedings of the ACM on Human-Computer Interaction (PACM HCI)
venue-shorthand: PACM EICS
location: Online + Trier, Germany
year: 2025
url: /papers/design2code
pdf: /papers/25-design2code-pacm.pdf
doi: 10.1145/3734190
type: journal
figure: /images/papers/25-design2code-pacm.png
selected: true
feature-title: Transformer Models for Design-to-Code
feature-description: Exploring multimodal transformers and new datasets to automate code generation from sketches and mockups.
image: /images/papers/25-design2code-pacm.png
featured: true
feature-order: 1
bibtex: |-

  @article{calo2025design2code,
  author    = {Tommaso Calò and Luigi De Russis},
  title     = {Advancing Code Generation from Visual Designs through Transformer-Based Architectures and Specialized Datasets},
  journal   = {Proceedings of the ACM on Human-Computer Interaction (PACM HCI)},
  volume    = {9},
  number    = {4},
  articleno = {EICS013},
  year      = {2025},
  month     = jun,
  pages     = {1--37},
  doi       = {10.1145/3734190},
  url       = {https://doi.org/10.1145/3734190}
  }


---
Manually translating web designs into code is a costly and time-consuming process, particularly due to the frequent iterations and refinements between designers and developers. Deep learning techniques, which possess the capability to automatically translate designs into functional code using an encoder-decoder architecture, have emerged as a promising solution to enhance this tedious process. However, many current methods depend on simplistic datasets that do not capture the diversity of components found in modern websites. Additionally, the potential of transformer-based models, which have enabled significant progress in vision and language modeling tasks due to their scalability and ability to handle cross-modal relationships, has not been investigated in this context. Addressing these limitations, this paper contributes with: 1) a web scraping methodology to automatically collect and process a diverse dataset of real-world websites with reduced noise and complexity, 2) a synthetic dataset of webpage mockups along with their sketched conversions, and 3) an evaluation of two recent multimodal transformer architectures on these proposed datasets. Results on synthetic and sketch-based datasets demonstrate the architectures potential as effective design-to-code automation solutions, while identifying remaining challenges in modeling real-world website complexity.

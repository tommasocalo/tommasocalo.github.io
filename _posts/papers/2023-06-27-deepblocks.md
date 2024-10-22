---
layout: paper
categories: papers
permalink: papers/deepblocks
id: deepblocks
title: "Towards A Visual Programming Tool to Create Deep Learning Models"
authors: 
  - Tommaso Calò
  - Luigi De Russis
venue: ACM SIGCHI Symposium on Engineering Interactive Computing Systems
venue-shorthand: EICS
location: Swansea, United Kingdom
year: 2023
url: /papers/deepblocks
pdf: /papers/23-deepblocks-eics.pdf
doi: 10.1145/3596454.3597181
type: conference
figure: /images/papers/23-deepblocks-eics.jpg
selected: false
feature-title: A Visual Programming Tool to Create Deep Learning Models
feature-description: Allowing developers from diverse backgrounds to visually create, train, and evaluate DL architectures.
image: /images/papers/23-deepblocks-eics.jpg
featured: true
feature-order: 0
bibtex: |-

    @inproceedings{10.1145/3596454.3597181,
    author = {Calò, Tommaso and De Russis, Luigi},
    title = {Towards A Visual Programming Tool to Create Deep Learning Models},
    year = {2023},
    isbn = {9798400702068},
    publisher = {Association for Computing Machinery},
    address = {New York, NY, USA},
    url = {https://doi.org/10.1145/3596454.3597181},
    doi = {10.1145/3596454.3597181},
    abstract = {},
    booktitle = {Companion Proceedings of the 2023 ACM SIGCHI Symposium on Engineering Interactive Computing Systems},
    pages = {38–44},
    numpages = {7},
    keywords = {visual programming, user interface, deep learning, debugging},
    location = {Swansea, United Kingdom},
    series = {EICS '23 Companion}
    }

---

Deep Learning (DL) developers come from different backgrounds, e.g., medicine, genomics, finance, and computer science. To create a DL model, they must learn and use high-level programming languages (e.g., Python), thus needing to handle related setups and solve programming errors. This paper presents DeepBlocks, a visual programming tool that allows DL developers to design, train, and evaluate models without relying on specific programming languages. DeepBlocks works by building on the typical model structure: a sequence of learnable functions whose arrangement defines the specific characteristics of the model. We derived DeepBlocks’ design goals from a 5-participants formative interview, and we validated the first implementation of the tool through a typical use case. Results are promising and show that developers could visually design complex DL architectures.
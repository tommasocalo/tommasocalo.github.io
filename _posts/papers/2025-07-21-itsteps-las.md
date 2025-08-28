---
layout: paper
categories: papers
permalink: papers/itsteps
id: itsteps
title: "Towards Step-Aware ITSs: Generation and Evaluation of Synthetic Step-by-Step Exercise Solutions"
authors: 
  - Francesca Russo
  - Tommaso Calò
  - Luigi De Russis
venue: ACM Conference on Learning at Scale
venue-shorthand: L@S
location: Palermo, Italy
year: 2025
url: /papers/itsteps
pdf: /papers/25-itsteps-las.pdf
doi: 10.1145/3698205.3733940
type: conference
figure: /images/papers/25-itsteps-las.png
selected: false
feature-title: Step-Aware Intelligent Tutoring Systems
feature-description: Using LLMs to generate step-level guidance for math ITSs and improving adaptive personalization.
image: /images/papers/25-itsteps-las.png
featured: true
feature-order: 2
bibtex: |-

  @inproceedings{russo2025itsteps,
  author    = {Francesca Russo and Tommaso Calò and Luigi De Russis},
  title     = {Towards Step-Aware ITSs: Generation and Evaluation of Synthetic Step-by-Step Exercise Solutions},
  booktitle = {Proceedings of the Twelfth ACM Conference on Learning at Scale (L@S '25)},
  year      = {2025},
  location  = {Palermo, Italy},
  pages     = {281--285},
  doi       = {10.1145/3698205.3733940},
  url       = {https://doi.org/10.1145/3698205.3733940}
  }

---
Intelligent Tutoring Systems (ITSs) have shown great potential in enhancing how education is delivered. Many existing ITSs leverage Reinforcement Learning (RL) to optimize the sequence of exercises proposed to the learner. These systems adapt content based on the student's performance on previous exercises, addressing knowledge gaps while advancing through mastered concepts. However, they typically operate at the whole-exercise level, without visibility into the intermediate steps. In reality, learners may fail to solve an exercise because they encounter difficulties with specific sub-steps. Existing ITSs rely on datasets that do not include exercise decomposition in steps. To overcome this limitation, in this paper, we employ GPT-o3-mini to generate synthetic step-by-step solutions for mathematics exercises from the Junyi Academy dataset. To evaluate if these synthetic steps are useful in reaching the final solution, we use three models of varying size from the Llama family to simulate students of different knowledge levels (i.e., low, medium, high) and verify if the step-by-step guidance increases their problem-solving capabilities. By comparing direct answers for exercises to answers that leverage an incremental step guidance strategy, models successfully solve up to 42% more exercises. This evaluation serves as a foundation for creating synthetic step-by-step solutions that can be employed to develop next-generation step-aware ITSs tailored to students' specific knowledge gaps.

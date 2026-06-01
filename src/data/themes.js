export const themes = [
  {
    slug: "multimodal-relations",
    title: "Multimodal Relations",
    image: "/figures/kandinsky.png",
    figures: ["/figures/kandinsky.png", "/figures/cpro.png", "/figures/langlasso.png"],
    text: "Connecting text, networks, time, space, and model output in inspectable visual interfaces.",
    tags: ["multimodal data", "networks", "digital humanities"],
    publications: [
      {
        title: "Deciphering Personal Argument Styles",
        meta: "RATIO 2024",
        link: "https://link.springer.com/chapter/10.1007/978-3-031-63536-6_18"
      },
      {
        title: "Exploration of Preference Models using Visual Analytics",
        meta: "MLVis 2024",
        link: "https://diglib.eg.org/items/992a66bc-a804-47d2-968c-a1f7dc87cb21"
      }
    ],
    resources: [
      { label: "CUEPAQ project", link: "https://scikon.uni-konstanz.de/en/projects?cHash=6871ea77a7be8e4bd18b4136e094e319&tx_scikonportal_pi4%5Baction%5D=profile&tx_scikonportal_pi4%5Bcontroller%5D=Project&tx_scikonportal_pi4%5Bid%5D=3209" }
    ],
    actions: [
      { label: "Project", link: "https://informatics.tuwien.ac.at/orgs/e193-07" }
    ]
  },
  {
    slug: "projections",
    title: "Projection Analysis",
    image: "/figures/cpro.png",
    figures: ["/figures/cpro.png", "/figures/kandinsky.png", "/figures/langlasso.png"],
    text: "Making projections useful: readable structure, distortion awareness, and explanation.",
    tags: ["projections", "distortion", "structure"],
    publications: [
      {
        title: "cPro: Circular Projections Using Gradient Descent",
        meta: "EuroVA 2024",
        link: "https://diglib.eg.org/items/dd5739a1-76da-406f-ab48-65ed16c9db65"
      },
      {
        title: "LangLasso: Interactive Cluster Descriptions through LLM Explanation",
        meta: "VISxGenAI 2025 / CoRR 2026",
        link: "https://arxiv.org/abs/2601.10458"
      }
    ],
    resources: [
      { label: "LangLasso demo", link: "https://langlasso.vercel.app" }
    ],
    actions: [
      { label: "Paper", link: "https://arxiv.org/abs/2601.10458" }
    ]
  },
  {
    slug: "human-ai-interaction",
    title: "Human-AI Interaction",
    image: "/figures/langlasso.png",
    figures: ["/figures/langlasso.png", "/figures/glance.png", "/figures/cpro.png"],
    text: "Interfaces for questioning, steering, and revising AI-generated explanations.",
    tags: ["LLMs", "explanation", "interaction"],
    publications: [
      {
        title: "GLANCE: Strategy-Based Visual Mediation for LLM Interaction",
        meta: "EuroVA 2026",
        link: "https://www.cvast.tuwien.ac.at/bibcite/reference/708"
      },
      {
        title: "LangLasso: Interactive Cluster Descriptions through LLM Explanation",
        meta: "VISxGenAI 2025 / CoRR 2026",
        link: "https://www.cvast.tuwien.ac.at/bibcite/reference/709"
      }
    ],
    resources: [
      { label: "Bilateral AI project", link: "https://www.cvast.tuwien.ac.at/projects/bilai" },
      { label: "LangLasso demo", link: "https://langlasso.vercel.app" }
    ],
    actions: [
      { label: "Project", link: "https://www.cvast.tuwien.ac.at/projects/bilai" },
      { label: "Tool", link: "https://langlasso.vercel.app" },
      { label: "Paper", link: "https://arxiv.org/abs/2601.10458" }
    ]
  },
  {
    slug: "co-active-machine-learning",
    title: "Co-active ML",
    image: "/figures/glance.png",
    figures: ["/figures/glance.png", "/figures/langlasso.png", "/figures/cpro.png"],
    text: "Human and model in the loop: feedback, revision, and analytic steering.",
    tags: ["feedback", "steering", "revision"],
    publications: [
      {
        title: "GLANCE: Strategy-Based Visual Mediation for LLM Interaction",
        meta: "EuroVA 2026",
        link: "https://www.cvast.tuwien.ac.at/bibcite/reference/708"
      },
      {
        title: "Exploration of Preference Models using Visual Analytics",
        meta: "MLVis 2024",
        link: "https://diglib.eg.org/items/992a66bc-a804-47d2-968c-a1f7dc87cb21"
      }
    ],
    resources: [
      { label: "CVAST publication page", link: "https://www.cvast.tuwien.ac.at/bibcite/reference/708" }
    ],
    actions: [
      { label: "Project", link: "https://www.bilateral-ai.net/home" },
      { label: "Paper", link: "https://www.cvast.tuwien.ac.at/bibcite/reference/708" }
    ]
  },
  {
    slug: "geospatial-computing",
    title: "Geospatial Analysis",
    image: "/figures/skivis.png",
    figures: ["/figures/skivis.png", "/figures/cpro.png", "/figures/glance.png"],
    text: "Spatial analysis for routes, movement, regions, and map-based decision making.",
    tags: ["geospatial data", "mobility", "routes"],
    publications: [
      {
        title: "SkiVis: Visual Exploration and Route Planning in Ski Resorts",
        meta: "IEEE TVCG 2024",
        link: "https://arxiv.org/abs/2307.08570"
      },
      {
        title: "SpatialRugs: Enhancing spatial awareness of movement in dense pixel visualizations",
        meta: "EuroVA 2020",
        link: "https://diglib.eg.org/items/a563c489-c994-4be0-b05d-22e9fd1cc9c0"
      }
    ],
    resources: [
      { label: "SkiVis preprint", link: "https://scibib.dbvis.de/uploadedFiles/SkiVis_2023_VIS__preprint.pdf" }
    ],
    actions: [
      { label: "Paper", link: "https://arxiv.org/abs/2307.08570" }
    ]
  },
  {
    slug: "recommender-systems",
    title: "Recommender Systems",
    image: "/figures/cpro.png",
    figures: ["/figures/cpro.png", "/figures/glance.png", "/figures/skivis.png"],
    text: "Visual interfaces for understanding preference models, bias, drift, and user effects.",
    tags: ["bias", "recommendation", "drift"],
    publications: [
      {
        title: "Exploration of Preference Models using Visual Analytics",
        meta: "MLVis 2024",
        link: "https://diglib.eg.org/items/992a66bc-a804-47d2-968c-a1f7dc87cb21"
      },
      {
        title: "SkiVis: Visual Exploration and Route Planning in Ski Resorts",
        meta: "IEEE TVCG 2024",
        link: "https://arxiv.org/abs/2307.08570"
      }
    ],
    resources: [
      { label: "Elisabeth Lex", link: "https://elisabethlex.info/" },
      { label: "Markus Schedl", link: "https://www.mschedl.eu/" }
    ],
    actions: [
      { label: "Paper", link: "https://diglib.eg.org/items/992a66bc-a804-47d2-968c-a1f7dc87cb21" },
      { label: "Context", link: "https://elisabethlex.info/" }
    ]
  }
];

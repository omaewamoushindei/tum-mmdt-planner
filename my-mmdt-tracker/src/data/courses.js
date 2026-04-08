// src/data/courses.js

export const initialCourses = [
  // ==========================================
  // ÖZEL KREDİLİ VE ÇOKLU KATEGORİLİ DERSLER
  // ==========================================
  { id: "EX01", name: "Business Process Management", credits: 5, categories: ["digitalTechnology"] },
  { id: "EX02", name: "Process Mining Project", credits: 3, categories: ["digitalTechnology"] },
  { id: "EX03", name: "Advanced International Study Trip: Family & non-family firms...", credits: 9, categories: ["managementElectives"] },
  { id: "EX04", name: "Advanced International Excursion: Global Strategy", credits: 9, categories: ["managementSpecialization", "managementElectives"] },
  { id: "EX05", name: "Advanced Project Studies", credits: 12, categories: ["managementElectives"] },
  { id: "EX06", name: "Customer Relationship Management for Long-Term Profitability", credits: 6, categories: ["methods", "managementElectives"] },
  { id: "EX07", name: "Empirical Consumer Research for Marketing Decisions", credits: 6, categories: ["methods", "managementElectives"] },
  { id: "EX08", name: "Advanced Seminar Management & Marketing: Virtual Reality Applications...", credits: 6, categories: ["digitalTechnology", "managementElectives"], isSeminar: true },
  { id: "EX09", name: "Advanced Seminar Operations & Technology: Immersive Technologies...", credits: 6, categories: ["digitalTechnology", "managementSpecialization"], isSeminar: true },
  // ==========================================
  // METOTLAR (METHODS) - Sadece Metot Sayılanlar
  // ==========================================
  { id: "M01", name: "Advanced Multivariate Analysis", credits: 6, categories: ["methods"] },
  { id: "M02", name: "Advanced Seminar Management & Marketing: Language Analytics and LLMs...", credits: 6, categories: ["methods"], isSeminar: true },
  { id: "M03", name: "Advanced Seminar Operations & Technology: Quantum Computing", credits: 6, categories: ["methods"], isSeminar: true },
  { id: "M04", name: "Applied Case Study Methodology", credits: 6, categories: ["methods"] },
  { id: "M05", name: "Applied Regression Analysis", credits: 6, categories: ["methods"] },
  { id: "M06", name: "Deep Learning and Decision Making", credits: 6, categories: ["methods"] },
  { id: "M07", name: "Game Theory", credits: 6, categories: ["methods"] },
  { id: "M08", name: "Intelligent Scheduling: Algorithms, Complexity, and AI in Operations", credits: 6, categories: ["methods"] },
  { id: "M09", name: "Marketing Analytics", credits: 6, categories: ["methods"] },
  { id: "M10", name: "Marketing Research", credits: 6, categories: ["methods"] },
  { id: "M11", name: "Meta-Analysis in Management Research: Techniques and Applications", credits: 6, categories: ["methods"] },
  { id: "M12", name: "Research Methods in Business Psychology", credits: 6, categories: ["methods"] },
  { id: "M13", name: "Simulation in Production and Logistics", credits: 6, categories: ["methods"] },
  { id: "M14", name: "Stochastic Models in Production and Logistics", credits: 6, categories: ["methods"] },

  // ==========================================
  // DİJİTAL TEKNOLOJİ (DIGITAL TECHNOLOGY)
  // ==========================================
  { id: "D01", name: "Advanced Analytics in Operations Management", credits: 6, categories: ["digitalTechnology"] },
  { id: "D02", name: "Advanced Seminar Management & Marketing: Eyetracking and Decision Making", credits: 6, categories: ["digitalTechnology"], isSeminar: true },
  { id: "D03", name: "Advanced Seminar Operations & Technology Management: Business Analytics...", credits: 6, categories: ["digitalTechnology"], isSeminar: true },
  { id: "D04", name: "Advanced Seminar Operations & Technology Management: Real-World Apps...", credits: 6, categories: ["digitalTechnology"], isSeminar: true },
  { id: "D05", name: "Advanced Seminar Operations & Technology: Machine Learning", credits: 6, categories: ["digitalTechnology"], isSeminar: true },
  { id: "D06", name: "Advanced Software Testing and Analysis", credits: 6, categories: ["digitalTechnology"] },
  { id: "D07", name: "Business Analytics with Python and R", credits: 6, categories: ["digitalTechnology"] },
  { id: "D08", name: "Computer Networking and IT Security", credits: 6, categories: ["digitalTechnology"] },
  { id: "D09", name: "Data Science in Business and Economics with R", credits: 6, categories: ["digitalTechnology"] },
  { id: "D10", name: "Deep Reinforcement Learning", credits: 6, categories: ["digitalTechnology"] },
  { id: "D11", name: "Economics and Management of Platforms", credits: 6, categories: ["digitalTechnology"] },
  { id: "D12", name: "Enterprise Architecture Management and Reference Models", credits: 6, categories: ["digitalTechnology"] },
  { id: "D13", name: "Foundations and Application of Generative AI", credits: 6, categories: ["digitalTechnology"] },
  { id: "D14", name: "Intelligent Scheduling", credits: 6, categories: ["digitalTechnology"] },
  { id: "D15", name: "Master Seminar Information Engineering", credits: 6, categories: ["digitalTechnology"] },
  { id: "D16", name: "Methods and Databases in Empirical Finance", credits: 6, categories: ["digitalTechnology"] },
  { id: "D17", name: "Practical Course: Advanced Topics in Constraint Programming...", credits: 6, categories: ["digitalTechnology"] },
  { id: "D18", name: "Process Mining", credits: 6, categories: ["digitalTechnology"] },
  { id: "D19", name: "Python and Advanced Data Science", credits: 6, categories: ["digitalTechnology"] },

  // ==========================================
  // MANAGEMENT SPECIALIZATION / ELECTIVES (ÇİFT SAYILABİLENLER)
  // ==========================================
  { id: "S01", name: "Advanced Seminar Finance & Accounting: Current research Topics in Digital Finance", credits: 6, categories: ["managementSpecialization", "managementElectives"], isSeminar: true },
  { id: "S02", name: "Advanced Seminar Innovation & Entrepreneurship: Digital Innovation", credits: 6, categories: ["managementSpecialization", "managementElectives"], isSeminar: true },
  { id: "S03", name: "Advanced Seminar Operations & Supply Chain Management: Digital Operations", credits: 6, categories: ["managementSpecialization", "managementElectives"], isSeminar: true },
  { id: "S04", name: "Advanced Seminar Operations & Technology: Analytics in Manufacturing...", credits: 6, categories: ["managementSpecialization", "managementElectives"], isSeminar: true },
  { id: "S05", name: "Advanced Seminar: Digital Technologies in Operations Management", credits: 6, categories: ["managementSpecialization", "managementElectives"], isSeminar: true },
  { id: "S06", name: "Business Forecasting", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S07", name: "Campus Challenge: Successful Investing with AI and Large Language Models", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S08", name: "Cases in industry 4.0", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S09", name: "CEO Strategy Series", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S10", name: "Contemporary Strategies in the Automotive Industry", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S11", name: "Digital Finance", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S12", name: "How to launch a platform start-up", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S13", name: "Inventory Management", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S14", name: "Masterclass in Fashion Management", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S15", name: "Social Media Marketing", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S16", name: "Sustainable Management - Bridging Economy and Ecology through Technology", credits: 6, categories: ["managementSpecialization", "managementElectives"] },

  // ==========================================
  // SADECE MANAGEMENT ELECTIVES
  // ==========================================
  { id: "E01", name: "Advanced Seminar Economics & Policy: Business-to-Business Contract Negotiations", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E02", name: "Advanced Seminar Economics & Policy: Management practices in (family) enterprises", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E03", name: "Advanced Seminar Economics & Policy: Technological Change, AI...", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E04", name: "Advanced Seminar Innovation & Entrepreneurship: Managing the Family Enterprise", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E05", name: "Advanced Seminar Innovation & Entrepreneurship: Sustainability In Entrepreneurship...", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E06", name: "Advanced Seminar Innovation and Entrepreneurship: Topics in Corporate Entrepreneurship", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E07", name: "Advanced Seminar Management & Marketing: Corporate Social Responsibility", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E08", name: "CEO Leadership Series", credits: 6, categories: ["managementElectives"] },
  { id: "E09", name: "Corporate Campus Challenge", credits: 6, categories: ["managementElectives"] },
  { id: "E10", name: "Managing Legal Sustainability Requirements in Family Enterprises", credits: 6, categories: ["managementElectives"] },
  { id: "E11", name: "Project and Innovation Management: Design thinking methodology", credits: 6, categories: ["managementElectives"] },
  { id: "E12", name: "Start-up law for founders of family enterprises", credits: 6, categories: ["managementElectives"] },
  { id: "E13", name: "Advanced Seminar Economics & Econometrics: Economics of Education", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E14", name: "Advanced Seminar Finance & Accounting: Current Research Topics in Empirical...", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E15", name: "Advanced Seminar Innovation & Entrepreneurship: From Idea to Venture", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E16", name: "Advanced Seminar Management & Marketing: Digital Marketing", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E17", name: "Advanced Seminar Management & Marketing: Strategic Management", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E18", name: "Advanced Seminar Operations & Technology: Research on the Finance and Operations...", credits: 6, categories: ["managementElectives"], isSeminar: true },
  { id: "E19", name: "Advanced Strategic Management: Theory and Practice", credits: 6, categories: ["managementElectives"] },
  { id: "E20", name: "Doing Business in Asia", credits: 6, categories: ["managementElectives"] },
  { id: "E21", name: "Economic Analysis of Contracts, Competition and Companies", credits: 6, categories: ["managementElectives"] },
  { id: "E22", name: "Empirical Research Project in Finance", credits: 6, categories: ["managementElectives"] },
  { id: "E23", name: "Master Thesis Seminar: Strategic Management", credits: 6, categories: ["managementElectives"] },
  { id: "E24", name: "Transformative Impacts of Generative AI in Marketing", credits: 6, categories: ["managementElectives"] }
];
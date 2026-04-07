// src/data/courses.js
export const initialCourses = [
  // Özel Kredili Dersler 
  { id: "C1", name: "Business Process Management", credits: 5, categories: ["digitalTechnology"] },
  { id: "C2", name: "Process Mining Project", credits: 3, categories: ["digitalTechnology"] },
  { id: "C3", name: "Advanced International Study Trip", credits: 9, categories: ["managementElectives"] },
  { id: "C4", name: "Advanced International Excursion", credits: 9, categories: ["managementSpecialization", "managementElectives"] },
  { id: "C5", name: "Advanced Project Studies", credits: 12, categories: ["managementElectives"] },

  // Methods (Metotlar) - 6 ECTS
  { id: "M1", name: "Applied Regression Analysis", credits: 6, categories: ["methods"] },
  { id: "M2", name: "Game Theory", credits: 6, categories: ["methods"] },
  { id: "M3", name: "Marketing Analytics", credits: 6, categories: ["methods"] },
  { id: "M4", name: "Stochastic Models in Production", credits: 6, categories: ["methods"] },

  // Digital Technology - 6 ECTS
  { id: "D1", name: "Deep Reinforcement Learning", credits: 6, categories: ["digitalTechnology"] },
  { id: "D2", name: "Business Analytics with Python and R", credits: 6, categories: ["digitalTechnology"] },
  { id: "D3", name: "Computer Networking and IT Security", credits: 6, categories: ["digitalTechnology"] },
  { id: "D4", name: "Foundations and Application of Generative AI", credits: 6, categories: ["digitalTechnology"] },

  // Management Specialization / Electives - 6 ECTS
  { id: "S1", name: "Digital Finance", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S2", name: "CEO Strategy Series", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S3", name: "Inventory Management", credits: 6, categories: ["managementSpecialization", "managementElectives"] },
  { id: "S4", name: "Social Media Marketing", credits: 6, categories: ["managementSpecialization", "managementElectives"] },

  // Sadece Management Electives - 6 ECTS
  { id: "E1", name: "Start-up law for founders", credits: 6, categories: ["managementElectives"] },
  { id: "E2", name: "Corporate Campus Challenge", credits: 6, categories: ["managementElectives"] }
];
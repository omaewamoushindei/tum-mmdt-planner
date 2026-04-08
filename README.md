# TUM MMDT Semester Planner

An interactive, drag-and-drop semester planning dashboard specifically designed for the **Master in Management and Digital Technology (MMDT)** program at Technical University of Munich (TUM) - Campus Heilbronn.

## 🚀 Overview

Navigating the complex degree requirements of the MMDT program can be challenging. This React-based application replaces static spreadsheets with a dynamic, visual Kanban board. It helps students plan their semesters, track their ECTS credits across different specializations, and instantly verify their eligibility for the Master's Thesis.

## ✨ Key Features

* **Drag-and-Drop Kanban Board:** Effortlessly assign courses from the general pool to specific semesters (1 to 4) and categories.
* **Smart ECTS Tracking:** D3.js powered progress rings dynamically calculate credits for:
  * Methods (12 ECTS)
  * Digital Technology (30 ECTS)
  * Management Specialization (30 ECTS)
  * Management Electives (18 ECTS)
* **Master's Thesis Unlocker:** Real-time validation banner that checks the mandatory TUM requirements (48 Total ECTS, 18 Tech ECTS, 6 Methods ECTS) to unlock thesis registration.
* **Graduation Checklist:** Automated tracking of specific sub-requirements, such as the mandatory "Advanced Seminar".
* **Custom Course Builder:** A built-in modal to manually add new or custom courses to the pool.
* **Persistent Storage:** All planner data is saved securely in the browser's `localStorage`. Your plan is always there when you return, with no database required.

## 🛠️ Tech Stack

* **Frontend:** React (Vite)
* **Styling:** Tailwind CSS / Custom CSS
* **State Management:** React Hooks
* **Data Persistence:** LocalStorage API

## 💻 How to Run Locally

1. Clone the repository:
```bash
git clone [https://github.com/YOUR_USERNAME/tum-mmdt-planner.git](https://github.com/YOUR_USERNAME/tum-mmdt-planner.git)
```
2. Navigate to the directory:
```bash
cd tum-mmdt-planner
```
3. Install dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm run dev
```

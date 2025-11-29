# QuizMaker – Pure HTML, CSS & JavaScript

A simple, frontend-only **Quiz Maker** built with vanilla HTML, CSS, and JavaScript.  
Create quizzes, categorize them, apply timers, and take them with instant feedback – all stored locally using `localStorage`. No backend, no frameworks.

---

## ✨ Features

- 📝 **Create Quizzes**
  - Add a title, description, category, and optional time limit (in minutes)
  - Add multiple questions with **4 options** each
  - Mark one option as the correct answer

- 📂 **Categories**
  - Assign a category when creating a quiz (e.g., General, JavaScript, Science, etc.)
  - Filter quizzes by category on the quiz list page

- ⏱️ **Timer (Per Quiz)**
  - Optional time limit per quiz (in minutes)
  - Countdown shows **time left**
  - Auto-submits the quiz and shows results when time is up

- ✅ **Per-Question Feedback**
  - Instant feedback after choosing an option:
    - Shows **Correct** or **Incorrect**
    - Displays the correct answer for that question

- 📋 **Quiz Listing**
  - View all saved quizzes
  - Search by title
  - Filter by category
  - Delete quizzes

- 📊 **Results Screen**
  - Total score and percentage
  - Question-by-question breakdown
  - Shows user’s answer vs correct answer

- 💾 **Local Storage**
  - All quizzes and attempts are stored in the browser using `localStorage`
  - No server or database needed

- 🎁 **Sample Quizzes Included**
  - A **JavaScript Basics** quiz
  - A **General Knowledge** quiz  
  These are auto-created the first time you open the app (if no quizzes exist yet).

---

## 🧱 Tech Stack

- **HTML5** – structure and layout  
- **CSS3** – styling and responsive design  
- **Vanilla JavaScript (ES6)** – logic, routing, localStorage, and UI interactions  
- **localStorage** – client-side data persistence  

No frameworks, no bundlers, no npm required.

---

## 🚀 Getting Started

### 1. Clone or Download

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

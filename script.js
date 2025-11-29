// Key used in localStorage
const STORAGE_KEY = "quizmaker_quizzes";

// Global state for taking a quiz
let quizzes = [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = []; // store selected option indexes

// Timer state
let timerInterval = null;
let remainingSeconds = null;

// ---------- UTILITIES ----------
function loadQuizzes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    quizzes = [];
    return;
  }
  try {
    quizzes = JSON.parse(raw);
    if (!Array.isArray(quizzes)) quizzes = [];
  } catch (e) {
    console.error("Failed to parse quizzes from localStorage", e);
    quizzes = [];
  }
}

function saveQuizzes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function showSection(id) {
  document.querySelectorAll(".page-section").forEach((sec) => {
    sec.classList.remove("active");
  });
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

// format seconds as mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

// ---------- SAMPLE QUIZZES ----------
function getSampleQuizzes() {
  return [
    {
      id: generateId(),
      title: "JavaScript Basics",
      description: "Test your basic JavaScript knowledge.",
      category: "JavaScript",
      timeLimitSeconds: 120, // 2 minutes
      questions: [
        {
          text: "Which keyword is used to declare a constant in JavaScript?",
          options: ["var", "let", "const", "static"],
          correctIndex: 2,
        },
        {
          text: "What is the output of: typeof [] ?",
          options: ["object", "array", "list", "undefined"],
          correctIndex: 0,
        },
        {
          text: "Which method converts a JSON string into a JavaScript object?",
          options: [
            "JSON.toObject()",
            "JSON.parse()",
            "JSON.stringify()",
            "JSON.objectify()",
          ],
          correctIndex: 1,
        },
      ],
    },
    {
      id: generateId(),
      title: "General Knowledge - Mixed",
      description: "A quick general knowledge quiz.",
      category: "General",
      timeLimitSeconds: 180, // 3 minutes
      questions: [
        {
          text: "Which is the largest planet in our solar system?",
          options: ["Earth", "Jupiter", "Saturn", "Mars"],
          correctIndex: 1,
        },
        {
          text: "Who wrote 'Romeo and Juliet'?",
          options: [
            "William Shakespeare",
            "Charles Dickens",
            "Jane Austen",
            "Mark Twain",
          ],
          correctIndex: 0,
        },
        {
          text: "What is H2O commonly known as?",
          options: ["Salt", "Oxygen", "Water", "Hydrogen"],
          correctIndex: 2,
        },
      ],
    },
  ];
}

function seedSampleQuizzesIfEmpty() {
  loadQuizzes();
  if (quizzes.length === 0) {
    quizzes = getSampleQuizzes();
    saveQuizzes();
  }
}

// ---------- NAVIGATION ----------
document.addEventListener("click", (e) => {
  const targetAttr = e.target.getAttribute("data-target");
  if (targetAttr) {
    e.preventDefault();
    showSection(targetAttr);
    if (targetAttr === "list-section") {
      renderQuizList();
    }
  }
});

// ---------- CREATE QUIZ ----------
const questionsContainer = document.getElementById("questions-container");
const addQuestionBtn = document.getElementById("add-question-btn");
const quizForm = document.getElementById("quiz-form");
const resetFormBtn = document.getElementById("reset-form-btn");

function createQuestionBlock(questionIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "question-block";
  wrapper.dataset.index = questionIndex;

  wrapper.innerHTML = `
    <div class="question-header">
      <span>Question #${questionIndex + 1}</span>
      <button type="button" class="remove-question-btn">Remove</button>
    </div>
    <div class="form-group">
      <label>Question Text</label>
      <input type="text" class="question-text" placeholder="Enter the question" required />
    </div>
    <div class="form-group">
      <span class="correct-label">Options (select the correct answer)</span>
      <div class="option-group">
        ${[0, 1, 2, 3]
          .map(
            (i) => `
          <div class="option-row">
            <input type="radio" name="correct-${questionIndex}" value="${i}" ${
              i === 0 ? "checked" : ""
            } />
            <input type="text" class="option-text" placeholder="Option ${
              i + 1
            }" required />
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  const removeBtn = wrapper.querySelector(".remove-question-btn");
  removeBtn.addEventListener("click", () => {
    wrapper.remove();
    renumberQuestions();
  });

  return wrapper;
}

function renumberQuestions() {
  const blocks = Array.from(document.querySelectorAll(".question-block"));
  blocks.forEach((block, idx) => {
    block.dataset.index = idx;
    block.querySelector(".question-header span").textContent =
      "Question #" + (idx + 1);

    const radios = block.querySelectorAll('input[type="radio"]');
    radios.forEach((radio) => {
      radio.name = `correct-${idx}`;
    });
  });
}

addQuestionBtn.addEventListener("click", () => {
  const index = document.querySelectorAll(".question-block").length;
  const block = createQuestionBlock(index);
  questionsContainer.appendChild(block);
});

resetFormBtn.addEventListener("click", () => {
  questionsContainer.innerHTML = "";
  const block = createQuestionBlock(0);
  questionsContainer.appendChild(block);
});

// Handle quiz submission
quizForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const titleInput = document.getElementById("quiz-title");
  const descInput = document.getElementById("quiz-description");
  const categoryInput = document.getElementById("quiz-category");
  const timeLimitInput = document.getElementById("quiz-time-limit");

  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const category = (categoryInput.value || "General").trim();

  if (!title) {
    alert("Please enter a quiz title.");
    return;
  }

  const questionBlocks = Array.from(document.querySelectorAll(".question-block"));
  if (questionBlocks.length === 0) {
    alert("Please add at least one question.");
    return;
  }

  const questions = [];

  try {
    for (const [qIndex, block] of questionBlocks.entries()) {
      const questionTextInput = block.querySelector(".question-text");
      const questionText = questionTextInput.value.trim();
      if (!questionText) {
        alert(`Please enter text for Question #${qIndex + 1}.`);
        return;
      }

      const optionTextInputs = block.querySelectorAll(".option-text");
      const radios = block.querySelectorAll('input[type="radio"]');

      const options = [];
      let correctIndex = 0;

      optionTextInputs.forEach((optInput, idx) => {
        const value = optInput.value.trim();
        if (!value) {
          alert(`Please fill all options for Question #${qIndex + 1}.`);
          throw new Error("Validation aborted");
        }
        options.push(value);
        if (radios[idx].checked) correctIndex = idx;
      });

      questions.push({
        text: questionText,
        options,
        correctIndex,
      });
    }
  } catch (err) {
    return;
  }

  let timeLimitSeconds = 0;
  const minutes = parseInt(timeLimitInput.value, 10);
  if (!isNaN(minutes) && minutes > 0) {
    timeLimitSeconds = minutes * 60;
  }

  const newQuiz = {
    id: generateId(),
    title,
    description,
    category: category || "General",
    timeLimitSeconds: timeLimitSeconds > 0 ? timeLimitSeconds : null,
    questions,
  };

  quizzes.push(newQuiz);
  saveQuizzes();
  renderQuizList();
  alert("Quiz saved successfully!");

  quizForm.reset();
  questionsContainer.innerHTML = "";
  const firstBlock = createQuestionBlock(0);
  questionsContainer.appendChild(firstBlock);
  showSection("list-section");
});

// ---------- LIST QUIZZES ----------
const quizListDiv = document.getElementById("quiz-list");
const noQuizzesMsg = document.getElementById("no-quizzes-msg");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");

function populateCategoryFilter() {
  const previousValue = categoryFilter.value || "all";

  const categories = new Set();
  quizzes.forEach((q) => {
    const cat = q.category || "General";
    categories.add(cat);
  });

  categoryFilter.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "All categories";
  categoryFilter.appendChild(allOpt);

  Array.from(categories)
    .sort()
    .forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });

  if ([...categoryFilter.options].some((o) => o.value === previousValue)) {
    categoryFilter.value = previousValue;
  } else {
    categoryFilter.value = "all";
  }
}

function renderQuizList() {
  loadQuizzes();
  populateCategoryFilter();

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = quizzes.filter((q) => {
    const matchesTitle = q.title.toLowerCase().includes(searchTerm);
    const cat = q.category || "General";
    const matchesCategory =
      selectedCategory === "all" || cat === selectedCategory;
    return matchesTitle && matchesCategory;
  });

  quizListDiv.innerHTML = "";

  if (filtered.length === 0) {
    noQuizzesMsg.textContent = "No quizzes found. Try creating one!";
    return;
  } else {
    noQuizzesMsg.textContent = "";
  }

  filtered.forEach((quiz) => {
    const card = document.createElement("div");
    card.className = "quiz-card";

    const left = document.createElement("div");
    const cat = quiz.category || "General";
    const timeText = quiz.timeLimitSeconds
      ? ` • Timer: ${Math.round(quiz.timeLimitSeconds / 60)} min`
      : "";
    left.innerHTML = `
      <div class="quiz-card-title">${quiz.title}</div>
      <div class="quiz-card-meta">
        <span class="quiz-card-category">${cat}</span> • ${
      quiz.questions.length
    } question(s)${timeText}
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "quiz-card-actions";

    const takeBtn = document.createElement("button");
    takeBtn.className = "primary";
    takeBtn.textContent = "Take Quiz";
    takeBtn.addEventListener("click", () => {
      startQuiz(quiz.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "secondary";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this quiz?")) {
        quizzes = quizzes.filter((q) => q.id !== quiz.id);
        saveQuizzes();
        renderQuizList();
      }
    });

    actions.appendChild(takeBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(left);
    card.appendChild(actions);
    quizListDiv.appendChild(card);
  });
}

searchInput.addEventListener("input", renderQuizList);
categoryFilter.addEventListener("change", renderQuizList);

// ---------- TAKE QUIZ ----------
const takeQuizTitle = document.getElementById("take-quiz-title");
const takeQuizDescription = document.getElementById("take-quiz-description");
const questionTextElem = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const questionProgress = document.getElementById("question-progress");
const timerDisplay = document.getElementById("timer-display");
const questionFeedback = document.getElementById("question-feedback");

const prevBtn = document.getElementById("prev-question-btn");
const nextBtn = document.getElementById("next-question-btn");
const finishBtn = document.getElementById("finish-quiz-btn");
const backToListBtn = document.getElementById("back-to-list");

backToListBtn.addEventListener("click", () => {
  stopTimer();
  showSection("list-section");
});

prevBtn.addEventListener("click", () => {
  if (!currentQuiz) return;
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderCurrentQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (!currentQuiz) return;
  if (currentQuestionIndex < currentQuiz.questions.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  }
});

finishBtn.addEventListener("click", () => {
  if (!currentQuiz) return;
  if (
    !confirm(
      "Are you sure you want to finish the quiz and see your results?"
    )
  ) {
    return;
  }
  stopTimer();
  showResults();
});

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer(limitSeconds) {
  stopTimer();
  if (!limitSeconds || limitSeconds <= 0) {
    remainingSeconds = null;
    timerDisplay.textContent = "";
    return;
  }
  remainingSeconds = limitSeconds;
  timerDisplay.textContent = "Time left: " + formatTime(remainingSeconds);

  timerInterval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      timerDisplay.textContent = "Time left: 00:00";
      stopTimer();
      alert("Time is up! Showing your results.");
      showResults();
      return;
    }
    timerDisplay.textContent = "Time left: " + formatTime(remainingSeconds);
  }, 1000);
}

function startQuiz(quizId) {
  const quiz = quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    alert("Quiz not found.");
    return;
  }
  currentQuiz = quiz;
  currentQuestionIndex = 0;
  userAnswers = new Array(quiz.questions.length).fill(null);

  takeQuizTitle.textContent = quiz.title;
  takeQuizDescription.textContent = quiz.description || "";
  showSection("take-section");
  renderCurrentQuestion();
  startTimer(quiz.timeLimitSeconds || null);
}

function showQuestionFeedback(question, selectedIdx) {
  questionFeedback.textContent = "";
  questionFeedback.className = "feedback";

  if (selectedIdx == null) return;

  if (selectedIdx === question.correctIndex) {
    questionFeedback.textContent = "Correct!";
    questionFeedback.classList.add("feedback-correct");
  } else {
    questionFeedback.textContent =
      "Incorrect. Correct answer: " + question.options[question.correctIndex];
    questionFeedback.classList.add("feedback-incorrect");
  }
}

function renderCurrentQuestion() {
  const question = currentQuiz.questions[currentQuestionIndex];
  questionTextElem.textContent = question.text;
  questionProgress.textContent = `Question ${
    currentQuestionIndex + 1
  } of ${currentQuiz.questions.length}`;

  optionsContainer.innerHTML = "";
  questionFeedback.textContent = "";
  questionFeedback.className = "feedback";

  question.options.forEach((opt, idx) => {
    const label = document.createElement("label");
    label.className = "option-pill";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = idx;

    if (userAnswers[currentQuestionIndex] === idx) {
      input.checked = true;
    }

    input.addEventListener("change", () => {
      userAnswers[currentQuestionIndex] = idx;
      showQuestionFeedback(question, idx);
    });

    label.appendChild(input);
    label.append(" " + opt);
    optionsContainer.appendChild(label);
  });

  if (userAnswers[currentQuestionIndex] != null) {
    showQuestionFeedback(question, userAnswers[currentQuestionIndex]);
  }

  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled =
    currentQuestionIndex === currentQuiz.questions.length - 1;
}

// ---------- RESULTS ----------
const resultsSection = document.getElementById("results-section");
const scoreText = document.getElementById("score-text");
const resultsDetails = document.getElementById("results-details");
const backToQuizzesBtn = document.getElementById("back-to-quizzes-btn");

backToQuizzesBtn.addEventListener("click", () => {
  showSection("list-section");
});

function showResults() {
  const total = currentQuiz.questions.length;
  let correctCount = 0;

  resultsDetails.innerHTML = "";

  currentQuiz.questions.forEach((q, idx) => {
    const userAnswer = userAnswers[idx];
    const isCorrect = userAnswer === q.correctIndex;
    if (isCorrect) correctCount++;

    const block = document.createElement("div");
    block.className =
      "result-question " + (isCorrect ? "correct" : "incorrect");

    const questionTitle = document.createElement("h4");
    questionTitle.textContent = `Q${idx + 1}. ${q.text}`;
    block.appendChild(questionTitle);

    const userAnsP = document.createElement("p");
    userAnsP.className = "result-answer";
    const userLabel = document.createElement("span");
    userLabel.className = "label";
    userLabel.textContent = "Your answer: ";
    userAnsP.appendChild(userLabel);
    userAnsP.append(
      userAnswer != null ? q.options[userAnswer] : "No answer selected"
    );

    const correctAnsP = document.createElement("p");
    correctAnsP.className = "result-answer";
    const correctLabel = document.createElement("span");
    correctLabel.className = "label";
    correctLabel.textContent = "Correct answer: ";
    correctAnsP.appendChild(correctLabel);
    correctAnsP.append(q.options[q.correctIndex]);

    block.appendChild(userAnsP);
    block.appendChild(correctAnsP);
    resultsDetails.appendChild(block);
  });

  scoreText.textContent = `You scored ${correctCount} out of ${total} (${(
    (correctCount / total) *
    100
  ).toFixed(0)}%).`;

  showSection("results-section");
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  seedSampleQuizzesIfEmpty();
  renderQuizList();

  if (document.querySelectorAll(".question-block").length === 0) {
    const block = createQuestionBlock(0);
    questionsContainer.appendChild(block);
  }
});

// DOM Elements
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const voiceButton = document.getElementById('voiceButton');
const responseDisplay = document.getElementById('responseDisplay');
const tasksList = document.getElementById('tasks');
const timeDisplay = document.getElementById('time');
const dateDisplay = document.getElementById('date');

// Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';

// Voice Interaction
voiceButton.addEventListener('click', () => {
  recognition.start();
  voiceButton.textContent = '🔴 Listening...';
});

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  userInput.value = transcript;
  processQuery(transcript);
};

recognition.onend = () => {
  voiceButton.textContent = '🎤';
};

// Text Input
sendButton.addEventListener('click', () => {
  const query = userInput.value.trim();
  if (query) {
    processQuery(query);
    userInput.value = '';
  }
});

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});

// Process User Query
async function processQuery(query) {
  displayResponse(`You: ${query}`);
  
  // Check for task management commands
  if (query.toLowerCase().includes('add task')) {
    await handleTaskCreation(query);
    return;
  }
  
  // Send to DeepSeek API
  try {
    const response = await fetch('https://manishbro500.github.io//api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: query })
    });
    
    const data = await response.json();
    displayResponse(`Assistant: ${data.response}`);
    speakResponse(data.response);
  } catch (error) {
    displayResponse(`Error: ${error.message}`);
  }
}

// Task Management
async function handleTaskCreation(query) {
  // Simple parsing - in a real app you'd use more sophisticated NLP
  const taskText = query.replace(/add task/gi, '').trim();
  const now = new Date();
  
  const task = {
    title: taskText,
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
    completed: false
  };
  
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task)
    });
    
    const newTask = await response.json();
    displayResponse(`Assistant: Task "${newTask.title}" added successfully.`);
    loadTasks();
  } catch (error) {
    displayResponse(`Error adding task: ${error.message}`);
  }
}

async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();
    
    tasksList.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${task.title}</span>
        <span class="task-time">${task.time}</span>
      `;
      tasksList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

// Display and Speak Responses
function displayResponse(text) {
  const p = document.createElement('p');
  p.textContent = text;
  responseDisplay.appendChild(p);
  responseDisplay.scrollTop = responseDisplay.scrollHeight;
}

function speakResponse(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

// Update Time and Date
function updateTime() {
  const now = new Date();
  timeDisplay.textContent = now.toLocaleTimeString();
  dateDisplay.textContent = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Initialize
updateTime();
setInterval(updateTime, 1000);
loadTasks();

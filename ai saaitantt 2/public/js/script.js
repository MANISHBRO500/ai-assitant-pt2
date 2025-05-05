// Configuration
const BACKEND_URL = 'https://ai-assitant-pt2.onrender.com';

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
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: query })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    const data = await response.json();
    displayResponse(`Assistant: ${data.response}`);
    speakResponse(data.response);
  } catch (error) {
    console.error('API Error:', error);
    displayResponse(`Error: ${error.message}`);
  }
}

// Task Management
async function handleTaskCreation(query) {
  const taskText = query.replace(/add task/gi, '').trim();
  const now = new Date();
  
  const task = {
    title: taskText,
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
    completed: false
  };
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    const newTask = await response.json();
    displayResponse(`Assistant: Task "${newTask.title}" added successfully.`);
    loadTasks();
  } catch (error) {
    console.error('Task Creation Error:', error);
    displayResponse(`Error adding task: ${error.message}`);
  }
}

async function loadTasks() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks`);
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
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
    displayResponse(`Error loading tasks: ${error.message}`);
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

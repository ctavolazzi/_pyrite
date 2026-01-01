/**
 * Pyrite Console - Vanilla JS Chat Client
 * Simple, fast, streaming chat interface
 */

// State
let conversationHistory = [];
let currentAssistantMessage = null;

// DOM Elements
const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const settingsBtn = document.getElementById('settings-btn');
const statsBtn = document.getElementById('stats-btn');
const settingsModal = document.getElementById('settings-modal');
const statsModal = document.getElementById('stats-modal');

// API Key Management
function getApiKey() {
  return localStorage.getItem('pyrite_api_key');
}

function setApiKey(key) {
  localStorage.setItem('pyrite_api_key', key);
}

// UI Helpers
function addMessage(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${role}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;

  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return contentDiv;
}

function createAssistantMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return contentDiv;
}

function setLoading(loading) {
  sendBtn.disabled = loading;
  messageInput.disabled = loading;
  sendBtn.textContent = loading ? '...' : 'Send';
}

// Chat Logic
async function sendMessage(userMessage) {
  const apiKey = getApiKey();

  if (!apiKey) {
    alert('Please set your API key in settings');
    settingsModal.classList.remove('hidden');
    return;
  }

  // Add user message to UI and history
  addMessage('user', userMessage);
  conversationHistory.push({ role: 'user', content: userMessage });

  // Clear input
  messageInput.value = '';
  setLoading(true);

  try {
    // Create assistant message container
    currentAssistantMessage = createAssistantMessage();
    let accumulatedText = '';

    // Send request
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        apiKey
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    // Read stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk
      const chunk = decoder.decode(value, { stream: true });

      // Parse AI SDK data stream format
      // Format: "0:chunk\n" where 0 is the stream ID
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('0:')) {
          // Text chunk
          const text = line.slice(2).trim();
          if (text && text !== '""') {
            // Remove quotes if present
            const cleanText = text.replace(/^"|"$/g, '');
            accumulatedText += cleanText;
            currentAssistantMessage.textContent = accumulatedText;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }
      }
    }

    // Add to history
    conversationHistory.push({
      role: 'assistant',
      content: accumulatedText
    });

  } catch (error) {
    console.error('Chat error:', error);
    currentAssistantMessage.textContent = `Error: ${error.message}`;
    currentAssistantMessage.classList.add('error');
  } finally {
    setLoading(false);
    currentAssistantMessage = null;
  }
}

// Event Handlers
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;
  await sendMessage(message);
});

// Settings Modal
settingsBtn.addEventListener('click', () => {
  const apiKeyInput = document.getElementById('api-key-input');
  apiKeyInput.value = getApiKey() || '';
  settingsModal.classList.remove('hidden');
});

document.getElementById('close-settings-btn').addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

document.getElementById('save-settings-btn').addEventListener('click', () => {
  const apiKeyInput = document.getElementById('api-key-input');
  const key = apiKeyInput.value.trim();
  if (key) {
    setApiKey(key);
    settingsModal.classList.add('hidden');
    addMessage('system', 'API key saved. You can now start chatting!');
  }
});

// Stats Modal
statsBtn.addEventListener('click', async () => {
  statsModal.classList.remove('hidden');
  const statsContent = document.getElementById('stats-content');
  statsContent.textContent = 'Loading...';

  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();

    statsContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${stats.totalWorkEfforts}</div>
          <div class="stat-label">Work Efforts</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.totalTickets}</div>
          <div class="stat-label">Tickets</div>
        </div>
      </div>
      <div class="status-breakdown">
        <h3>By Status</h3>
        ${Object.entries(stats.byStatus || {})
          .map(([status, count]) => `
            <div class="status-row">
              <span class="status-badge status-${status}">${status}</span>
              <span class="status-count">${count}</span>
            </div>
          `)
          .join('')}
      </div>
    `;
  } catch (error) {
    statsContent.textContent = `Error loading stats: ${error.message}`;
  }
});

document.getElementById('close-stats-btn').addEventListener('click', () => {
  statsModal.classList.add('hidden');
});

// Close modals on backdrop click
[settingsModal, statsModal].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    settingsModal.classList.add('hidden');
    statsModal.classList.add('hidden');
  }
});

// Initial welcome message
if (!getApiKey()) {
  addMessage('system', 'Welcome to Pyrite Console! Please set your API key in settings to get started.');
} else {
  addMessage('system', 'Ready. Ask me about your work efforts, create tickets, or search your repository.');
}

// Focus input
messageInput.focus();

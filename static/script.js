// Enhanced AI Assistant - JavaScript with Chat History & Persistent Name
let userName = '';
let recognition = null;
let isListening = false;
let currentChatId = null;
let chatHistory = [];
const MAX_CHATS = 5;

// 🎨 THEME SYSTEM DATA
const themes = [
    {
        id: 'dark-purple',
        name: 'Dark Purple',
        description: 'Classic dark theme with purple gradients',
        colors: ['#6366f1', '#a855f7', '#ec4899']
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk Neon',
        description: 'Futuristic hot pink and electric blue',
        colors: ['#ff0080', '#00f0ff', '#ffff00']
    },
    {
        id: 'pastel',
        name: 'Pastel Dream',
        description: 'Soft dreamy aesthetic colors',
        colors: ['#f7a8d8', '#c4b5fd', '#a8d8ff']
    },
    {
        id: 'aurora',
        name: 'Aurora Borealis',
        description: 'Northern lights magical shimmer',
        colors: ['#7c3aed', '#14b8a6', '#10b981']
    },
    {
        id: 'tokyo',
        name: 'Tokyo Night',
        description: 'Japanese city lights aesthetic',
        colors: ['#ff007c', '#7c3aed', '#3b82f6']
    },
    {
        id: 'rose-gold',
        name: 'Rose Gold Luxury',
        description: 'Premium elegant rose gold',
        colors: ['#e8b4b8', '#daa520', '#ff6b9d']
    },
    {
        id: 'tropical',
        name: 'Tropical Paradise',
        description: 'Fresh beach sunset vibes',
        colors: ['#06b6d4', '#f97316', '#facc15']
    },
    {
        id: 'monochrome',
        name: 'Monochrome Elegance',
        description: 'Minimalist black and white',
        colors: ['#ffffff', '#9ca3af', '#6b7280']
    },
    {
        id: 'candy',
        name: 'Candy Pop',
        description: 'Sweet playful kawaii',
        colors: ['#ff69b4', '#87ceeb', '#98ff98']
    }
];

// Mobile Sidebar Toggle Elements
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Toggle Sidebar Function
function toggleSidebar(show) {
    if (show) {
        sidebar.classList.add('open');
        sidebarOverlay.style.display = 'block';
        setTimeout(() => sidebarOverlay.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        setTimeout(() => {
            sidebarOverlay.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }
}

// Mobile Menu Button Click
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        toggleSidebar(true);
    });
}

// Close Sidebar Button Click
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        toggleSidebar(false);
    });
}

// Overlay Click to Close
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        toggleSidebar(false);
    });
}

// Close sidebar when clicking nav items on mobile
const navItems = document.querySelectorAll('.nav-item, .footer-btn');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar(false);
        }
    });
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.style.display = 'none';
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }, 250);
});

// Initialize Speech Recognition
let currentVoiceLanguage = 'hi-IN';
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentVoiceLanguage;
    recognition.maxAlternatives = 1;
}

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const mainApp = document.getElementById('mainApp');
const nameInput = document.getElementById('nameInput');
const startBtn = document.getElementById('startBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const imageBtn = document.getElementById('imageBtn');
const imagePanel = document.getElementById('imagePanel');
const imagePrompt = document.getElementById('imagePrompt');
const generateImageBtn = document.getElementById('generateImageBtn');
const chatMessages = document.getElementById('chatMessages');
const chatArea = document.querySelector('.chat-area');
const clearChatBtn = document.getElementById('clearChatBtn');
const newChatBtn = document.getElementById('newChatBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const userNameSidebar = document.getElementById('userNameSidebar');
const userInitial = document.getElementById('userInitial');
const sidebarNav = document.querySelector('.sidebar-nav');

// Load saved data on startup
window.addEventListener('load', () => {
    loadUserData();
    loadChatHistory();
    initThemeSystem(); // 🎨 Initialize theme system
    
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        userName = savedName;
        skipWelcomeScreen();
    } else {
        nameInput.focus();
    }
});

// Save user data
function saveUserData() {
    localStorage.setItem('userName', userName);
}

// Load user data
function loadUserData() {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        userName = savedName;
    }
}

// Skip welcome screen if already logged in
function skipWelcomeScreen() {
    userNameSidebar.textContent = userName;
    userInitial.textContent = userName.charAt(0).toUpperCase();
    
    welcomeScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    
    if (chatHistory.length > 0) {
        loadChat(chatHistory[0].id);
    } else {
        createNewChat();
    }
}

// Logout Function
logoutBtn.addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to logout? Your chat history will be saved.');
    if (confirmed) {
        mainApp.style.opacity = '0';
        mainApp.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            mainApp.style.display = 'none';
            welcomeScreen.style.display = 'flex';
            welcomeScreen.style.opacity = '0';
            
            setTimeout(() => {
                welcomeScreen.style.opacity = '1';
                welcomeScreen.style.transform = 'scale(1)';
                nameInput.value = '';
                nameInput.focus();
            }, 50);
        }, 300);
    }
});

// Welcome Screen - Start Button
startBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    
    if (!name) {
        nameInput.style.borderColor = '#ef4444';
        nameInput.focus();
        return;
    }
    
    userName = name;
    saveUserData();
    userNameSidebar.textContent = userName;
    userInitial.textContent = userName.charAt(0).toUpperCase();
    
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        mainApp.style.opacity = '0';
        
        setTimeout(() => {
            mainApp.style.opacity = '1';
            createNewChat();
        }, 50);
    }, 300);
});

// Enter key on name input
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startBtn.click();
    }
});

// Create New Chat
function createNewChat() {
    if (chatHistory.length >= MAX_CHATS) {
        addMessage('bot', `⚠️ Maximum chat limit reached! You can only have ${MAX_CHATS} chats. Please delete an old chat to create a new one.`);
        return;
    }
    
    currentChatId = Date.now().toString();
    chatMessages.innerHTML = '';
    
    const newChat = {
        id: currentChatId,
        title: 'New Chat',
        timestamp: new Date().toISOString(),
        messages: []
    };
    
    chatHistory.unshift(newChat);
    saveChatHistory();
    renderChatHistory();
    clearBackendMemory(currentChatId);
    getGreeting();
}

// Load Chat
function loadChat(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    currentChatId = chatId;
    chatMessages.innerHTML = '';
    
    chat.messages.forEach(msg => {
        addMessage(msg.sender, msg.text, msg.imageUrl, false);
    });
    
    updateActiveChatInSidebar(chatId);
}

// Delete Chat
function deleteChat(chatId, event) {
    event.stopPropagation();
    
    const chat = chatHistory.find(c => c.id === chatId);
    const chatTitle = chat ? chat.title : 'this chat';
    
    const confirmed = confirm(`Delete "${chatTitle}"?`);
    if (confirmed) {
        chatHistory = chatHistory.filter(c => c.id !== chatId);
        saveChatHistory();
        renderChatHistory();
        
        if (currentChatId === chatId) {
            if (chatHistory.length > 0) {
                loadChat(chatHistory[0].id);
            } else {
                createNewChat();
            }
        }
    }
}

// Save Chat History
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Load Chat History
function loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        chatHistory = JSON.parse(saved);
        renderChatHistory();
    }
}

// Render Chat History in Sidebar
function renderChatHistory() {
    const existingChats = sidebarNav.querySelectorAll('.chat-history-item');
    existingChats.forEach(item => item.remove());
    
    chatHistory.forEach((chat, index) => {
        const chatItem = document.createElement('button');
        chatItem.className = 'nav-item chat-history-item';
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        const date = new Date(chat.timestamp);
        const timeAgo = getTimeAgo(date);
        
        chatItem.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <div style="flex: 1; text-align: left; overflow: hidden;">
                <div style="font-size: 0.875rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${chat.title}</div>
                <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 2px;">${timeAgo}</div>
            </div>
            <button class="delete-chat-btn" title="Delete chat">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M4 6H16M8 3H12M8 17H12M6 6V16C6 16.5 6.5 17 7 17H13C13.5 17 14 16.5 14 16V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        chatItem.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-chat-btn')) {
                loadChat(chat.id);
            }
        });
        
        const deleteBtn = chatItem.querySelector('.delete-chat-btn');
        deleteBtn.addEventListener('click', (e) => deleteChat(chat.id, e));
        
        sidebarNav.insertBefore(chatItem, sidebarNav.children[2]);
    });
    
    updateNewChatButton();
}

// Update new chat button based on limit
function updateNewChatButton() {
    if (chatHistory.length >= MAX_CHATS) {
        newChatBtn.disabled = true;
        newChatBtn.style.opacity = '0.5';
        newChatBtn.style.cursor = 'not-allowed';
        newChatBtn.title = `Maximum ${MAX_CHATS} chats reached. Delete a chat to create new one.`;
    } else {
        newChatBtn.disabled = false;
        newChatBtn.style.opacity = '1';
        newChatBtn.style.cursor = 'pointer';
        newChatBtn.title = 'Create new chat';
    }
}

// Update active chat in sidebar
function updateActiveChatInSidebar(chatId) {
    const items = sidebarNav.querySelectorAll('.chat-history-item');
    items.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = Array.from(items).find(item => {
        const chat = chatHistory.find(c => c.id === chatId);
        return item.textContent.includes(chat?.title || '');
    });
    
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Update chat title based on first message
function updateChatTitle(firstMessage) {
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (chat && chat.title === 'New Chat') {
        chat.title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
        saveChatHistory();
        renderChatHistory();
    }
}

// Get Greeting
async function getGreeting() {
    try {
        const response = await fetch('/api/greeting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addMessage('bot', data.greeting);
        }
    } catch (error) {
        console.error('Greeting error:', error);
        addMessage('bot', `Hello ${userName}! 👋 How can I assist you today?`);
    }
}

// 🎯 TYPING INDICATOR FUNCTIONS
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator-message';
    typingDiv.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content typing-indicator-content';
    
    content.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
        <span class="typing-text">AI is thinking...</span>
    `;
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);
    chatMessages.appendChild(typingDiv);
    
    scrollToBottom();
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 150);
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.style.opacity = '0';
        typingIndicator.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            typingIndicator.remove();
        }, 300);
    }
}

// Send Message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (chat && chat.messages.filter(m => m.sender === 'user').length === 0) {
        updateChatTitle(message);
    }
    
    addMessage('user', message);
    messageInput.value = '';
    
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                userName: userName,
                chatId: currentChatId
            })
        });
        
        const data = await response.json();
        
        removeTypingIndicator();
        
        if (data.success) {
            addMessage('bot', data.response);
            speak(data.response);
        } else {
            addMessage('bot', '⚠️ ' + data.error);
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage('bot', '⚠️ Connection error. Please check if the server is running.');
    }
}

// Voice Input
voiceBtn.addEventListener('click', () => {
    if (!recognition) {
        addMessage('bot', '⚠️ Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
    }
    
    if (isListening) {
        recognition.stop();
        isListening = false;
        voiceBtn.classList.remove('listening');
    } else {
        currentVoiceLanguage = currentVoiceLanguage === 'hi-IN' ? 'en-US' : 'hi-IN';
        recognition.lang = currentVoiceLanguage;
        
        const langName = currentVoiceLanguage === 'hi-IN' ? 'हिन्दी' : 'English';
        console.log(`🎤 Voice input language: ${langName}`);
        
        voiceBtn.title = `Voice Input (${langName})`;
        
        recognition.start();
        isListening = true;
        voiceBtn.classList.add('listening');
    }
});

if (recognition) {
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        messageInput.focus();
        isListening = false;
        voiceBtn.classList.remove('listening');
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        voiceBtn.classList.remove('listening');
        
        if (event.error === 'not-allowed') {
            addMessage('bot', '⚠️ Microphone access denied. Please allow microphone permissions.');
        }
    };
    
    recognition.onend = () => {
        isListening = false;
        voiceBtn.classList.remove('listening');
    };
}

// Image Generation
imageBtn.addEventListener('click', () => {
    if (imagePanel.style.display === 'none' || !imagePanel.style.display) {
        imagePanel.style.display = 'flex';
        imagePrompt.focus();
    } else {
        imagePanel.style.display = 'none';
    }
});

generateImageBtn.addEventListener('click', async () => {
    const prompt = imagePrompt.value.trim();
    
    if (!prompt) {
        imagePrompt.style.borderColor = '#ef4444';
        imagePrompt.focus();
        return;
    }
    
    addMessage('user', `🎨 Generate: ${prompt}`);
    imagePrompt.value = '';
    imagePanel.style.display = 'none';
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        showLoading(false);
        
        if (data.success) {
            addMessage('bot', '✨ Here\'s your generated image:', data.image_url);
        } else {
            addMessage('bot', '⚠️ Image generation failed: ' + data.error);
        }
    } catch (error) {
        showLoading(false);
        addMessage('bot', '⚠️ Connection error.');
    }
});

imagePrompt.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        generateImageBtn.click();
    }
});

// Clear Chat
clearChatBtn.addEventListener('click', () => {
    if (chatMessages.children.length === 0) return;
    
    const confirmed = confirm('Clear all messages in this chat? This will also clear the AI\'s memory of this conversation.');
    if (confirmed) {
        const chat = chatHistory.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages = [];
            chatMessages.innerHTML = '';
            saveChatHistory();
            clearBackendMemory(currentChatId);
            getGreeting();
        }
    }
});

// New Chat
newChatBtn.addEventListener('click', () => {
    createNewChat();
});

// Add Message to Chat
function addMessage(sender, text, imageUrl = null, saveToHistory = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? userName.charAt(0).toUpperCase() : '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const formattedText = text.replace(/\n/g, '<br>');
    content.innerHTML = formattedText;
    
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        img.alt = 'Generated image';
        img.loading = 'lazy';
        content.appendChild(img);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    if (saveToHistory) {
        const chat = chatHistory.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({
                sender,
                text,
                imageUrl,
                timestamp: new Date().toISOString()
            });
            saveChatHistory();
        }
    }
    
    requestAnimationFrame(() => {
        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
        
        setTimeout(() => {
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }, 10);
        
        setTimeout(() => {
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }, 50);
        
        setTimeout(() => {
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }, 100);
        
        setTimeout(() => {
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }, 200);
        
        setTimeout(() => {
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }, 500);
    });
}

// Scroll to bottom function
function scrollToBottom() {
    if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
        
        requestAnimationFrame(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
            
            setTimeout(() => {
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 10);
            
            setTimeout(() => {
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 100);
        });
    }
}

// Show/Hide Loading
function showLoading(show) {
    if (show) {
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.style.opacity = '1';
        }, 10);
    } else {
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
        }, 300);
    }
}

// Text-to-Speech
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        const voices = window.speechSynthesis.getVoices();
        
        const hindiPattern = /[\u0900-\u097F]/;
        const hasHindi = hindiPattern.test(text);
        
        let selectedVoice = null;
        
        if (hasHindi) {
            utterance.lang = 'hi-IN';
            
            selectedVoice = voices.find(voice => 
                voice.lang.startsWith('hi') || 
                voice.name.includes('Hindi') ||
                voice.name.includes('हिन्दी')
            );
            
            if (!selectedVoice) {
                console.warn('⚠️ Hindi voice not available. Install Hindi language pack for better experience.');
                selectedVoice = voices.find(voice => 
                    voice.name.includes('Google') && voice.lang.startsWith('en')
                ) || voices[0];
            } else {
                console.log('✅ Using Hindi voice for Hindi text');
            }
        } else {
            utterance.lang = 'en-US';
            
            selectedVoice = voices.find(voice => 
                voice.name.includes('Google') && voice.lang.startsWith('en')
            );
            
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => 
                    voice.name.includes('Microsoft') && voice.lang.startsWith('en')
                );
            }
            
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
            }
            
            console.log('✅ Using English voice for English text');
        }
        
        if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('🎤 Voice:', selectedVoice.name);
        }
        
        utterance.onerror = (event) => {
            console.error('Speech error:', event);
        };
        
        window.speechSynthesis.speak(utterance);
    }
}

// Load voices
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Add smooth transitions
welcomeScreen.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
mainApp.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
loadingIndicator.style.transition = 'opacity 0.3s ease';

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (chatHistory.length < MAX_CHATS) {
            createNewChat();
        }
    }
    
    if (e.key === 'Escape') {
        if (imagePanel.style.display === 'flex') {
            imagePanel.style.display = 'none';
        }
        const themeOverlay = document.getElementById('themeSelectorOverlay');
        if (themeOverlay && themeOverlay.classList.contains('active')) {
            closeThemeSelector();
        }
    }
});

// Clear backend memory
async function clearBackendMemory(chatId) {
    try {
        await fetch('/api/clear-memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: chatId })
        });
    } catch (error) {
        console.error('Failed to clear backend memory:', error);
    }
}

// ========================================
// 🎨 THEME SYSTEM FUNCTIONS
// ========================================

// Load saved theme on startup
function loadTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark-purple';
    applyTheme(savedTheme);
}

// Apply theme
function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('selectedTheme', themeId);
    updateActiveTheme(themeId);
}

// Update active theme card
function updateActiveTheme(themeId) {
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        if (card.dataset.theme === themeId) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

// Create theme selector modal
function createThemeSelector() {
    const overlay = document.createElement('div');
    overlay.className = 'theme-selector-overlay';
    overlay.id = 'themeSelectorOverlay';
    
    const modal = document.createElement('div');
    modal.className = 'theme-selector-modal';
    
    modal.innerHTML = `
        <div class="theme-modal-header">
            <h2 class="theme-modal-title">🎨 Choose Your Theme</h2>
            <button class="theme-close-btn" id="closeThemeSelector">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
        <div class="themes-grid" id="themesGrid"></div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Populate themes
    const grid = document.getElementById('themesGrid');
    themes.forEach(theme => {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.dataset.theme = theme.id;
        card.style.setProperty('--theme-color-1', theme.colors[0]);
        card.style.setProperty('--theme-color-2', theme.colors[1]);
        card.style.setProperty('--theme-color-3', theme.colors[2]);
        
        card.innerHTML = `
            <div class="theme-preview" style="background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]})"></div>
            <div class="theme-name">${theme.name}</div>
            <div class="theme-description">${theme.description}</div>
        `;
        
        card.addEventListener('click', () => {
            applyTheme(theme.id);
            closeThemeSelector();
        });
        
        grid.appendChild(card);
    });
    
    // Update active theme
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark-purple';
    updateActiveTheme(currentTheme);
    
    // Close button
    document.getElementById('closeThemeSelector').addEventListener('click', closeThemeSelector);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeThemeSelector();
        }
    });
}

// Open theme selector
function openThemeSelector() {
    const overlay = document.getElementById('themeSelectorOverlay');
    if (overlay) {
        overlay.classList.add('active');
    } else {
        createThemeSelector();
        setTimeout(() => {
            document.getElementById('themeSelectorOverlay').classList.add('active');
        }, 10);
    }
}

// Close theme selector
function closeThemeSelector() {
    const overlay = document.getElementById('themeSelectorOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Add theme button to sidebar
function addThemeButton() {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-btn';
    themeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
            <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Themes</span>
    `;
    
    themeBtn.addEventListener('click', openThemeSelector);
    
    // Insert before sidebar footer
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
        sidebarFooter.parentNode.insertBefore(themeBtn, sidebarFooter);
    }
}

// Initialize theme system
function initThemeSystem() {
    loadTheme();
    addThemeButton();
}

console.log('🚀 AI Assistant Pro loaded successfully!');
console.log('💡 Keyboard shortcuts:');
console.log('   Ctrl/Cmd + K: Focus message input');
console.log('   Ctrl/Cmd + I: Toggle image generation');
console.log('   Ctrl/Cmd + N: New chat');
console.log('   Escape: Close panels');
console.log(`📊 Chat limit: ${MAX_CHATS} chats maximum`);


// Clear backend memory
async function clearBackendMemory(chatId) {
    try {
        await fetch('/api/clear-memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: chatId })
        });
    } catch (error) {
        console.error('Failed to clear backend memory:', error);
    }
}


console.log('🚀 AI Assistant Pro loaded successfully!');
console.log('💡 Keyboard shortcuts:');
console.log('   Ctrl/Cmd + K: Focus message input');
console.log('   Ctrl/Cmd + I: Toggle image generation');
console.log('   Ctrl/Cmd + N: New chat');
console.log('   Escape: Close panels');
console.log(`📊 Chat limit: ${MAX_CHATS} chats maximum`);
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sidebar = document.getElementById("sidebar");
const mobileOverlay = document.getElementById("mobileOverlay");
const menuBtn = document.getElementById("menuBtn");
const closeSidebarBtn = document.getElementById("closeSidebar");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");

// --- MOBILE SIDEBAR TOGGLE ---
function toggleSidebar() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        sidebar.classList.toggle("mobile-active");
        mobileOverlay.classList.toggle("active");
    } else {
        sidebar.classList.toggle("sidebar-hidden");
    }
}

menuBtn.addEventListener("click", toggleSidebar);
closeSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("mobile-active");
    mobileOverlay.classList.remove("active");
});
mobileOverlay.addEventListener("click", () => {
    sidebar.classList.remove("mobile-active");
    mobileOverlay.classList.remove("active");
});

// --- TEXTAREA AUTO-RESIZE ---
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    sendBtn.disabled = this.value.trim() === "";
    
    if(this.value === "") this.style.height = 'auto';
});

// Handle Enter key to send (Shift+Enter for new line)
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// --- NEW CHAT ---
newChatBtn.addEventListener("click", () => {
    // In a real app, clear history logic here
    location.reload(); 
});

// --- SIMPLE MARKDOWN PARSER ---
function parseMarkdown(text) {
    // Escape HTML first to prevent XSS
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Code Blocks (```code```)
    safeText = safeText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline Code (`code`)
    safeText = safeText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text**)
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Line breaks
    safeText = safeText.replace(/\n/g, '<br>');
    
    return safeText;
}

// --- MESSAGING LOGIC ---
function addMessage(text, sender) {
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.style.display = 'none';

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    if (sender === 'ai') {
        messageDiv.innerHTML = `
            <div class="ai-avatar">✨</div>
            <div class="message-content">${parseMarkdown(text)}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${text.replace(/\n/g, '<br>')}</div>
        `;
    }

    chatBox.appendChild(messageDiv);
    // Smooth scroll to bottom
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "message ai typing-indicator";
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `
        <div class="ai-avatar">✨</div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    return typingDiv;
}

async function sendMessage() {
    const msg = userInput.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    userInput.value = "";
    userInput.style.height = 'auto'; // Reset height
    sendBtn.disabled = true;

    const typingDiv = showTypingIndicator();

    try {
        const response = await fetch("http://192.168.0.138:8080/api/chat", {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: msg
        });

        const text = await response.text();
        
        // Remove typing indicator
        if (typingDiv) typingDiv.remove();
        
        addMessage(text, "ai");

    } catch (error) {
        if (typingDiv) typingDiv.remove();
        addMessage("**Error:** Server unreachable. Please check your connection.", "ai");
    }
}
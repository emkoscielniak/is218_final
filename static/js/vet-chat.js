// Vet Chatbot Functionality
class VetChatbot {
    constructor() {
        this.chatModal = document.getElementById('vetChatModal');
        this.chatBtn = document.getElementById('vetChatBtn');
        this.closeBtn = document.getElementById('closeChatBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendChatBtn');
        
        this.conversationHistory = [];
        this.userPets = [];
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.chatBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openChat();
        });
        
        this.closeBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeChat();
        });
        
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        
        // Send on Enter (Shift+Enter for new line)
        this.chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Close on outside click
        this.chatModal?.addEventListener('click', (e) => {
            if (e.target === this.chatModal) {
                this.closeChat();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.chatModal && !this.chatModal.classList.contains('hidden')) {
                this.closeChat();
            }
        });
        
        // Load user's pets
        this.loadUserPets();
    }
    
    async loadUserPets() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch('/pets', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.userPets = await response.json();
            }
        } catch (error) {
            console.error('Error loading pets:', error);
        }
    }
    
    openChat() {
        this.chatModal?.classList.remove('hidden');
        this.chatInput?.focus();
    }
    
    closeChat() {
        this.chatModal?.classList.add('hidden');
    }
    
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Add user message to UI
        this.addUserMessage(message);
        this.chatInput.value = '';
        
        // Show typing indicator
        const typingId = this.showTypingIndicator();
        
        try {
            // Send to backend
            const response = await this.getVetResponse(message);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Add vet response to UI
            this.addVetMessage(response);
            
        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.addVetMessage('I apologize, but I\'m having trouble connecting right now. Please try again in a moment.');
            console.error('Chat error:', error);
        }
    }
    
    async getVetResponse(userMessage) {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('/chat/vet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversation_history: this.conversationHistory,
                    pets: this.userPets
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            const data = await response.json();
            
            // Update conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });
            this.conversationHistory.push({
                role: 'assistant',
                content: data.response
            });
            
            // Keep only last 10 messages (5 exchanges)
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }
            
            return data.response;
            
        } catch (error) {
            console.error('Error getting vet response:', error);
            throw error;
        }
    }
    
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addVetMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'vet-message';
        
        // Convert markdown-like formatting to HTML
        const formattedMessage = this.formatMessage(message);
        
        messageDiv.innerHTML = `
            <div class="vet-avatar">
                <i class="fas fa-user-md"></i>
            </div>
            <div class="vet-message-content">
                ${formattedMessage}
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        const typingId = 'typing-' + Date.now();
        typingDiv.id = typingId;
        typingDiv.className = 'vet-message';
        typingDiv.innerHTML = `
            <div class="vet-avatar">
                <i class="fas fa-user-md"></i>
            </div>
            <div class="vet-message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        return typingId;
    }
    
    removeTypingIndicator(typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatMessage(message) {
        // Split into paragraphs
        let formatted = message.split('\n\n').map(para => {
            para = para.trim();
            if (!para) return '';
            
            // Bold text: **text**
            para = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Bullet points
            if (para.includes('\n- ') || para.startsWith('- ')) {
                const items = para.split('\n').filter(line => line.trim());
                const listItems = items.map(item => {
                    if (item.trim().startsWith('- ')) {
                        return `<li>${item.substring(2)}</li>`;
                    }
                    return item;
                }).join('');
                return `<ul>${listItems}</ul>`;
            }
            
            return `<p>${para}</p>`;
        }).join('');
        
        return formatted;
    }
}

// Initialize chatbot when DOM is ready
function initVetChatbot() {
    // Ensure modal is hidden on init
    const modal = document.getElementById('vetChatModal');
    if (modal) {
        modal.classList.add('hidden');
        window.vetChatbot = new VetChatbot();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVetChatbot);
} else {
    initVetChatbot();
}

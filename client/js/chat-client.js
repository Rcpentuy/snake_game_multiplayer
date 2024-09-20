export class ChatClient {
  constructor(socket) {
    this.socket = socket;
    this.chatInput = document.getElementById("chatInput");
    this.chatMessages = document.getElementById("chatMessages");
    this.chatContainer = document.getElementById("chatContainer");
    this.chatInputContainer = document.getElementById("chatInputContainer");
    this.setupEventListeners();
    this.messages = [];
    this.maxMessages = 50; // 最多保存的消息数量
  }

  setupEventListeners() {
    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });

    this.socket.on("chatMessage", (message) => {
      this.displayMessage(message);
    });
  }

  sendMessage() {
    const message = this.chatInput.value.trim();
    if (message) {
      this.socket.emit("chatMessage", message);
      this.chatInput.value = "";
    }
  }

  displayMessage(message) {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    this.updateChatDisplay();
  }

  updateChatDisplay() {
    this.chatMessages.innerHTML = "";
    this.messages.forEach((msg) => {
      const msgElement = document.createElement("div");
      msgElement.textContent = msg;
      this.chatMessages.appendChild(msgElement);
    });
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  toggleChatInput() {
    this.chatInputContainer.style.display =
      this.chatInputContainer.style.display === "none" ? "block" : "none";
    if (this.chatInputContainer.style.display === "block") {
      this.chatInput.focus();
    }
  }
}

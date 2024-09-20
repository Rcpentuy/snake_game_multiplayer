export class ChatClient {
  constructor(socket) {
    this.socket = socket;
    this.chatInput = document.getElementById("chatInput");
    this.chatMessages = document.getElementById("chatMessages");
    this.chatContainer = document.getElementById("chatContainer");
    this.messageOverlay = document.getElementById("messageOverlay");
    this.setupEventListeners();
    this.messages = [];
    this.maxMessages = 5; // 最多显示的消息数量
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
    // 添加新消息到数组
    this.messages.push(message);

    // 如果消息数量超过最大值，删除最旧的消息
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    // 更新消息显示
    this.updateMessageDisplay();

    // 在聊天框中也添加消息
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    this.chatMessages.appendChild(messageElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // 10秒后移除消息
    setTimeout(() => {
      this.messages.shift();
      this.updateMessageDisplay();
    }, 10000);
  }

  updateMessageDisplay() {
    // 清空当前显示
    this.messageOverlay.innerHTML = "";

    // 添加所有当前消息
    this.messages.forEach((msg) => {
      const msgElement = document.createElement("div");
      msgElement.textContent = msg;
      this.messageOverlay.appendChild(msgElement);
    });

    // 显示消息覆盖层
    this.messageOverlay.style.display = "block";
  }

  toggleChat() {
    this.chatContainer.style.display =
      this.chatContainer.style.display === "none" ? "block" : "none";
  }
}

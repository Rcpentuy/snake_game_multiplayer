class ChatRepository {
  formatMessage(senderId, message) {
    return `Player ${senderId}: ${message}`;
  }

  // 这里可以添加更多的聊天相关功能，比如存储消息历史
}

module.exports = ChatRepository;

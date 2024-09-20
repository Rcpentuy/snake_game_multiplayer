class LoggingRepository {
  log(event, data) {
    console.log(`[${new Date().toISOString()}] ${event}:`, data);
    // 这里可以添加更复杂的日志记录逻辑，比如写入文件或发送到日志服务
  }
}

module.exports = LoggingRepository;

import fs from 'fs';
import path from 'path';
import { createWriteStream, WriteStream } from 'fs';

// Уровни логирования
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

class LogService {
  private logDir: string;
  private logStream: WriteStream | null = null;
  private errorStream: WriteStream | null = null;
  private currentLogLevel: LogLevel = LogLevel.INFO; // По умолчанию INFO
  private maxLogFileSize: number = 10 * 1024 * 1024; // 10 МБ
  private logRotationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.initLogStreams();
    
    // Запускаем ротацию логов каждый день
    this.logRotationInterval = setInterval(() => this.rotateLogFiles(), 24 * 60 * 60 * 1000);
  }

  /**
   * Создает директорию для логов, если она не существует
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Инициализирует потоки для записи логов
   */
  private initLogStreams(): void {
    const date = new Date().toISOString().split('T')[0];
    
    if (this.logStream) {
      this.logStream.end();
    }
    
    if (this.errorStream) {
      this.errorStream.end();
    }
    
    this.logStream = createWriteStream(
      path.join(this.logDir, `app-${date}.log`),
      { flags: 'a' }
    );
    
    this.errorStream = createWriteStream(
      path.join(this.logDir, `error-${date}.log`),
      { flags: 'a' }
    );
  }

  /**
   * Выполняет ротацию файлов логов
   */
  private rotateLogFiles(): void {
    this.initLogStreams();
  }

  /**
   * Устанавливает уровень логирования
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Форматирует сообщение лога
   */
  private formatLogMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (meta) {
      try {
        logMessage += ` ${JSON.stringify(meta)}`;
      } catch (error) {
        logMessage += ` [Meta serialization failed: ${error}]`;
      }
    }
    
    return logMessage;
  }

  /**
   * Записывает сообщение в лог
   */
  private writeLog(level: LogLevel, levelName: string, message: string, meta?: any): void {
    if (level < this.currentLogLevel) {
      return;
    }
    
    const formattedMessage = this.formatLogMessage(levelName, message, meta);
    
    // Выводим в консоль
    console.log(formattedMessage);
    
    // Записываем в файл
    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
    
    // Для ошибок также записываем в отдельный файл
    if (level >= LogLevel.ERROR && this.errorStream) {
      this.errorStream.write(formattedMessage + '\n');
    }
  }

  debug(message: string, meta?: any): void {
    this.writeLog(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  info(message: string, meta?: any): void {
    this.writeLog(LogLevel.INFO, 'INFO', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.writeLog(LogLevel.WARN, 'WARN', message, meta);
  }

  error(message: string, meta?: any): void {
    this.writeLog(LogLevel.ERROR, 'ERROR', message, meta);
  }

  fatal(message: string, meta?: any): void {
    this.writeLog(LogLevel.FATAL, 'FATAL', message, meta);
  }

  /**
   * Очищает ресурсы при завершении работы
   */
  cleanup(): void {
    if (this.logRotationInterval) {
      clearInterval(this.logRotationInterval);
    }
    
    if (this.logStream) {
      this.logStream.end();
    }
    
    if (this.errorStream) {
      this.errorStream.end();
    }
  }
}

export default new LogService(); 
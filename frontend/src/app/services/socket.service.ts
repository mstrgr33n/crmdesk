import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    console.log("SocketService initialized");
  }

  initializeSocket(backendUrl:string):void {
    const socket: Socket = io(backendUrl, {
      extraHeaders: {
        "Access-Control-Allow-Origin": "*",
      }
    });
    this.socket = socket;
  }

  on(event: string, callback: (data: unknown) => void): void {
    this.socket.on(event, callback);
  }

  emit(event: string, data: unknown): void {
    this.socket.emit(event, data);
  }

  disconnect(): void {
    this.socket.disconnect();
  }

}

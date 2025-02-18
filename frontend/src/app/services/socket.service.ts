import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() { }

  initializeSocket(backendUrl:string):void {
    const socket: Socket = io(backendUrl, {
      extraHeaders: {
        "Access-Control-Allow-Origin": "*",
      }
    });
    this.socket = socket;
  }

  on(event: string, callback: (data: any) => void): void {
    this.socket.on(event, callback);
  }

  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  disconnect(): void {
    this.socket.disconnect();
  }

}

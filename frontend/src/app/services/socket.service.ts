import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '../shared/types/SocketEvents';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  public serverUrl!: string;
  public activeUsers$ = new BehaviorSubject<any[]>([]);

  initSockets(url:string) {
    this.socket = io(url);
  }

  joinRoom(roomId: string, userName: string) {
    this.socket.emit(SocketEvents.joinRoom, {roomId, userName});
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(event, (data: T) => {
        subscriber.next(data);
      });
    });
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

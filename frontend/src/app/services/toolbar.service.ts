import { Injectable } from '@angular/core';
import { BehaviorSubject  } from 'rxjs';
import { BoardState } from '../shared/models/boardstate.enum';

@Injectable({
  providedIn: 'root'
})
export class ToolbarService {
   mode = new BehaviorSubject<BoardState>(BoardState.Select);

  constructor() { }

  getMode() {
    return this.mode.asObservable();
  }

  setMode(mode: BoardState) {
    this.mode.next(mode);
  }

}

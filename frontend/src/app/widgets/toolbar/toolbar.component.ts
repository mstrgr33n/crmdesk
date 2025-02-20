import { Component, OnInit } from '@angular/core';
import { ToolbarService } from '../../services/toolbar.service';
import { BoardState } from '../../shared/models/boardstate.enum';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faT, 
  faMousePointer
  } from '@fortawesome/free-solid-svg-icons';
  import { faSquare, faCircle, faStickyNote, faFloppyDisk } from '@fortawesome/free-regular-svg-icons';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-toolbar',
  imports: [FontAwesomeModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent implements OnInit {
  currentMode: BoardState | null = null;
  

  public buttons = [
    { name: 'Select', mode: BoardState.Select, icon: faMousePointer },
    { name: 'Text', mode: BoardState.Text, icon: faT },
    { name: 'Rectangle', mode: BoardState.Rectangle, icon: faSquare },
    { name: 'Ellipse', mode: BoardState.Ellipse, icon: faCircle },
    { name: 'Notes', mode: BoardState.Notes, icon: faStickyNote },
    { name: 'Notes', mode: BoardState.Save, icon: faFloppyDisk, click: ()=> {
      this.boardService.exportToSVG();
    } },
  ]

  constructor(
    private toolbarService: ToolbarService,
    public boardService: BoardService
  ) {}

  setMode(mode: BoardState) {
    this.toolbarService.setMode(mode);
  }

  ngOnInit() {
    this.toolbarService.getMode().subscribe(mode => {
      this.currentMode = mode;
    });
  }
}

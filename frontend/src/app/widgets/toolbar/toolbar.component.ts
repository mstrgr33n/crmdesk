import { Component } from '@angular/core';
import { CanvasService } from '../../services/canvas.service';
import { CanvasModes } from '../../shared/types/CanvasModes';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {faMousePointer, faSquare, faCircle, faEraser, faStickyNote, faLink } from '@fortawesome/free-solid-svg-icons';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-toolbar',
  imports: [FontAwesomeModule, NgFor],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  buttons = [
    {
      icon: faMousePointer,
      mode: CanvasModes.Select,
      tooltip: 'Select'
    },
    {
      icon: faSquare,
      mode: CanvasModes.Rect,
      tooltip: 'Rectangle'
    },
    {
      icon: faCircle,
      mode: CanvasModes.Circle,
      tooltip: 'Circle'
    },
    {
      icon: faLink,
      mode: CanvasModes.Arrow,
      tooltip: 'Note'
    },
    {
      icon: faEraser,
      mode: CanvasModes.Erase,
      tooltip: 'Eraser'
    }
  ];
  
  CanvasModes = CanvasModes;
  currentMode = CanvasModes.Select;

  constructor(public canvasService: CanvasService) {}

  setMode(mode: CanvasModes) {
    this.currentMode = mode;
    this.canvasService.setCanvasMode(mode);
  }
}

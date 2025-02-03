import { Component, ElementRef, AfterViewInit, ViewChild, Input, OnDestroy } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { CanvasService } from '../../services/canvas.service';
import { ToolbarComponent } from '../../widgets/toolbar/toolbar.component';

@Component({
  selector: 'app-canvas',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    ToolbarComponent],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css'
})

export class CanvasComponent implements AfterViewInit,  OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef;
  @ViewChild('svg', { static: false }) svgRef!: SVGElement;
  @Input() url!: string;
  @Input() userName!: string;
  @Input() roomId!: string;

  constructor(private socket: SocketService, private canvasService: CanvasService) { }

  ngAfterViewInit(): void {
    this.canvasService.initializeCanvas(this.canvasRef);
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}

  
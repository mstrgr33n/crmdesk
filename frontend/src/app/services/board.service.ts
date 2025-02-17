import { ElementRef, Injectable } from '@angular/core';
import { Point } from '../shared/models/point.model';
import { ToolbarService } from './toolbar.service';
import { BoardState } from '../shared/models/boardstate.enum';
import { dia, shapes, connectionStrategies } from '@joint/core';
import { v4 as uuidv4 } from 'uuid';
import { JointTools } from '../shared/tools/jointtool.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private currentMode: BoardState | null = null;
  private graph = new dia.Graph({}, { cellNamespace: shapes });
  private paper!: dia.Paper;
  private tools = new JointTools();

  constructor(private toolbarService: ToolbarService) {
    this.toolbarService.getMode().subscribe(mode => {
      this.currentMode = mode;
    });
  }

  initilizeBoard(boardId: ElementRef) {
    this.paper = new dia.Paper({
      el: boardId.nativeElement,
      width: window.innerWidth,
      height: window.innerHeight,
      drawGrid: { name: "dot" },
      background: { color: "#F3F7F6" },
      gridSize: 20,
      step: 1,
      model: this.graph,
      cellViewNamespace: shapes,
      async: true,
      interactive: true,
      defaultLink: () => new shapes.standard.Link({
        router: { name: "orthogonal" },
        connector: { name: "rounded" },
        attrs: {
          line: {
            stroke: "#000000",
            strokeWidth: 2,
            targetMarker: {
              shape: "circle",
              radius: 5,
              fill: "#000000"
            }
          }
        }
      }),
      connectionStrategy: connectionStrategies.pinRelative
    });

    this.initializeHandlers();
  }

  initializeHandlers() {
    const tools = this.tools.getJointTools()
    this.paper.on('blank:pointerclick', this.addShape.bind(this));
    this.paper.on('element:mouseenter', elementView => {
      elementView.addTools(tools.LinkTools);
    });
    this.paper.on('element:mouseleave', elementView => {
      elementView.removeTools();
    });
    this.paper.on('link:mouseenter', function (linkView: dia.LinkView) {
      linkView.addTools(tools.ArrowTools);
    });

    this.paper.on('link:mouseleave', function (linkView) {
      linkView.removeTools();
    });
  }

  addShape(event: any, x: number, y: number) {
    this.createShape({ x, y });
  }

  createShape(position: Point): void {
    switch (this.currentMode) {
      case BoardState.Text:
        this.createText(position);
        break;
      case BoardState.Ellipse:
        this.createCircle(position);
        break;
      case BoardState.Rectangle:
        this.createRectangle(position);
        break;
      case BoardState.Notes:
        this.createNotes(position);
        break;
      default:
        break;
    }
  }
  createText(position: Point) {
    const cilinder = new shapes.standard.Cylinder({
      id: uuidv4(),
      position: { x: position.x, y: position.y },
      size: { width: 160, height: 60 },
      attrs: {
        label: { text: 'Double-click to edit', style: { fontSize: 14, fill: 'black' } },
      },
    });

    this.graph.addCell(cilinder);
  }

  createRectangle(position: Point) {
    const rect = new shapes.standard.Rectangle({
      id: uuidv4(),
      position: { x: position.x, y: position.y },
      size: { width: 160, height: 60 },
      attrs: {
        body: {
          stroke: '',
          strokeWidth: 0,
          filter: {
            name: 'dropShadow',
            args: {
              dx: 3,
              dy: 3,
              blur: 5
            }
          }
        },
        label: { text: 'Double-click to edit', style: { fontSize: 14, fill: 'black' } },
      },
    });
    this.graph.addCell(rect);

  }

  createEllipse(position: Point) {
    // Создание эллипса
  }
  createCircle(position: Point) {
    const circle = new shapes.standard.Circle({
      id: uuidv4(),
      position: { x: position.x, y: position.y },
      size: { width: 150, height: 150 },
      radius: 50,
      attrs: {
        body: {
          fill: '#fff',
          stroke: '',
          strokeWidth: 1,
          filter: {
            name: 'highlight',
            args: {
              color: 'red',
              width: 2,
              opacity: 0.5,
              blur: 5
            }
          },
        },
        label: { text: 'Double-click to edit', fontSize: 14, fill: 'black' }
      },
    });
    this.graph.addCell(circle);
  }

  createNotes(position: Point) {
    const notes = new shapes.standard.HeaderedRectangle({
      id: uuidv4(),
      position: { x: position.x, y: position.y },
      size: { width: 200, height: 100 },
      attrs: {
        body: {
          fill: '#fff',
          stroke: '',
          strokeWidth: 1,
          filter: {
            name: 'dropShadow',
            args: {
              dx: 3,
              dy: 3,
              blur: 5
            }
          }
        },
        header: {
          strokeWidth: 1
        },
        headerText: { text: 'Double-click to edit', fontSize: 14, fill: 'black' },
        bodyText: { text: 'Double-click to edit', fontSize: 14, fill: 'black' },
      },
    });
    this.graph.addCell(notes);
  }

}




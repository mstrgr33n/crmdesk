import { ElementRef, Injectable } from '@angular/core';
import { Point } from '../shared/models/point.model';
import { ToolbarService } from './toolbar.service';
import { BoardState } from '../shared/models/boardstate.enum';
import { dia, shapes, connectionStrategies } from '@joint/core';
import { v4 as uuidv4 } from 'uuid';
import { JointTools } from '../shared/models/jointtool.model';
import { SocketService } from './socket.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private showAttributePanel = new BehaviorSubject<boolean>(false);
  private positionAttributePanel = new BehaviorSubject<Point>({ x: 0, y: 0 });
  private currentMode: BoardState | null = BoardState.Select;
  private graph = new dia.Graph({}, { cellNamespace: shapes, });
  private paper!: dia.Paper;
  private tools = new JointTools();
  private currentElement: dia.ElementView | null = null;

  constructor(
    private toolbarService: ToolbarService,
    private socketService: SocketService,
  ) {
    this.toolbarService.getMode().subscribe(mode => {
      this.currentMode = mode;
    });
  }

  initilizeBoard(boardId: ElementRef) {
    this.graph.on('remove', (elementView) => {
  
      this.showAttributePanel.next(false);
      this.socketService.emit('deleteObject', elementView.id);
    });
    
    this.paper = new dia.Paper({
      el: boardId.nativeElement,
      width: '100%',
      height: '100%',
      autoResizePaper: true,
      borderless: true,
      drawGrid: {
        name: "dot",
        args: {
          color: '#aaa',
          thickness: 1,
          scaleFactor: 3,
        }
      },
      background: { color: "#F3F7F6" },
      gridSize: 5,
      step: 1,
      model: this.graph,
      cellViewNamespace: shapes,
      async: true,
      interactive: true,
      defaultRouter: {
        name: "manhattan",
        args: {
          step: 10,
          endDirections: ["right", "left", "top", "bottom"],
          startDirections: ["left", "right", "bottom", "top"],
          padding: {
            bottom: 20,
            top: 20,
            left: 20,
            right: 20
          }
        }
      },
      defaultAnchor: {
        name: "midSide",
        args: {
          name: "perpendicular",
          args: { padding: 5 }
        }
      },
      defaultConnector: {
        name: "rounded"
      },
      clickThreshold: 10,
      defaultLink: () => new shapes.standard.Link({
        attrs: {
          line: {
            stroke: "#000000",
            strokeWidth: 2,
            targetMarker: {
              shape: "square",
              radius: 1,
              fill: "#red"
            },
          },
        }
      }),
      connectionStrategy: connectionStrategies.pinAbsolute
    });

    this.initializeHandlers(boardId);

  }

  initializeHandlers(boardId: ElementRef) {
    const tools = this.tools.getJointTools()
    this.paper.on('blank:pointerclick', (event: dia.Event, x: number, y: number) => {
      if (this.currentElement) {
        this.currentElement.removeTools();
        this.socketService.emit('unlockObject', { id: this.currentElement.model.id });
      }
      this.currentElement = null;
      if (this.showAttributePanel.value) this.showAttributePanel.next(false);
      this.addShape(event, x, y);
    });
    this.paper.on('element:pointerclick', elementView => {
      if (this.currentElement) {
        this.socketService.emit('unlockObject', { id: this.currentElement.model.id });
      }
      this.currentElement = elementView;
      elementView.addTools(tools.LinkTools);
    });

    this.paper.on('element:pointermove', (elementView, evt, x, y) => {
      this.socketService.emit('updateObject', elementView.model);
      const bbox = elementView.getBBox().topLeft();
      this.positionAttributePanel.next({ x: bbox.x, y: bbox.y - 70 });
    });

    this.paper.on('element:pointerdown', (elementView, evt, x, y) => {
      const bbox = elementView.getBBox().topLeft();
      this.showAttributePanel.next(true);
      this.positionAttributePanel.next({ x: bbox.x, y: bbox.y - 70 });
      if (this.currentElement && this.currentElement !== elementView) {
        this.socketService.emit('lockObject', { id: this.currentElement.model.id });
      }
    });

    this.paper.on('link:mouseenter', function (linkView: dia.LinkView) {
      linkView.addTools(tools.ArrowTools);
    });

    this.paper.on('link:mouseleave', function (linkView) {
      linkView.removeTools();
    });

    this.paper.on('cell:pointerdblclick', function (cellView, evt, x, y) {
      const cell = cellView.model; // Получаем модель ячейки
      const labels: dia.Cell.Selectors | undefined = cell?.attributes?.attrs;// Получаем метки ячейки, если они естьlabel; // Получаем текущие метки

      if (labels && labels['labels']) {
        const labelText = labels['labels'].text!; // Текущий текст метки
        // Создаем textarea для редактирования
        const textarea = document.createElement('textarea');
        textarea.value = labelText;
        textarea.style.position = 'absolute';
        textarea.style.top = `${y}px`;
        textarea.style.left = `${x}px`;
        textarea.style.zIndex = '1000';
        textarea.style.width = '200px';
        textarea.style.height = '50px';
        textarea.style.padding = '5px';
        textarea.style.boxSizing = 'border-box';

        document.body.appendChild(textarea);

        // После завершения редактирования
        textarea.addEventListener('keydown', (event: KeyboardEvent) => {
          if ((event.key === 'Enter' && event.ctrlKey) || event.key === 'Escape') {
            const updatedText = textarea.value;
            // Обновляем текст метки
            cell.set('labels', [{
              position: { name: 'center' },
              attrs: { text: updatedText, fontSize: 14, fill: 'black' }
            }]);
            cell.attr('label/text', updatedText);; //.attrs.set('text', updatedText); // Обновляем текст в модели = updatedText;

            // Удаляем textarea
            document.body.removeChild(textarea);
          }
        });

        // Автоматически фокусируемся на textarea
        textarea.focus();
        textarea.select();
      }
    });

    window.addEventListener('resize', () => {

      this.paper.setDimensions(
        boardId.nativeElement.clientWidth,
        boardId.nativeElement.clientHeight);
    });

    this.paper.on('element:change:position', (elementView) => {
      const model = elementView.model;
      const position = model.get('position');
      const size = model.get('size');
      
      this.socketService.emit('updateObject', {
        id: model.id,
        data: {
          position: position,
          size: size,
          type: model.get('type')
        }
      });
    });

    this.paper.on('transition:end', (elementView, evt, x, y) => {
      const bbox = elementView.getBBox().topLeft();
      this.positionAttributePanel.next({ x: bbox.x, y: bbox.y - 70 });
    });

    this.paperMovement();
  }

  paperMovement() {

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    this.paper.on('blank:pointerdown', (event: dia.Event) => {
      isPanning = true;
      startX = event.offsetX!;
      startY = event.offsetY!;
    });

    this.paper.on('cell:pointerup blank:pointerup', () => {
      isPanning = false;
    });

    this.paper.on('blank:pointermove', (event: dia.Event) => {
      this.showAttributePanel.next(false);
      this.currentElement?.removeTools();
      if (isPanning) {
        const dx = event.offsetX! - startX;
        const dy = event.offsetY! - startY;

        const translate = this.paper.translate();
        this.paper.translate(translate.tx + dx, translate.ty + dy);

        startX = event.offsetX!;
        startY = event.offsetY!;
      }
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
    const cilinder = new shapes.standard.TextBlock({
      id: uuidv4(),
      position: { x: position.x, y: position.y },
      size: { width: 160, height: 60 },
      attrs: {
        body: {
          fill: 'none',
          stroke: 'none'
        },
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
    console.log(position);
    // Создание эллипса
  }
  createCircle(position: Point) {
    const circle = new shapes.standard.Circle({
      id: uuidv4(),
      position: { x: position.x, y: position.y },
      size: { width: 150, height: 150 },
      //radius: 150,
      attrs: {
        body: {
          fill: '#fff',
          stroke: '',
          strokeWidth: 1,
          filter: {
            name: 'highlight',
            args: {
              color: 'grey',
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
    this.socketService.emit('createObject', notes);
  }

  public initializeSocketHadler(roomId: string) {
    this.socketService.on('initialState', (objects: unknown) => {
      if (objects instanceof Array) {
        objects.forEach((obj) => {
          const element = this.createJointElement(obj);
          this.graph.addCell(element);
        });
      }
    });

    this.socketService.on('objectCreated', (obj: any) => {
      const element = this.createJointElement(obj);
      this.graph.addCell(element);
    });

    this.socketService.on('objectUpdated', (data: any) => {
      const cell = this.graph.getCell(data.id);
      if (cell) {
        cell.set('position', data.position);
        cell.set('size', data.size);
      }
    });

    this.socketService.on('objectLocked', (data: any) => {
      if (data.id) {
        const cell = this.graph.getCell(data.id);
        if (cell) {
          cell.attr({ body: { fill: 'lightgray' } });
        }
      }
    });

    this.socketService.on('objectUnlocked', (data: any) => {
      if (data.id) {
        const cell = this.graph.getCell(data.id);
        if (cell) {
          cell.attr({ body: { fill: 'white' } });
        }
      }
    });
    const rndInt = Math.floor(Math.random() * 100) + 1
    // Join a room
    this.socketService.emit('joinRoom', { roomId: roomId, userName: 'User' + rndInt });

    this.socketService.on('objectDeleted', (data: any) => {
      const cell = this.graph.getCell(data.id);
      if (cell) {
        cell.remove({ disconnectLinks: true });
      }
    });
  
    this.socketService.on('objectUpdated', (data: any) => {
      const cell = this.graph.getCell(data.id);
      if (cell) {
        cell.set('position', data.data.position, { silent: true });
        cell.set('size', data.data.size, { silent: true });
      }
    });
  }

  createJointElement(obj: any): any {
    switch (obj.type) {
      case 'standard.Rectangle':
        return new shapes.standard.Rectangle(obj.data);
      case 'standard.Circle':
        return new shapes.standard.Circle(obj.data);
      case "standard.HeaderedRectangle":
        const hr = new shapes.standard.HeaderedRectangle(obj.data);
        hr.set('id', obj.id);
        return hr;
      default:
        return null;
    }
  }

  onPanelPositionChange() {
    return this.positionAttributePanel.asObservable();
  }

  onPanelVisibilityChange() {
    return this.showAttributePanel.asObservable();
  }

  exportToSVG(): void {
    var a = this.paper.svg;
    debugger;
  }
}




import { ElementRef, Injectable } from '@angular/core';
import { Point } from '../shared/models/point.model';
import { ToolbarService } from './toolbar.service';
import { BoardState } from '../shared/models/boardstate.enum';
import { dia, shapes } from '@joint/core';
import { JointTools } from '../shared/models/jointtool.model';
import { SocketService } from './socket.service';
import { BehaviorSubject } from 'rxjs';
import { paperConfig } from '../shared/configs/paper.config';
import { ShapesHelper } from '../shared/models/shape-helper';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private showAttributePanel = new BehaviorSubject<boolean>(false);
  private positionAttributePanel = new BehaviorSubject<Point>({ x: 0, y: 0 });
  private currentMode: BoardState = BoardState.Select;
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

    paperConfig.model = this.graph;
    paperConfig.el = boardId.nativeElement;

    this.paper = new dia.Paper(paperConfig);

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

    this.graph.on('change:source change:target', (link) => {
      if (link.get('source').id && link.get('target').id) {
        debugger;
      }

    });

    this.graph.on('change:vertices', (link) => {
      debugger;
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

  createShape(position: Point, emitEvent: boolean = true, element: any | null = null): void {
    const shapes: any = {
      [BoardState.Text]: () => ShapesHelper.createText(position, element),
      [BoardState.Ellipse]: () => ShapesHelper.createEllipse(position, element),
      [BoardState.Rectangle]: () => ShapesHelper.createRectangle(position, element),
      [BoardState.Notes]: () => ShapesHelper.createNotes(position, element),
      [BoardState.Circle]: () => ShapesHelper.createCircle(position, element),
      [BoardState.Select]:  null,
      [BoardState.Save]: null,
    };

    const createSelectedShape = element ? shapes[element.type] : shapes[this.currentMode];
    if (createSelectedShape) {
      const shape = createSelectedShape();
      this.graph.addCell(shape);
      if (emitEvent) {
        this.socketService.emit('createObject', shape);
      }
    }
  }



  public initializeSocketHadler(roomId: string) {
    this.socketService.on('initialState', (objects: unknown) => {
      if (objects instanceof Array) {
        objects.forEach((obj) => {
          console.log(obj);
          const element = this.createShape(obj.data.position, false, obj);
        });
      }
    });

    this.socketService.on('objectCreated', (obj: any) => {
      const element =this.createShape(obj.data.position, false, obj);
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

    
  }

  onPanelPositionChange() {
    return this.positionAttributePanel.asObservable();
  }

  onPanelVisibilityChange() {
    return this.showAttributePanel.asObservable();
  }

  exportToSVG(): void {
    var a = this.paper.svg;
  }
}




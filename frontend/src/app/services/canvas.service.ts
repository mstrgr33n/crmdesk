import { ElementRef, Injectable } from '@angular/core';
import { Canvas, Point, Rect,
  Ellipse, Circle, TPointerEvent, TPointerEventInfo,
  Shadow, 
  FabricObject,
  Line} from 'fabric';
import { CanvasModes } from '../shared/types/CanvasModes';
import { v4 as uuidv4 } from 'uuid';
import LeaderLine from 'leader-line-integrate';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  canvas!: Canvas;
  roomId!: string;
  canvasMode: CanvasModes = CanvasModes.Select;
  presetColors = ['#FFCDD2', '#FFAB91', '#FDD835', '#81C784', '#81D4FA', '#64B5F6', '#B39DDB'];
  currentColor = '#ffffff';
  colorPanelPosition = { left: 0, top: 0 };
  showColorPanel = false;
  fromObject: any = null;

  initializeCanvas(canvasRef: ElementRef): void {
    this.canvas = new Canvas(canvasRef.nativeElement, {
      width: window.innerWidth - 5,
      height: window.innerHeight - 5,
      backgroundColor: '#f1f5f9',
      selection: true,
      renderOnAddRemove: true,
    });
    this.canvas.on('object:added', (event) => {
      this.canvas.requestRenderAll();
    });

    this.canvas.on('after:render', () => {
      this.canvas.calcOffset();
    });

    this.canvas.on('mouse:wheel', (event) => {
      const delta = event.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;

      // Limit zoom
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;

      const point = new Point({
        x: event.e.offsetX,
        y: event.e.offsetY
      });

      this.canvas.zoomToPoint(point, zoom);
      event.e.preventDefault();
      event.e.stopPropagation();
    });
  }

  setCanvasMode(mode: CanvasModes) {
    this.canvasMode = mode;
    this.canvas.isDrawingMode = false;
    this.canvas.off('mouse:down'); 

    if (mode === CanvasModes.Select) {
      this.canvas.selection = true;
    } else if(mode  === CanvasModes.Erase) {
      this.canvas.selection = true;
      this.canvas.on('mouse:down', (event) => this.deleteSelected(event));
    } else if (mode === CanvasModes.Arrow) {
      this.canvas.selection = true;
      this.canvas.on('mouse:down', (event) => this.startLinks(event));
    } else {
      this.canvas.selection = false;
      this.canvas.on('mouse:down', (event) => this.startDrawing(event));
    }
  }
  startLinks(event: TPointerEventInfo<TPointerEvent>): any {
    if (!event.target) return;
    if (this.fromObject) {
      this.addLinks(this.fromObject, event.target as any);
    } else {
      this.fromObject = event.target;
    }
  }

  deleteSelected(event: TPointerEventInfo<TPointerEvent>) {
    if (!event.target) return;
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      this.canvas.remove(activeObject);
      //this.socketService.emitDeleteElement(this.roomId, (activeObject as any).data?.id);
    }
  }

  startDrawing(event: TPointerEventInfo<TPointerEvent>) {
    const pointer = this.canvas.getViewportPoint(event.e);
    const id = uuidv4();
    let canvasObject: any = null ;
    switch (this.canvasMode) {
      case CanvasModes.Rect:
        this.canvas.add(this.createRectangle(pointer));
        break;
      case CanvasModes.Circle:
        this.canvas.add(this.createCircle(event));
        break;
      default:
        break;
    }
    this.canvas.requestRenderAll();
  }

  createRectangle(pointer: Point): Rect {
    const rect = new Rect({
      id: uuidv4(),
      left: pointer.x,
      top: pointer.y,
      fill: this.currentColor,
      stroke: 'black',
      strokeWidth: 1,
      width: 100,
      height: 100,
      shadow: new Shadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 5,
        offsetX: 3,
        offsetY: 3
      }),
      noScaleCache: false,
    });
    return rect;
  }

  createCircle(event: TPointerEventInfo<TPointerEvent>): Circle {
    const pointer = this.canvas.getViewportPoint(event.e);
    const circle = new Circle({
      id: uuidv4(),
      left: pointer.x,
      top: pointer.y,
      fill: this.currentColor,
      stroke: 'black',
      strokeWidth: 1,
      radius: 50,
      shadow: new Shadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 5,
        offsetX: 3,
        offsetY: 3
      })
    });
    return circle;
  }

  addLinks(source: FabricObject, target: FabricObject) {
    let start = source.getCoords();
    debugger
    let end = target.getXY();/*

    const line = new Line([start.x, start.y, end.x, end.y], {
      stroke: 'black',
      strokeWidth: 2,
    });

    this.canvas.add(line);
    this.canvas.requestRenderAll();*/

    this.fromObject = null;
  }

  destroy() {
    this.canvas.dispose();
  }
}

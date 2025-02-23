import { 
  AfterViewInit, 
  Component, 
  ElementRef, 
  ViewChild, 
  ChangeDetectionStrategy, 
  OnChanges, 
  SimpleChanges,
  input} from '@angular/core';
import { ToolbarComponent } from "../../widgets/toolbar/toolbar.component";
import { BoardService } from '../../services/board.service';
import { SocketService } from '../../services/socket.service';
import { AttributeEditorComponent } from '../../widgets/attribute-editor/attribute-editor.component';


@Component({
  selector: 'app-board',
  imports: [ToolbarComponent, AttributeEditorComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements AfterViewInit, OnChanges {
  @ViewChild('board') board!: ElementRef;
  backendUrl = input<string>();
  roomId = input<string>();

  constructor(
    private boardService: BoardService, 
    private socketService: SocketService) { }

  ngAfterViewInit() {
    this.boardService.initilizeBoard(this.board);
    /*
    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paper = new dia.Paper({
      el: this.board.nativeElement,
      width: window.innerWidth,
      height: window.innerHeight,
      gridSize: 5,
      model: graph,
      cellViewNamespace: shapes,
      async: true,
      interactive: true
    });

    paper.on('element:mouseenter',  function(a: any, b: any) { // Получаем текущие метки
      

    });

    paper.on('cell:pointerdblclick', function (cellView, evt, x, y) {

      const cell = cellView.model; // Получаем модель ячейки
      const labels: any = cell?.attributes?.attrs;// Получаем метки ячейки, если они естьlabel; // Получаем текущие метки

      if (labels && labels.label) {
        const labelText = labels.label.text; // Текущий текст метки

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

    paper.on('blank:pointerclick', function (a: any, b: any, c:any) {
      debugger;
    });

    var boundaryTool = new elementTools.Boundary();
    var resizeButton = new elementTools.HoverConnect({
      connectionType: 'bundle',
      connectionPoint: 'midpoint',
      endpoint: 'Blank',
      anchors: ['right', 'left'],
      theme: 'resize',
    });
    const connectButton = new elementTools.Remove({
      x: - 10,
      y: - 15,
      offset: { x: 0, y: 5 },
      magnet: 'body'
    });

    const icon  = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <g data-name="Layer 10" id="Layer_10"><path d="M164.57,205.13a34.71,34.71,0,0,1-24.75-10.21L99.27,154.37a5.63,5.63,0,0,0-8,0l-11,11h0c-9.55,9.55-17.34,8.74-21.14,7.41s-10.39-5.58-11.87-19L37.78,67.87c-1.05-9.47,1.75-18.06,7.87-24.18s14.7-8.91,24.17-7.86l85.94,9.48c13.42,1.48,17.67,8.07,19,11.87s2.14,11.59-7.41,21.14l-11,11a5.63,5.63,0,0,0,0,8l40.55,40.55a35,35,0,0,1,0,49.49l-7.56,7.56A34.71,34.71,0,0,1,164.57,205.13ZM95.29,142.72a15.51,15.51,0,0,1,11,4.58l40.55,40.55a25.1,25.1,0,0,0,35.35,0l7.56-7.56a25,25,0,0,0,0-35.35l-40.55-40.55a15.62,15.62,0,0,1,0-22.1l11-11c4.09-4.09,6-8.11,5-10.76s-4.91-4.6-10.66-5.24L68.73,45.77c-6.4-.71-12.08,1.07-16,5s-5.71,9.61-5,16l9.48,85.94c.64,5.75,2.6,9.73,5.24,10.66s6.67-1,10.76-5l11-11A15.48,15.48,0,0,1,95.29,142.72ZM76.74,161.87h0Z"/><path d="M334,364.39a33.51,33.51,0,0,1-3.85-.22l-85.94-9.48c-13.42-1.48-17.67-8.07-19-11.87s-2.14-11.59,7.41-21.14l11-11a5.61,5.61,0,0,0,0-7.95l-40.55-40.56a35.09,35.09,0,0,1,0-49.49l7.56-7.56a35.09,35.09,0,0,1,49.49,0l40.56,40.55a5.61,5.61,0,0,0,7.95,0l11-11c9.55-9.55,17.34-8.74,21.14-7.41s10.39,5.58,11.87,19l9.48,85.94c1,9.47-1.75,18.06-7.86,24.18A28.24,28.24,0,0,1,334,364.39Zm-98.6-159.52a24.79,24.79,0,0,0-17.67,7.28l-7.56,7.56a25.1,25.1,0,0,0,0,35.35l40.55,40.55a15.62,15.62,0,0,1,0,22.1l-11,11c-4.09,4.09-6,8.11-5,10.76s4.91,4.6,10.66,5.24l85.94,9.48c6.39.71,12.07-1.07,16-5s5.71-9.61,5-16l-9.48-85.94c-.64-5.75-2.6-9.73-5.24-10.66s-6.67,1-10.76,5h0l-11,11a15.62,15.62,0,0,1-22.1,0l-40.55-40.55A24.8,24.8,0,0,0,235.43,204.87Zm87.83,33.26h0Z"/>
    </g></svg>`;

    const base64Icon = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2NjREODhDMjc4MkVFMjExODUyOEU5NTNCRjg5OEI3QiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQTc4MzUwQjJGMEIxMUUyOTFFNUE1RTAwQ0EwMjU5NyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQTc4MzUwQTJGMEIxMUUyOTFFNUE1RTAwQ0EwMjU5NyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2NjREODhDMjc4MkVFMjExODUyOEU5NTNCRjg5OEI3QiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2NjREODhDMjc4MkVFMjExODUyOEU5NTNCRjg5OEI3QiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pk3oY88AAAEMSURBVHja7JftDYMgEIbRdABHcARG6CalGziCG3QE3KAj0A0cod3AEa6YUEMpcKeI9oeXvP5QuCeA90EBAGwPK7SU1hkZ12ldiT6F1oUycARDRHLBgiTiEzCwTNhNuRT8XOEog/AyMqlOXPEuZzx7q29aXGtIhLvQwfNuAgtrYgrcB+VWqH2BhceBD45ZE4EyB/7zIQTvCeAWgdpw1CqT2Sri2LsRZ4cddtg/GLfislo55oNZxE2ZLcFXT8haU7YED9yXpxsCGMvTn4Uqe7DIXJnsAqGYB5CjFnNT6yEE3qr7iIJT+60YXJUZQ3G8ALyof+JWfTV6xrluEuqkHw/ESW3CoJsBRVubtwADAI2b6h9uJAFqAAAAAElFTkSuQmCC`;

    const ResizeTool = elementTools.Control.extend({
      children: [
        {
          tagName: 'circle',
          selector: 'handle',
          attributes: {
            'r': 7,
            'fill': '#001DFF',
            'cursor': 'pointer',
            'rx': 5,
            'ry': 5
          }
        }, {
          tagName: 'path',
          selector: 'icon',
          attributes: {
            d: 'M 3 3 3 5 M 1 1 3 0 z',
            'fill': 'none',
            'stroke': 'red',
            'stroke-width': 1,
            'pointer-events': 'none',
            width: '10',
            height: '10'
          }
        }
      ],
      getPosition(view: any) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
      },
      setPosition: function (view: any, coordinates: any) {
        const model = view.model;
        model.resize(
          Math.max(coordinates.x - 10, 1),
          Math.max(coordinates.y - 10, 1)
        );
      },
      resetPosition: function (view : any) {
          var radius = view.options.defaultRadius || 0;
          view.model.attr(['body'], { rx: radius, ry: radius });
      }
    });
    // 2) creating a tools view
    var toolsView = new dia.ToolsView({
      name: 'basic-tools',
      tools: [resizeButton, connectButton, new ResizeTool({
        selector: "body"
      })],
    });

    // 3) attaching to an element view

    const rect = new shapes.standard.Rectangle({
      position: { x: 100, y: 30 },
      size: { width: 160, height: 60 },
      attrs: {
        body: {
          fill: 'red',
          stroke: '#000',
          strokeWidth: 1,
        },
        label: { text: 'Double-click to edit', fontSize: 14, fill: 'black' }
      },
    });
    var r = rect.clone();
    r.translate(200, 0);
    graph.addCell(r);
    graph.addCell(rect);
    rect.findView(paper).addTools(toolsView);

  */}

  ngOnChanges(changes: SimpleChanges): void {
    let backendUrl = changes['backendUrl'].currentValue;
    let roomId = changes['roomId'].currentValue;
    if (backendUrl && roomId) {
      this.initializeSocketConnection(backendUrl, roomId);
    }
  }

  initializeSocketConnection(url: string, roomId: string) {
    this.socketService.initializeSocket(url);
    this.boardService.initializeSocketHadler(roomId);
  }

}

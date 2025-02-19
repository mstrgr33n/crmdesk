import { ChangeDetectorRef, Component } from '@angular/core';
import { Point } from '../../shared/models/point.model';
import { BoardService } from '../../services/board.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFaceSmile, faEdit, faHandPointDown, faCopy, faComment, faNoteSticky } from '@fortawesome/free-regular-svg-icons';


@Component({
  selector: 'app-attribute-editor',
  imports: [FontAwesomeModule],
  templateUrl: './attribute-editor.component.html',
  styleUrl: './attribute-editor.component.css'
})
export class AttributeEditorComponent {
  showPanel:boolean = false;
  panelPosition: Point = { x: 0, y: 0 };
  buttons = [
    {
      name: 'Delete',
      icon: faEdit,
    },
    {
      name: 'Copy',
      icon: faCopy
    },
    {
      name: 'Paste',
      icon: faHandPointDown,
    },
    {
      name: 'Align Left',
      icon: faNoteSticky,
    },
    {
      name: 'Align Center',
      icon: faComment,
    },
    {
      name: 'Align Right',
      icon: faFaceSmile,
    }];

  constructor(
    private boardService: BoardService,
    private cdr: ChangeDetectorRef
  ) {
    this.boardService.onPanelPositionChange().subscribe((position:Point) => {
      this.panelPosition = position;
      this.cdr.detectChanges();
    });
    this.boardService.onPanelVisibilityChange().subscribe((visible: boolean) => {
      this.showPanel = visible;
      this.cdr.detectChanges();
    });
    
  }
}

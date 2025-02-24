import {dia } from '@joint/core';
import { JointTools } from '../models/jointtool.model';

export class PaperEventsMixin {
    initializeEventHandlers(paper: dia.Paper, tools: JointTools) {
        this.initializeBlankEvents(paper);
        this.initializeElementEvents(paper, tools);
        this.initializeLinkEvents(paper, tools);
        this.initializeCellEvents(paper);
      }
      
    private initializeBlankEvents(paper: dia.Paper) {
        paper.on('blank:pointerdown', (event: dia.Event) => {
            this.onBlankPointerDown(event);
        });
        paper.on('blank:pointerup', (event: dia.Event) => {
            this.onBlankPointerUp(event);
        });
        paper.on('blank:pointermove', (event: dia.Event) => {
            this.onBlankPointerMove(event);
        });
    }
    onBlankPointerMove(event: dia.Event) {
        throw new Error('Method not implemented.');
    }
    onBlankPointerUp(event: dia.Event) {
        throw new Error('Method not implemented.');
    }
    onBlankPointerDown(event: dia.Event) {
        throw new Error('Method not implemented.');
    }

    private initializeElementEvents(paper: dia.Paper, tools: JointTools) {
        paper.on('element:pointerdown', (elementView: dia.ElementView, event: dia.Event, x: number, y: number) => {
            this.onElementPointerDown(elementView, event, x, y);
        });
        paper.on('element:pointerup', (elementView: dia.ElementView, event: dia.Event, x: number, y: number) => {
            this.onElementPointerUp(elementView, event, x, y);
        });
        paper.on('element:pointermove', (elementView: dia.ElementView, event: dia.Event, x: number, y: number) => {
            this.onElementPointerMove(elementView, event, x, y);
        });
        paper.on('element:pointerdblclick', (elementView: dia.ElementView, event: dia.Event, x: number, y: number) => {
            this.onElementPointerDblClick(elementView, event, x, y);
        });
    }
    onElementPointerDblClick(elementView: dia.ElementView<dia.Element<dia.Element.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onElementPointerMove(elementView: dia.ElementView<dia.Element<dia.Element.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onElementPointerUp(elementView: dia.ElementView<dia.Element<dia.Element.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onElementPointerDown(elementView: dia.ElementView<dia.Element<dia.Element.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }

    private initializeLinkEvents(paper: dia.Paper, tools: JointTools) {
        paper.on('link:pointerdown', (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => {
            this.onLinkPointerDown(linkView, event, x, y);
        });
        paper.on('link:pointerup', (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => {
            this.onLinkPointerUp(linkView, event, x, y);
        });
        paper.on('link:pointermove', (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => {
            this.onLinkPointerMove(linkView, event, x, y);
        });
        paper.on('link:pointerdblclick', (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => {
            this.onLinkPointerDblClick(linkView, event, x, y);
        });
    }
    onLinkPointerDblClick(linkView: dia.LinkView<dia.Link<dia.Link.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onLinkPointerMove(linkView: dia.LinkView<dia.Link<dia.Link.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onLinkPointerUp(linkView: dia.LinkView<dia.Link<dia.Link.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onLinkPointerDown(linkView: dia.LinkView<dia.Link<dia.Link.Attributes, dia.ModelSetOptions>>, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }

    private initializeCellEvents(paper: dia.Paper) {
        paper.on('cell:pointerdown', (cellView: dia.CellView, event: dia.Event, x: number, y: number) => {
            this.onCellPointerDown(cellView, event, x, y);
        });
        paper.on('cell:pointerup', (cellView: dia.CellView, event: dia.Event, x: number, y: number) => {
            this.onCellPointerUp(cellView, event, x, y);
        });
        paper.on('cell:pointermove', (cellView: dia.CellView, event: dia.Event, x: number, y: number) => {
            this.onCellPointerMove(cellView, event, x, y);
        });
        paper.on('cell:pointerdblclick', (cellView: dia.CellView, event: dia.Event, x: number, y: number) => {
            this.onCellPointerDblClick(cellView, event, x, y);
        });
    }
    onCellPointerDblClick(cellView: dia.CellView, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onCellPointerMove(cellView: dia.CellView, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onCellPointerUp(cellView: dia.CellView, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }
    onCellPointerDown(cellView: dia.CellView, event: dia.Event, x: number, y: number) {
        throw new Error('Method not implemented.');
    }


}

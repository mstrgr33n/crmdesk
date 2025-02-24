import { v4 as uuid } from 'uuid';
import { Point } from './point.model';
import {
    shapes,
    connectionStrategies,
} from "@joint/core";

export class ShapesHelper {
    static createBaseShape(position: Point): any {
        const attrs = {
            body: {
                filter: {
                    name: 'dropShadow',
                    args: { dx: 3, dy: 3, blur: 5 }
                }
            },
            label: {
                text: 'Double-click to edit',
                style: { fontSize: 14, fill: 'black' }
            }
        };
        return {
            id: uuid(),
            position: position,
            attrs: attrs
        };
    }

    static createRectangle(position: Point, element: any | null = null) {
        let rect = null;
        let config = null;
        if (element) {
            rect = new shapes.standard.Rectangle(element.data);
            rect.id = element.id;
        } else {
            config = this.createBaseShape(position);
            config.size = { width: 160, height: 80 };
            rect = new shapes.standard.Rectangle(config);
        }
        return rect;
    }

    static createCircle(position: Point, element: any | null = null) {
        let circle  = null;
        const config = this.createBaseShape(position);
        config.size = { width: 150, height: 150 };
        if (element) {
            circle = new shapes.standard.Circle(element.data);
            circle.id = element.id;
        } else {
            circle = new shapes.standard.Circle(config);
        }
        return circle;
    }

    static createNotes(start: Point, element: any | null = null) {
        let notes = null;
        const config = this.createBaseShape(start);
        config.size = { width: 200, height: 100 };
        config.attrs = {
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
        };
        if (element) {
            notes = new shapes.standard.HeaderedRectangle(element.data);
            notes.id = element.id;
        } else {
            notes = new shapes.standard.HeaderedRectangle(config);
        }
        return notes;
    }

    static createText(position: Point, element: any | null = null) {
        let text = null;
        const config = this.createBaseShape(position);
        config.size = { width: 160, height: 60 };
        config.attrs = {
            body: {
              fill: 'none',
              stroke: 'none'
            },
            label: { text: 'Double-click to edit', style: { fontSize: 14, fill: 'black' } },
          };
          if (element) {
            text = new shapes.standard.TextBlock(element.data);
            text.id = element.id;
          } else {
            text = new shapes.standard.TextBlock(config);
          }
        return text;
    }

    static createEllipse(position: Point, element: any | null = null) {
        let ellipse = null;
        const config = this.createBaseShape(position);
        config.size = { width: 150, height: 100 };
        if (element) {
            ellipse = new shapes.standard.Ellipse(element.data);
            ellipse.id = element.id;
        } else {
            ellipse = new shapes.standard.Ellipse(config);
        }
        return ellipse;
    }
}
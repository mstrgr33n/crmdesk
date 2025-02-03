import { Point, Polyline } from "fabric";
import { v4 as uuidv4 } from 'uuid';

export class HelperFunctions {
    static drawArrow(start: Point, end: Point): Polyline {
        let points = this.getPolylinePoints(start, end);
    
        var pline = new Polyline(points, {
            id: uuidv4(),
            hasControls: false,
            hasBorders: false,
            hasRotatingPoint: false,
            hasTransform: true,
            fill: 'red',
            stroke: 'red',
            opacity: 0.8,
            strokeWidth: 1,
            originX: 'left',
            originY: 'top',
            selectable: true
        });
    
        return pline;
    }

    static getPolylinePoints(start: Point, end: Point): {x:number, y:number}[] {
        var angle = Math.atan2(end.y - start.y, end.x - start.x);
        var headlen = 4;
        var tox = end.x - (headlen) * Math.cos(angle);
        var toy = end.y - (headlen) * Math.sin(angle);
    
        var points = [
            {
                x: start.x,  // start point
                y: start.y
            }, {
                x: start.x - (headlen / 4) * Math.cos(angle - Math.PI / 2), 
                y: start.y - (headlen / 4) * Math.sin(angle - Math.PI / 2)
            },{
                x: tox - (headlen / 3) * Math.cos(angle - Math.PI / 2), 
                y: toy - (headlen / 4) * Math.sin(angle - Math.PI / 2)
            }, {
                x: tox - (headlen + 2) * Math.cos(angle - Math.PI / 2),
                y: toy - (headlen + 2) * Math.sin(angle - Math.PI / 2)
            },{
                x: tox + (headlen + 8) * Math.cos(angle), 
                y: toy + (headlen + 8) * Math.sin(angle)
            }, {
                x: tox - (headlen + 2) * Math.cos(angle + Math.PI / 2),
                y: toy - (headlen + 2) * Math.sin(angle + Math.PI / 2)
            }, {
                x: tox - (headlen / 5) * Math.cos(angle + Math.PI / 2),
                y: toy - (headlen / 4) * Math.sin(angle + Math.PI / 2)
            }, {
                x: start.x - (headlen / 4) * Math.cos(angle + Math.PI / 2),
                y: start.y - (headlen / 4) * Math.sin(angle + Math.PI / 2)
            },{
                x: start.x,
                y: start.y
            }
        ];

        return points;
    }
}
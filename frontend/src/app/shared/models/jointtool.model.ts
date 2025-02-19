import { dia, linkTools, elementTools } from '@joint/core';

export class JointTools {

    ResizeTool = elementTools.Control.extend({
        getPosition: function (view: any) {
            const model = view.model;
            const { width, height } = model.size();
            return { x: width, y: height };
        },
        setPosition: function (view: any, coordinates: any) {
            const model = view.model;
            model.resize(Math.max(coordinates.x, 1), Math.max(coordinates.y, 1));
        }
    });

    RadiusTool = elementTools.Control.extend({
        getPosition: function (view: any) {
            const model = view.model;
            const { width, height } = model.size();
            return { x: width, y: height };
        },
        setPosition: function (view: any, coordinates: any) {
            const model = view.model;
            model.resize(Math.max(coordinates.x, 1), Math.max(coordinates.y, 1));
        }
    });

    connectRight = new elementTools.Connect({
        x: "100%",
        y: "50%",
        markup: this.getMarkup(0)
    });


    connectBottom = new elementTools.Connect({
        x: "50%",
        y: "100%",
        markup: this.getMarkup(90)
    });

    connectTop = new elementTools.Connect({
        x: "50%",
        y: "0%",
        markup: this.getMarkup(270)
    });

    connectLeft = new elementTools.Connect({
        x: "0%",
        y: "50%",
        markup: this.getMarkup(180)
    });

    removeItemButton = new elementTools.Remove({
        magnet: 'body'
    });

    LinkTools = new dia.ToolsView({
        tools: [this.connectRight, this.connectLeft, this.connectTop, this.connectBottom, new this.ResizeTool({
            selector: "body"
        }), this.removeItemButton]
    });

    verticesTool = new linkTools.Vertices();
    segmentsTool = new linkTools.Segments();
    sourceArrowheadTool = new linkTools.SourceArrowhead();
    targetArrowheadTool = new linkTools.TargetArrowhead();
    sourceAnchorTool = new linkTools.SourceAnchor();
    targetAnchorTool = new linkTools.TargetAnchor();
    boundaryTool = new linkTools.Boundary();
    removeLinksButton = new linkTools.Remove({
        magnet: 'body',
        distance: 15
    });

    arrowTools = new dia.ToolsView({
        tools: [
            this.verticesTool, this.segmentsTool,
            this.targetArrowheadTool,
            this.sourceAnchorTool, this.targetAnchorTool,
            this.boundaryTool, this.removeLinksButton
        ]
    });

    jointTools = {
        LinkTools: this.LinkTools,
        ResizeTool: this.ResizeTool,
        RadiusTool: this.RadiusTool,
        ArrowTools: this.arrowTools
    };

    getMarkup(angle: number = 0) {
        return [
            {
                tagName: "circle",
                selector: "button",
                attributes: {
                    r: 7,
                    fill: "#4666E5",
                    stroke: "#FFFFFF",
                    cursor: "pointer"
                }
            },
            {
                tagName: "path",
                selector: "icon",
                attributes: {
                    transform: `rotate(${angle})`,
                    d: "M -4 -1 L 0 -1 L 0 -4 L 4 0 L 0 4 0 1 -4 1 z",
                    fill: "#FFFFFF",
                    stroke: "none",
                    "stroke-width": 2,
                    "pointer-events": "none"
                }
            }
        ];
    }


    getJointTools()  {
        return this.jointTools;
    }

}


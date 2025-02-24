import {
    shapes,
    connectionStrategies,
} from "@joint/core";

export const paperConfig: any = {
    el: null,
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
    model: null,
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
        },
    }),
    connectionStrategy: connectionStrategies.pinAbsolute
};
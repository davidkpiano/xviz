import { Machine, StateNode } from 'xstate'
import * as utils from 'xstate/lib/graph'
import { Graph } from './Graph'
import { EdgeEndpoints } from './module'
import interact, { InteractEvent } from 'interactjs'

console.log(interact)

const pedestrianStates = {
  initial: 'walk',
  states: {
    walk: {
      on: {
        PED_COUNTDOWN: 'wait'
      }
    },
    wait: {
      on: {
        PED_COUNTDOWN: 'stop'
      }
    },
    stop: {}
  }
}

const lightMachine = Machine({
  key: 'light',
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: 'yellow',
        POWER_OUTAGE: 'red'
      }
    },
    yellow: {
      on: {
        TIMER: 'red',
        POWER_OUTAGE: 'red'
      }
    },
    red: {
      on: {
        TIMER: 'green',
        POWER_OUTAGE: 'red'
      },
      ...pedestrianStates
    }
  }
})

const handle = `<div data-xviz-handle></div>`

function renderStates(state: StateNode): string {
  return Object.keys(state.states)
    .map(key => {
      const subState = state.states[key]

      if (!subState.initial) {
        return `<div data-xviz-id="${subState.id}">${handle}</div>`
      }

      return `
    <div data-xviz-id="${subState.id}">
      ${renderStates(subState)}
      ${handle}
    </div>`
    })
    .join('')
}

console.log(renderStates(lightMachine))

document.write(`<section>${renderStates(lightMachine)}</section>`)

setTimeout(() => {
  function dragMoveListener(event: InteractEvent) {
    const target: HTMLElement = event.target
    // keep the dragged position in the data-x/data-y attributes
    const x = (parseFloat(target.getAttribute('data-x')!) || 0) + event.dx
    const y = (parseFloat(target.getAttribute('data-y')!) || 0) + event.dy

    // translate the element
    target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

    // update the posiion attributes
    target.setAttribute('data-x', x + '')
    target.setAttribute('data-y', y + '')
    // g.update();
  }

  interact('[data-xviz-id]').draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    restrict: {
      restriction: 'parent',
      endOnly: true,
      elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    },
    // enable autoScroll
    autoScroll: true,

    // call this function on every dragmove event
    onmove: dragMoveListener,
    // call this function on every dragend event
    onend: function(event) {
      const { target } = event
      const textEl = event.target.querySelector('p')

      textEl &&
        (textEl.textContent =
          'moved a distance of ' +
          Math.sqrt(
            (Math.pow(event.pageX - event.x0, 2) + Math.pow(event.pageY - event.y0, 2)) | 0
          ).toFixed(2) +
          'px')

      g.update()
    }
  })
})

const bottom = (bounds: XViz.Bounds): number => bounds.top + bounds.height
const right = (bounds: XViz.Bounds): number => bounds.left + bounds.width
const distance = ([x1, y1]: XViz.Position2D, [x2, y2]: XViz.Position2D): number =>
  Math.hypot(x1 - x2, y1 - y2)
const center = (rect: XViz.Bounds): XViz.Position2D => [
  rect.left + rect.width / 2,
  rect.top + rect.height / 2
]

function shortestEndpoints(
  sourceBounds: XViz.Bounds,
  targetBounds: XViz.Bounds
): [XViz.Position2D, XViz.Position2D] {
  const [x1, y1] = center(sourceBounds)
  const [x2, y2] = center(targetBounds)
  return [[x1, y1], [x2, y2]]
  // const radialAngle1 = Math.atan(sourceBounds.width / sourceBounds.height);
  // const radialAngle2 = Math.atan(targetBounds.height / targetBounds.width);
  // const theta1 = Math.atan(Math.abs(x1 - x2) / Math.abs(y1 - y2));
  // const theta2 = Math.atan(Math.abs(y1 - y2) / Math.abs(x1 - x2));
  // const m = (y2 - y1) / (x2 - x1);
  // // tslint:disable-next-line:one-variable-per-declaration
  // let ex1, ex2, ey1, ey2;

  // if (radialAngle1 > theta1) {
  //   ey1 = y1 < y2 ? bottom(sourceBounds) : sourceBounds.top;
  //   // ex1 = x1 === x2 ? x1 : x1 - sourceBounds.height / 2 * Math.tan(theta1);
  //   ex1 = m ? (bottom(sourceBounds) + sourceBounds.height / 2) / m + x1 : x1;
  // } else {
  //   // ey1 = y1 === y2 ? y1 : y1 + sourceBounds.width / 2 * Math.tan(theta1);
  //   ey1 = m ? (right(sourceBounds) + sourceBounds.width / 2) / m + y1 : y1;
  //   ex1 = x1 < x2 ? right(sourceBounds) : sourceBounds.left;
  // }

  // if (radialAngle2 > theta2) {
  //   ex2 = x2 > x1 ? targetBounds.left : right(targetBounds);
  //   ey2 = y2 === y1 ? y2 : y2 + targetBounds.width / 2 * Math.tan(theta2);
  // } else {
  //   ey2 = y2 > y1 ? targetBounds.top : bottom(targetBounds);
  //   ex2 = x2 === x1 ? x2 : x2 + targetBounds.height / 2 * Math.tan(theta2);
  // }

  // console.log(ex1, ey1, ex2, ey2, theta1, theta2);

  // return [[ex1, ey1], [ex2, ey2]];
}

export class GraphNode {
  public id: string
  public inEdges: GraphEdge[] = []
  public outEdges: GraphEdge[] = []

  constructor(
    config: XViz.NodeConfig,
    public bounds: XViz.Bounds,
    public handles: Record<string, XViz.Bounds>
  ) {
    this.id = config.id
  }

  get endpoints() {
    return this.outEdges.map(edge => ({
      edge,
      endpoints: shortestEndpoints(this.bounds, edge.target.bounds)
    }))
  }
}

export class GraphEdge {
  public bounds: XViz.Bounds

  constructor(public source: GraphNode, public target: GraphNode, public config?: any) {
    source.outEdges.push(this)
    target.inEdges.push(this)
  }
}

;(window as any).Graph = Graph

console.log(
  utils.getEdges(lightMachine).map(edge => ({
    source: edge.source.id,
    target: edge.target.id
  }))
)

const g = new Graph(
  {},
  utils.getEdges(lightMachine).map(edge => ({
    source: edge.source.id,
    target: edge.target.id
  }))
)
g.render()
console.log(g)

export namespace XViz {
  export interface Position2D {
    top: number
    left: number
  }
  export interface Bounds extends Position2D {
    height: number
    width: number
  }

  export enum Side {
    Top,
    Right,
    Bottom,
    Left
  }

  export interface Handle {
    type: 'input' | 'output'
    side: Side
    id: string
  }

  export interface NodeConfig {
    id: string
    data?: any
  }

  export interface Node extends NodeConfig {
    bounds: Bounds
    handles: Handle[]
  }

  export interface EdgeConfig {
    id?: string
    source: string
    target: string
    data?: any
  }

  export interface GraphConfig {
    selector?: (parentElement: Element) => Element[]
    parent?: Element
    // renderNode: (node: GraphNode) => Element;
    // renderEdge: (edge: GraphEdge) => Element;
    // renderGraph: (nodeElements: Element[], edgeElements: Element[]) => Element;
  }
}

import { Machine, StateNode } from 'xstate'
import * as utils from 'xstate/lib/graph'

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

document.write(renderStates(lightMachine))

export class GraphNode {
  public id: string

  constructor(
    config: XViz.NodeConfig,
    public bounds: XViz.Bounds,
    public handles: XViz.Position2D[]
  ) {
    this.id = config.id
    if (!this.handles.length) {
      this.handles = [center(bounds)]
    }
  }
}

export class GraphEdge {
  public bounds: XViz.Bounds

  constructor(
    public config: XViz.EdgeConfig,
    public sourcePos: XViz.Position2D,
    public targetPos: XViz.Position2D
  ) {
    this.bounds = boundsFromPositions(sourcePos, targetPos)
  }
}

const selector = (parentElement: Element): Element[] => {
  const elements = parentElement.querySelectorAll(`[data-xviz-id]`)
  return Array.from(elements)
}

const relativeBounds = (parentRect: XViz.Bounds, childRect: XViz.Bounds): XViz.Bounds => ({
  top: childRect.top - parentRect.top,
  left: childRect.left - parentRect.left,
  width: childRect.width,
  height: childRect.height
})

const center = (rect: XViz.Bounds): XViz.Position2D => ({
  top: rect.top + rect.height / 2,
  left: rect.left + rect.width / 2
})

const boundsFromPositions = (posA: XViz.Position2D, posB: XViz.Position2D): XViz.Bounds => ({
  left: Math.min(posA.left, posB.left),
  top: Math.min(posA.top, posB.top),
  width: Math.abs(posA.left - posB.left),
  height: Math.abs(posA.top - posB.top)
})

export class Graph {
  public selector: (parentElement: Element) => Element[]
  public parent: Element
  public bounds: XViz.Bounds
  public nodes: Record<string, GraphNode> = {}
  public edges: GraphEdge[]

  constructor(public config: XViz.GraphConfig, edges: XViz.EdgeConfig[]) {
    this.selector = config.selector || selector
    this.parent = config.parent || document.body

    const elements = this.selector(this.parent)
    this.bounds = this.parent.getBoundingClientRect()

    elements.forEach(element => {
      const id = element.getAttribute('data-xviz-id') as string
      const node = new GraphNode(
        { id },
        relativeBounds(this.bounds, element.getBoundingClientRect()),
        Array.from(element.children)
          .filter(child => child.matches(' [data-xviz-handle]'))
          .map(handleElement =>
            center(relativeBounds(this.bounds, handleElement.getBoundingClientRect()))
          )
      )
      this.nodes[id] = node
    })

    this.edges = edges.map(edge => {
      return new GraphEdge(
        edge,
        this.nodes[edge.source].handles[0],
        this.nodes[edge.target].handles[0]
      )
    })

    console.log(this.nodes, this.edges)
  }

  // update(elements: Element[]): void {}
  render(): void {
    const { edges } = this
    const els = edges.map(edge => {
      const str = `

      <path stroke-width="2" stroke="blue" fill="none" d="M${edge.sourcePos.left},${
        edge.sourcePos.top
      } C${edge.sourcePos.left + 100},${edge.sourcePos.top} ${edge.targetPos.left - 100},${
        edge.targetPos.top
      } ${edge.targetPos.left},${edge.targetPos.top}"></path>
      `.trim()
      return str
    })

    this.parent.innerHTML += `<svg style="position:absolute;top:0;left:0;"width="100%" height="100%" viewBox="0 0 ${
      this.bounds.width
    } ${this.bounds.height}"
    xmlns="http://www.w3.org/2000/svg">
    ${els.join('\n')}
    </svg>
    `
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

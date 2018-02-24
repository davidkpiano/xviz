import { Machine, StateNode, State } from 'xstate'
import * as utils from 'xstate/lib/graph'
import { render } from './cy.js'
import { EventObject, StateValue } from '../../xstate/lib/types.js'

const lightMachineConfig = {
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: 'yellow',
        EMERGENCY: 'yellow'
      }
    },
    yellow: {
      on: {
        TIMER: 'red'
      }
    },
    red: {
      on: {
        TIMER: 'green'
      },
      onEntry: 'startCountdown',
      onExit: 'stopCountdown',
      initial: 'walk',
      states: {
        walk: {
          on: {
            PED_TIMER: 'wait'
          }
        },
        wait: {
          on: {
            PED_TIMER: 'stop'
          }
        },
        stop: {}
      }
    }
  }
}

const config = {
  key: 'light',
  parallel: true,
  states: {
    ns: lightMachineConfig,
    ew: lightMachineConfig
  }
}

const parallelMachine = Machine({
  parallel: true,
  key: 'p',
  states: {
    a: {
      initial: 'a1',
      states: {
        a1: {
          on: { 2: 'a2', 3: 'a3' }
        },
        a2: {
          on: { 3: 'a3', 1: 'a1' }
        },
        a3: {}
      }
    },
    b: {
      initial: 'b1',
      states: {
        b1: {
          on: { 2: 'b2', 3: 'b3' }
        },
        b2: {
          on: { 3: 'b3', 1: 'b1' }
        },
        b3: {}
      }
    }
  }
})

const machine = Machine(config)

const _nodes = utils.getNodes(machine)

const nodes = utils
  .getNodes(machine)
  .map(node => {
    const entryLabel = node.onEntry ? `\nentry / ${node.onEntry.join(',')}` : ''
    const exitLabel = node.onExit ? `\nexit / ${node.onExit.join(',')}` : ''
    return [
      {
        data: {
          id: node.id,
          label: node.key,
          parent: node.parent ? node.parent.id : undefined,
          parallel: node.parallel
        }
      },
      node.initial && {
        data: {
          id: node.id + ':initial',
          parent: node.id,
          label: 'initial',
          initial: true
        }
      },
      node.onEntry || node.onExit
        ? {
            data: {
              id: node.id + ':actions',
              label: entryLabel + exitLabel,
              parent: node.id
            },
            classes: 'actions'
          }
        : false
    ]
  })
  .reduce((a, b) => a.concat(b), [])
  .concat({
    data: {
      id: machine.id,
      label: machine.id,
      parent: '',
      parallel: machine.parallel
    }
  })
const edges: any[] = utils.getEdges(machine).map(edge => ({
  data: {
    id: `${edge.source.id}:${edge.target.id}::${edge.event}`,
    source: edge.source.id,
    target: edge.target.id,
    label: edge.event + edge.cond
  }
}))
console.log(
  _nodes.map(
    node =>
      node.initial
        ? {
            data: {
              id: `${node.id}:initial`,
              source: `${node.id}:initial`,
              target: `${node.id}.${node.initial}`
            }
          }
        : false
  )
)
edges.push(
  ..._nodes
    .map(
      node =>
        node.initial
          ? {
              data: {
                source: `${node.id}:initial`,
                target: `${node.id}.${node.initial}`
              },
              className: 'initial'
            }
          : false
    )
    .filter(Boolean)
)
const cy = render(nodes, edges)

;(window as any).cy = cy

console.log(cy.nodes().positions(() => true))

function getIds(stateValue: StateValue): string[] {
  if (typeof stateValue === 'string') return [stateValue]

  return Object.keys(stateValue)
    .map(key => {
      return getIds(stateValue[key]).map(id => key + '.' + id)
    })
    .reduce((a, b) => a.concat(b), [])
}

class Interpreter {
  state: State

  constructor(public machine: StateNode) {
    this.state = machine.initialState
  }

  public send(event: EventObject): State {
    const prevState = this.state
    this.state = this.machine.transition(prevState, event)

    cy.$('.active').removeClass('active')

    const prevIds = getIds(prevState.value).map(id => `${this.machine.id}.${id}`)
    const nextIds = getIds(this.state.value).map(id => `${this.machine.id}.${id}`)

    nextIds.forEach(id => {
      cy.getElementById(id).addClass('active')

      // prevIds.forEach(prevId => {
      //   console.log(`${prevId}:${id}::${event}`);
      //   cy.getElementById(`${prevId}:${id}::initial`).addClass('active');
      //   cy.getElementById(`${prevId}:${id}::${event}`).addClass('active');
      // });
    })

    return this.state
  }
}

;(window as any).interpreter = new Interpreter(machine)

const state = ((window as any).state = {
  selected: new Set<string>()
})

cy.on('tap', 'node', (e: cytoscape.EventObject) => {
  console.log(e.target.id())
  state.selected.add(e.target.id())
  e.target.addClass('active')
})

cy.on('tap', 'edge', (e: cytoscape.EventObject) => {
  console.log(e.target.id())
  state.selected.add(e.target.id())
  e.target.addClass('active')
})

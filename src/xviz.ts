import { Machine } from 'xstate'
import * as utils from 'xstate/lib/graph'
import { render } from './cy.js'

const config = {
  key: 'light',
  parallel: true,
  states: {
    ns: {
      initial: 'green',
      states: {
        green: {
          on: {
            TIMER: 'yellow'
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
    },
    ew: {
      initial: 'green',
      states: {
        green: {
          on: {
            TIMER: 'yellow'
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
              parent: node.id
            },
            classes: 'actions'
          }
        : false,
      node.onEntry && {
        data: {
          label: entryLabel,
          parent: node.id + ':actions'
        },
        classes: 'entry action'
      },
      node.onExit && {
        data: {
          label: exitLabel,
          parent: node.id + ':actions'
        },
        classes: 'exit action'
      }
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
    id: `${edge.source.id}:${edge.target.id}`,
    source: edge.source.id,
    target: edge.target.id,
    label: edge.event
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
              target: `${node.id}.${node.initial}`,
              label: 'yea'
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

;(window as any).cy = render(nodes, edges)

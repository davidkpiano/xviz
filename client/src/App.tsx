import * as React from 'react';
import './App.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { Machine, StateNode, State } from 'xstate';
import * as utils from 'xstate/lib/graph';
import { render } from './cy.js';
import { StateValue, EventObject, EventType, Action } from '../../../xstate/lib/types';
import { Field } from './Field';
import { EventButton } from './EventButton';
import * as cn from 'classnames';

function getQueryVariable(variable: string): string | undefined {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) === variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  return undefined;
}

const galleryMachine = Machine({
  initial: 'start',
  states: {
    start: {
      on: {
        SEARCH: {
          loading: {
            cond: function canDo() {
              return true;
            }
          }
        }
      }
    },
    loading: {
      onEntry: ['search'],
      on: {
        SEARCH_SUCCESS: {
          gallery: {
            actions: ['updateItems']
          }
        },
        SEARCH_FAILURE: 'error',
        CANCEL_SEARCH: 'gallery'
      }
    },
    error: {
      on: {
        SEARCH: 'loading'
      }
    },
    gallery: {
      on: {
        SEARCH: 'loading',
        SELECT_PHOTO: 'photo'
      }
    },
    photo: {
      onEntry: ['setPhoto'],
      on: {
        EXIT_PHOTO: 'gallery'
      }
    }
  }
});

function getIds(stateValue: StateValue): string[] {
  if (typeof stateValue === 'string') {
    return [stateValue];
  }

  return Object.keys(stateValue)
    .map(key => {
      return getIds(stateValue[key]).map(id => key + '.' + id);
    })
    .reduce((a, b) => a.concat(b), []);
}

interface AppState {
  machine: StateNode;
  currentState: State;
  editorState: 'closed' | 'open';
  editorValue: string;
  rawMachine: string;
  tab: 'editor' | 'info';
}

class Interpreter {
  state: State;

  constructor(public machine: StateNode, public cy: cytoscape.Core) {
    this.setState(machine.initialState);
  }

  setState(state: State) {
    this.cy.$('.active').removeClass('active');
    this.cy.$(`.highlight`).removeClass('highlight');
    this.state = state;

    const nextIds = getIds(this.state.value).map(id => `${this.machine.id}.${id}`);

    nextIds.forEach(id => {
      this.cy.getElementById(id).addClass('active');
    });

    return this.state;
  }

  public send(event: EventObject | EventType): State {
    const prevState = this.state;
    console.log(prevState, event);
    return this.setState(this.machine.transition(prevState, event));
  }
}

function getActionType(action: Action): string {
  if (typeof action === 'object') {
    return `${action.type}`;
  }

  return `${action}`;
}

class App extends React.Component<{}, AppState> {
  cy: cytoscape.Core;
  interpreter: Interpreter;
  element: Element;

  constructor(props: {}) {
    super(props);

    let rawMachine = getQueryVariable('machine');
    rawMachine = rawMachine
      ? JSON.stringify(JSON.parse(rawMachine), null, 2)
      : JSON.stringify(galleryMachine.config, null, 2);

    const machine = Machine(JSON.parse(rawMachine));

    this.state = {
      machine: machine,
      currentState: machine.initialState,
      editorState: 'closed' as 'closed' | 'open',
      editorValue: rawMachine,
      rawMachine,
      tab: 'editor' as 'editor' | 'info'
    };
  }

  get events() {
    return this.state.machine.events;
  }
  toggleEditor() {
    this.setState({
      editorState: {
        closed: 'open',
        open: 'closed'
      }[this.state.editorState] as 'closed' | 'open'
    });
  }
  attachElement(element: Element | null) {
    if (!element || this.interpreter) {
      return;
    }

    const { machine } = this.state;

    const nodes = utils.getNodes(machine);

    const graphNodes = [machine, ...nodes]
      .map(node => {
        const entryLabel = node.onEntry ? `\nentry / ${node.onEntry.join(',')}` : '';
        const exitLabel = node.onExit ? `\nexit / ${node.onExit.join(',')}` : '';
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
        ];
      })
      .reduce((a, b) => a.concat(b), []);

    const edges = utils.getEdges(machine);

    console.log(edges);

    const graphEdges: object[] = edges.map(edge => ({
      data: {
        id: `${edge.source.id}:${edge.target.id}::${edge.event}`,
        source: edge.source.id,
        target: edge.target.id,
        event: edge.event,
        label:
          edge.event +
          (edge.cond ? ` [${edge.cond.name || edge.cond.toString()}]` : '') +
          (edge.actions.length ? `\n / ${edge.actions.join(', ')}` : '')
      }
    }));

    graphEdges.push(
      ...([machine, ...nodes]
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
        .filter(Boolean) as object[])
    );

    const cy = render(element, graphNodes, graphEdges);
    this.cy = cy;
    this.attachInterpreter();
  }
  attachInterpreter() {
    this.interpreter = new Interpreter(this.state.machine, this.cy);
  }
  updateMachine() {
    this.setState(
      {
        machine: Machine(JSON.parse(this.state.rawMachine))
      },
      () => {
        this.attachInterpreter();
      }
    );
  }
  handleEvent(eventType: EventType): void {
    this.interpreter.send(eventType);
    this.setState({
      currentState: this.interpreter.state
    });
  }
  handleEventMouseOver(eventType: EventType): void {
    const { currentState } = this.state;
    const ids = this.state.machine.getStateNodes(currentState).map(stateNode => stateNode.id);

    ids.forEach(id => {
      const cyEdges = this.cy.$(`edge[source = '${id}'][event = '${eventType}']`);
      cyEdges.addClass('highlight');

      cyEdges.forEach(cyEdge => {
        this.cy.getElementById(cyEdge.data('target')).addClass('highlight');
      });
    });
  }
  handleEventMouseOut(eventType: EventType): void {
    this.cy.$(`.highlight`).removeClass('highlight');
  }
  renderEditor() {
    return (
      <div className="ui-editor">
        <CodeMirror
          className="ui-codemirror"
          value={this.state.rawMachine}
          options={{
            mode: 'json',
            theme: 'material',
            lineNumbers: true
          }}
          onChange={(editor, data, value) => {
            this.setState({
              editorValue: value
            });
          }}
        />
        <button
          className="ui-button -save"
          onClick={() => {
            const { editorValue } = this.state;

            // tslint:disable-next-line:no-eval
            window.location.href = `${location.pathname}?machine=${encodeURIComponent(
              // tslint:disable-next-line:no-eval
              JSON.stringify(eval('var tmp = ' + editorValue + '; tmp'))
            )}`;
          }}
        >
          Save (reload)
        </button>
      </div>
    );
  }
  renderViz() {
    return (
      <div className="ui-viz">
        <div id="cy" ref={el => this.attachElement(el)} />
      </div>
    );
  }
  render() {
    const { currentState, machine, tab } = this.state;
    return (
      <div className="ui-app">
        {this.renderViz()}
        <div className="ui-panels">
          <div className="ui-tabs">
            <button
              className={cn('ui-tab', { '-visible': tab === 'info' })}
              onClick={_ => this.setState({ tab: 'info' })}
            >
              Info
            </button>
            <button
              className={cn('ui-tab', { '-visible': tab === 'editor' })}
              onClick={_ => this.setState({ tab: 'editor' })}
            >
              Editor
            </button>
          </div>
          <div className="ui-panel -info" style={{ display: tab === 'info' ? undefined : 'none' }}>
            <Field label="Events">
              {this.events.map(event => {
                return (
                  <EventButton
                    key={event}
                    name={event}
                    onClick={eventType => this.handleEvent(eventType)}
                    onMouseOver={eventType => this.handleEventMouseOver(eventType)}
                    onMouseOut={eventType => this.handleEventMouseOut(eventType)}
                    disabled={
                      !machine
                        .getStateNodes(currentState)
                        .some((stateNode: StateNode) => stateNode.handles(event))
                    }
                  />
                );
              })}
            </Field>
            <Field label="Current state">
              <pre>{JSON.stringify(currentState.value, null, 2)}</pre>
            </Field>
            <Field label="Actions">
              {currentState.actions.length ? (
                <ul className="ui-actions">
                  {currentState.actions.map(action => (
                    <li key={getActionType(action)}>{getActionType(action)}</li>
                  ))}
                </ul>
              ) : (
                <em>No actions</em>
              )}
            </Field>
          </div>

          <div
            className="ui-panel -editor"
            style={{ display: tab === 'editor' ? undefined : 'none' }}
          >
            {this.renderEditor()}
          </div>
        </div>
      </div>
    );
  }
}

export default App;

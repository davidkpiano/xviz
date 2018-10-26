import React from "react";
import styled from "styled-components";
import { interpret } from "xstate/lib/interpreter";
import { Machine as _Machine, StateNode, State, EventObject } from "xstate";
import { getEdges } from "xstate/lib/graph";
import { StateChartNode } from "./StateChartNode";

const StyledViewTabs = styled.ul`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  margin: 0;
  padding: 0;
  height: 1rem;

  > li {
    padding: 0 0.5rem;
    text-align: center;
    list-style: none;
  }
`;

const StyledStateChart = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
  grid-template-rows: auto;
  font-family: sans-serif;
  font-size: 10px;
`;

const StyledField = styled.div`
  > label {
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.5em;
    font-weight: bold;
  }
`;

interface FieldProps {
  label: string;
  children: any;
}
function Field({ label, children }: FieldProps) {
  return (
    <StyledField>
      <label>{label}</label>
      {children}
    </StyledField>
  );
}

interface StateChartProps {
  machine: StateNode;
}

export class StateChart extends React.Component<StateChartProps> {
  state = {
    current: this.props.machine.initialState,
    preview: undefined,
    view: "definition" // or 'state'
  };
  service = interpret(this.props.machine).onTransition(current => {
    this.setState({ current, preview: undefined });
  });
  componentDidMount() {
    this.service.start();
  }
  renderView() {
    const { view, current } = this.state;
    const { machine } = this.props;

    switch (view) {
      case "definition":
        return (
          <pre
            className="language-json"
            style={{
              position: "absolute",
              width: "100%",
              background: "transparent"
            }}
          >
            {JSON.stringify(machine.config, null, 2)}
          </pre>
        );
      case "state":
        return (
          <div>
            <pre
              className="language-json"
              style={{
                position: "absolute",
                width: "100%",
                background: "transparent"
              }}
            >
              <Field label="Value">
                <pre>{JSON.stringify(current.value, null, 2)}</pre>
              </Field>
              <Field label="Actions">
                {current.actions.length ? (
                  <ul>
                    {current.actions.map(action => {
                      return <li key={action.type}>{action.type}</li>;
                    })}
                  </ul>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="Context">
                {current.context !== undefined ? (
                  <pre>{JSON.stringify(current.context, null, 2)}</pre>
                ) : (
                  "-"
                )}
              </Field>
            </pre>
          </div>
        );
      default:
        return null;
    }
  }
  render() {
    const { machine } = this.props;
    const { current, preview } = this.state;

    const edges = getEdges(machine);

    console.log(edges);

    const stateNodes = machine.getStateNodes(current);
    const events = new Set();

    stateNodes.forEach(stateNode => {
      const potentialEvents = Object.keys(stateNode.on);

      potentialEvents.forEach(event => {
        const transitions = stateNode.on[event];

        transitions.forEach(transition => {
          if (transition.target !== undefined) {
            events.add(event);
          }
        });
      });
    });

    return (
      <section>
        <StyledStateChart>
          <div>
            <StateChartNode
              stateNode={this.props.machine}
              current={current}
              preview={preview}
              onEvent={this.service.send.bind(this)}
              onPreEvent={event =>
                this.setState({ preview: this.service.nextState(event) })
              }
              onExitPreEvent={() => this.setState({ preview: undefined })}
              toggled={true}
            />
          </div>
          <div style={{ overflow: "scroll" }}>
            <StyledViewTabs>
              {["definition", "state"].map(view => {
                return (
                  <li onClick={() => this.setState({ view })} key={view}>
                    {view}
                  </li>
                );
              })}
            </StyledViewTabs>
            {this.renderView()}
          </div>
        </StyledStateChart>
      </section>
    );
  }
}

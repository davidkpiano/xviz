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

interface Point {
  x: number;
  y: number;
}

function center(rect: ClientRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

interface StateChartProps {
  machine: StateNode;
}

interface StateChartState {
  current: State<any, any>;
  preview?: State<any, any>;
  previewEvent?: string;
  view: string; //"definition" | "state";
}

export class StateChart extends React.Component<
  StateChartProps,
  StateChartState
> {
  state: StateChartState = {
    current: this.props.machine.initialState,
    preview: undefined,
    previewEvent: undefined,
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
    const { current, preview, previewEvent } = this.state;

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
                this.setState({
                  preview: this.service.nextState(event),
                  previewEvent: event
                })
              }
              onExitPreEvent={() =>
                this.setState({ preview: undefined, previewEvent: undefined })
              }
              toggled={true}
            />
            <svg
              width="100%"
              height="100%"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                // @ts-ignore
                "--color": "gray",
                overflow: "visible",
                pointerEvents: "none"
              }}
            >
              <defs>
                <marker
                  id="marker"
                  markerWidth="4"
                  markerHeight="4"
                  refX="2"
                  refY="2"
                  markerUnits="strokeWidth"
                  orient="auto"
                >
                  <path d="M0,0 L0,4 L4,2 z" fill="var(--color-border)" />
                </marker>
                <marker
                  id="marker-preview"
                  markerWidth="4"
                  markerHeight="4"
                  refX="2"
                  refY="2"
                  markerUnits="strokeWidth"
                  orient="auto"
                >
                  <path d="M0,0 L0,4 L4,2 z" fill="var(--color-primary)" />
                </marker>
              </defs>
              {edges.map(edge => {
                const elEvent = document.querySelector(
                  `[data-id="${edge.source.id}:${edge.event}"]`
                );
                const elSource = document.querySelector(
                  `[data-id="${edge.source.id}"]`
                );
                const elTarget = document.querySelector(
                  `[data-id="${edge.target.id}"]`
                );

                if (!elEvent || !elTarget || !elSource) {
                  return;
                }

                const sourceRect = elSource.getBoundingClientRect();
                const eventRect = elEvent.getBoundingClientRect();
                const targetRect = elTarget.getBoundingClientRect();
                const eventCenterPt = center(eventRect);
                const targetCenterPt = center(targetRect);

                const start = {
                  x: eventRect.right - 5,
                  y: eventCenterPt.y + 1
                };
                const midpoints: Point[] = [];
                const end = { x: targetRect.left - 4, y: targetRect.bottom };

                if (start.y > targetRect.top && start.y < targetRect.bottom) {
                  end.y = start.y;
                  if (start.x > end.x) {
                    start.x = eventRect.right - 8;
                    start.y = eventCenterPt.y + 4;
                    midpoints.push({
                      x: start.x,
                      y: sourceRect.bottom + 10
                    });
                    midpoints.push({
                      x: targetRect.right - 10,
                      y: targetRect.bottom + 10
                    });
                    end.x = targetRect.right - 10;
                    end.y = targetRect.bottom + 4;
                  }
                }

                const pathMidpoints = midpoints
                  .map(midpoint => {
                    return `L ${midpoint.x},${midpoint.y}`;
                  })
                  .join(" ");

                const isHighlighted =
                  edge.event === previewEvent &&
                  preview &&
                  preview.matches(edge.target.path.join("."));

                return (
                  <path
                    d={`M${start.x} ${start.y - 1} ${pathMidpoints} ${end.x} ${
                      end.y
                    }`}
                    stroke={
                      isHighlighted
                        ? "var(--color-primary)"
                        : "var(--color-border)"
                    }
                    strokeWidth={2}
                    fill="none"
                    markerEnd={
                      isHighlighted ? `url(#marker-preview)` : `url(#marker)`
                    }
                  />
                );
              })}
            </svg>
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

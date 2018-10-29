import React, { Component } from "react";
import logo from "./xstate-logo.svg";
import appStyles from "./App.module.scss";

import { StateChart } from "./StateChart";
import { Machine, MachineOptions } from "xstate";

interface OmniContext {
  count: number;
}
const omniMachine = Machine<OmniContext>(
  {
    id: "omni",
    initial: "compound",
    context: {
      count: 0
    },
    states: {
      compound: {
        type: "compound",
        initial: "deep",
        on: {
          PARALLEL: "parallel"
        },
        states: {
          deep: {
            type: "compound",
            initial: "first",
            states: {
              first: {
                type: "compound",
                initial: "one",
                states: {
                  one: {
                    on: {
                      EVENT1: "two",
                      EVENT2: [
                        {
                          target: "three",
                          cond: ctx => ctx.count > 0,
                          actions: [
                            "firstAction",
                            { type: "secondAction", foo: "bar" }
                          ]
                        },
                        { target: "one" }
                      ]
                    }
                  },
                  two: {
                    onEntry: ["entry1", { type: "entry2" }],
                    onExit: ["exit1", { type: "exit2" }],
                    on: {
                      EVENT3: "one"
                    }
                  },
                  three: {
                    type: "final"
                  }
                },
                on: {
                  EVENT4: "second",
                  GO_INSIDE: ".three"
                }
              },
              second: {
                type: "final"
              },
              shallowHist: {
                type: "history",
                history: "shallow"
              },
              deepHist: {
                type: "history",
                history: "deep"
              }
            }
          }
        }
      },
      parallel: {
        type: "parallel",
        states: {
          left: {
            type: "compound",
            states: {
              one: {},
              two: {},
              three: { type: "final" }
            }
          },
          middle: {
            type: "compound",
            states: {
              one: {
                after: {
                  1000: "two"
                }
              },
              two: {
                after: {
                  "2000": [
                    {
                      target: "three",
                      cond: (ctx: OmniContext) => ctx.count === 3
                    },
                    {
                      target: "four",
                      cond: (ctx: OmniContext) => ctx.count === 4
                    },
                    { target: "one" }
                  ]
                }
              },
              three: {
                after: {
                  1000: { target: "one", cond: ctx => ctx.count === -1 },
                  2000: "four"
                }
              },
              four: { type: "final" }
            }
          },
          right: {
            type: "compound",
            states: {
              transient: {
                on: {
                  "": "one"
                }
              },
              transientCond: {
                on: {
                  "": [
                    { target: "two", cond: ctx => ctx.count === 2 },
                    { target: "three", cond: ctx => ctx.count === 3 },
                    { target: "one" }
                  ]
                }
              },
              one: {},
              two: {},
              three: {},
              four: { type: "final" }
            }
          }
        }
      }
    }
  },
  {
    guards: {} as Record<string, any>
  } as MachineOptions<OmniContext, any>
);

var foo = `const lightMachine = Machine({
  id: "light",
  initial: "green",
  states: {
    green: {
      on: {
        TIMER: "yellow"
      }
    },
    yellow: {
      on: {
        TIMER: "red"
      }
    },
    red: {
      onDone: "green",
      initial: "walk",
      states: {
        walk: {
          on: {
            PED_WAIT: "wait"
          }
        },
        wait: {
          on: {
            PED_STOP: "stop"
          }
        },
        stop: {
          after: {
            1000: "stopFinal"
          }
        },
        stopFinal: {
          type: "final"
        }
      }
    }
  }
});`;

class App extends Component {
  render() {
    return (
      <div className={appStyles.app}>
        <StateChart machine={omniMachine} />
      </div>
    );
  }
}

export default App;

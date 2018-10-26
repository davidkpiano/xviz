import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.module.scss";

import { StateChart } from "./StateChart";
import { Machine } from "xstate";

const lightMachine = Machine({
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
      on: {
        TIMER: "green"
      }
    }
  }
});

class App extends Component {
  render() {
    return (
      <div className="App">
        <StateChart machine={lightMachine} />
      </div>
    );
  }
}

export default App;

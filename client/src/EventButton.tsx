import * as React from 'react';
import { EventType } from 'xstate/lib/types';

interface EventButtonProps {
  name: EventType;
  onClick: (eventType: EventType) => void;
  onMouseOver: (eventType: EventType) => void;
  onMouseOut: (eventType: EventType) => void;
  disabled: boolean;
}

export class EventButton extends React.Component<EventButtonProps> {
  handleClick() {
    const { name, onClick } = this.props;

    return onClick(name);
  }
  handleMouseOver() {
    const { name, onMouseOver } = this.props;

    return onMouseOver(name);
  }
  handleMouseOut() {
    const { name, onMouseOut } = this.props;

    return onMouseOut(name);
  }
  render() {
    const { name, disabled } = this.props;

    return (
      <button
        type="button"
        className="ui-button -event"
        onClick={_ => this.handleClick()}
        onMouseOver={_ => this.handleMouseOver()}
        onMouseOut={_ => this.handleMouseOut()}
        disabled={disabled}
      >
        {name}
      </button>
    );
  }
}

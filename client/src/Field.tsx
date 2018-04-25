import * as React from 'react';

interface FieldProps {
  label: string;
  action?: {
    title: string;
    onClick: () => void;
  };
}

export class Field extends React.Component<FieldProps> {
  render() {
    const { label, action } = this.props;

    return (
      <div className="ui-field">
        <label className="ui-label">
          {label}
          {action ? (
            <button className="ui-action" onClick={action.onClick}>
              {action.title}
            </button>
          ) : (
            ''
          )}
        </label>
        {this.props.children}
      </div>
    );
  }
}

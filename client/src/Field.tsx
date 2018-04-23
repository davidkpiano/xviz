import * as React from 'react';

interface FieldProps {
  label: string;
}

export class Field extends React.Component<FieldProps> {
  render() {
    const { label } = this.props;

    return (
      <div className="ui-field">
        <label className="ui-label">{label}</label>
        {this.props.children}
      </div>
    );
  }
}

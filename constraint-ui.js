
import React from 'react'


var constraintListStyle = {
  position: 'absolute',
  zIndex: 1,
  width: 200,
  height: 200,
  right: 0,
  background: '#f0f'
}

export class ConstraintList extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      selected: false
    }
  }

  onAddConstraint(constraintName) {
    this.setState({
      selected: this.props.constraints[constraintName]
    });
  }

  doneWithConstraint(constraint) {
    this.props.constrain(constraint[0], constraint[1]);
    this.setState({
      selected: false
    })
  }

  render () {
    const constraints = this.props.constraints;
    const constraintNames = Object.keys(constraints).sort();

    if (this.state.selected) {
      return(
        <div style={constraintListStyle}>
          <ConstraintOptions emitter={this.props.emitter} constraint={this.state.selected} doneWithConstraint={this.doneWithConstraint.bind(this)} />
        </div>
      );
    } else {
      return (
        <div style={constraintListStyle}>
          <ul>
          {constraintNames.map((constraintName) => {
            return <li key={constraintName} onClick={this.onAddConstraint.bind(this, constraintName)}>{constraintName}</li>
          })}
          </ul>
        </div>
      )


    }
    return <div style={constraintListStyle}>asdfasdfsad</div>
  }
}


export class ConstraintOptions extends React.Component {
  constructor (props) {
    super(props);
    this.state = props;
    this.constraintToAdd = [
      this.state.constraint.name,
      new Array(this.state.constraint.args.length)
    ];

  }

  onSave() {
    console.log(this.constraintToAdd[1])
    this.props.doneWithConstraint(this.constraintToAdd.slice())
  }

  onInputChange(index, value) {

    console.log('CHANGE', index, value)
    this.constraintToAdd[1][index] = value;
  }

  render () {
    const constraint = this.state.constraint;

    // TODO: redraw the nice SVG arrow
    return (
      <div>
        <ul>
          {constraint.args.map((arg, i) => {
            switch (arg) {
              case 'point':
                return <li><ConstraintPointField key={i} emitter={this.props.emitter} updateValue={this.onInputChange.bind(this, i)} /></li>
              break;

              case 'float':
                return <li><ConstraintFloatField key={i} emitter={this.props.emitter} updateValue={this.onInputChange.bind(this, i)} /></li>
              break;
            }
          })}

          <li onClick={this.onSave.bind(this)}>save</li>
        </ul>
      </div>
    );
  }
}

class ConstraintPointField extends React.Component {
  constructor (props) {
    super(props);
    this.state = { value: false };
  }

  onFocus() {
    this.props.emitter.on('point-selected', this.props.updateValue)
  }

  onBlur() {
    this.props.emitter.removeListener('point-selected', this.props.updateValue)
  }

  render() {
    return <input type="text" value={this.state.value ? this.state.value : ''} onFocus={this.onFocus.bind(this)} onBlur={this.onBlur.bind(this)} />
  }
}

class ConstraintFloatField extends React.Component {
  constructor (props) {
    super(props);
    this.state = { value: false };
  }

  onChange(event) {
    this.props.updateValue(parseFloat(event.target.value));
  }
  // TODO: handle changes and forward the right thing to this.props.onUpdate
  render() {
    return <input type="text" onChange={this.onChange.bind(this)} value={this.state.value ? this.state.value : '0.0'}  />
  }
}



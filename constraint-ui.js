
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
    if (constraint) {
      this.props.constrain(constraint[0], constraint[1]);
    }

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

    this.onInputKeyPressed = this.onInputKeyPressed.bind(this);
  }

  onInputKeyPressed(ev) {

    switch (ev.keyCode) {
      case 13:
        this.onSave();
      break;

      case 27:
        this.onCancel()
      break;
    }

  }

  componentDidMount() {
    var el = React.findDOMNode(this)

    // focus the first element
    var inputs = el.getElementsByTagName('input');
    inputs.length && inputs[0].focus();

    // listen for <enter> and <esc>
    el.addEventListener('keydown', this.onInputKeyPressed, true);
  }

  componentWillUnmount() {
    var el = React.findDOMNode(this)
    el.removeEventListener('keydown', this.onInputKeyPressed, true);
  }

  onSave() {
    console.log(this.constraintToAdd[1])
    this.props.doneWithConstraint(this.constraintToAdd.slice())
  }

  onCancel() {
    this.props.doneWithConstraint()
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
          <li>{this.state.constraint.name}</li>
          {constraint.args.map((arg, i) => {
            switch (arg) {
              case 'point':
                return <li key={i}><ConstraintPointField emitter={this.props.emitter} updateValue={this.onInputChange.bind(this, i)} /></li>
              break;

              case 'float':
                return <li key={i}><ConstraintFloatField emitter={this.props.emitter} updateValue={this.onInputChange.bind(this, i)} /></li>
              break;
            }
          })}

          <li onClick={this.onSave.bind(this)}>save</li>
          <li onClick={this.onCancel.bind(this)}>cancel</li>
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
    this.state = { value: '0.0' };
  }

  onChange(event) {
    var f = parseFloat(event.target.value);

    if (!isNaN(f)) {
      this.props.updateValue(f);
    } else {
      f = '';
    }

    this.setState({ value: f });
  }
  // TODO: handle changes and forward the right thing to this.props.onUpdate
  render() {
    return <input type="text" onChange={this.onChange.bind(this)} value={this.state.value}  />
  }
}



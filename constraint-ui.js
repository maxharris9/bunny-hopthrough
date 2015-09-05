import React, { Component } from 'react'
import OptionList from './components/OptionList'

export class ConstraintList extends Component {
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
        <div className='ConstraintInput'>
          <ConstraintOptions emitter={this.props.emitter} constraint={this.state.selected} doneWithConstraint={this.doneWithConstraint.bind(this)} />
        </div>
      );
    } else {
      return (
        <div className='ConstraintList'>
          <h1>
            Add Constraint
            <button className='cancel' onClick={this.props.handleClose.bind(this)}>X</button>
          </h1>
          <OptionList>
          {constraintNames.map((constraintName) => {
            return <li key={constraintName} onClick={this.onAddConstraint.bind(this, constraintName)}>{constraintName}</li>
          })}
          </OptionList>
        </div>
      )
    }
    return <div style={constraintListStyle}>asdfasdfsad</div>
  }
}


export class ConstraintOptions extends Component {
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
      <div className='OptionsInput'>
        <h1>
          {this.state.constraint.name}
          <button className='cancel' onClick={this.onCancel.bind(this)}>X</button>
        </h1>
        <table>
        {constraint.args.map((arg, i) => {
          switch (arg) {
            case 'point':
              return (
                <tr key={i}>
                  <td>point</td>
                  <td className='input'>
                    <ConstraintPointField emitter={this.props.emitter} updateValue={this.onInputChange.bind(this, i)} />
                  </td>
                </tr>
              )
            break;

            case 'float':
              return (
                <tr key={i}>
                  <td>float</td>
                  <td className='input'>
                    <ConstraintFloatField emitter={this.props.emitter} updateValue={this.onInputChange.bind(this, i)} />
                  </td>
                </tr>
              )
            break;
          }
        })}
        </table>
        <div className='actions'>
          <button className='save' onClick={this.onSave.bind(this)}>save</button>
        </div>
      </div>
    );
  }
}

class ConstraintPointField extends Component {
  constructor (props) {
    super(props);
    this.state = { value: false };
    this.updateValue = this.props.updateValue;
  }

  onFocus() {
    this.props.emitter.on('point-selected', this.updateValue);
  }

  onBlur() {
    this.props.emitter.removeListener('point-selected', this.updateValue);
  }

  componentWillUnmount() {
    this.props.emitter.removeListener('point-selected', this.updateValue);
  }

  render() {
    return <input type="text" value={this.state.value ? this.state.value : ''} onFocus={this.onFocus.bind(this)} onBlur={this.onBlur.bind(this)} />
  }
}

class ConstraintFloatField extends Component {
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



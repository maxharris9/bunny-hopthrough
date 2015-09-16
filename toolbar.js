var EventEmitter = require('events');
import React, { Component } from 'react'
var merge = require('merge');

var toolbarEvents = new EventEmitter();

function initToolbar () {
  var toolbar = document.createElement('div');
  toolbar.id = 'toolbar';
  document.body.appendChild(toolbar);

  React.render(<Toolbar />, document.getElementById('toolbar'));
}

var toolbarStyle = {
  margin: '2px',
  background: 'orange',
  width: '25px',
  position: 'absolute',
  zIndex: 1,
  '-o-user-select': 'none',
  '-moz-user-select': 'none',
  '-khtml-user-select': 'none',
  '-webkit-user-select': 'none'
};

var toolbarButtonStyle = {
  border: '1px red',
  background: 'orange',
  width: '25px',
  textAlign: 'center',
  lineHeight: '25px',
  position: 'relative',
  cursor: 'pointer',
  zIndex: 1
};

var selectedToolbarButtonStyle = merge(true, toolbarButtonStyle, {
  textShadow: '0px 0px 3px #FFFFFF',
  color: 'white'
});

class Toolbar extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      mode: 'NONE'
    };

    this.panClick = this.panClick.bind(this);
    this.arrowClick = this.arrowClick.bind(this);
    this.drawClick = this.drawClick.bind(this);
    this.newPathClick = this.newPathClick.bind(this);
    this.selectPathClick = this.selectPathClick.bind(this);
  }

  panClick () {
    this.setState({mode: 'NONE'});
  }

  arrowClick () {
    this.setState({mode: 'TWEAK'});
  }

  drawClick () {
    this.setState({mode: 'DRAW'});
  }

  newPathClick () {
    this.setState({mode: 'NEWPATH'});
    // don't cancel here so the global mouse handler can properly setup
    // the new path.
  }

  deletePointClick () {
    var aPath = paths.paths[paths.activePath];
    aPath.vertexes.splice(aPath.activePoint, 1);
  }

  closePathClick () {
    paths.closePath();
  }

  openPathClick () {
    paths.openPath();
  }

  addConstraintClick () {
    this.setState({submode: 'ADDCONSTRAINT'});

    var constraintElement = document.createElement('div');
    constraintElement.id = 'constraints';
    document.body.appendChild(constraintElement);

    function handleClose() {
      if (constraintElement && constraintElement.parentNode) {
        React.unmountComponentAtNode(constraintElement);
        this.setState({submode: 'NONE'});
      }
    }

    React.render((
      <ConstraintList
        constraints={constraints}
        constrain={constrain}
        emitter={subModeEmitter}
        handleClose={handleClose} />
      ), constraintElement);
  }

  csgTreeClick () {
    var cesgTreElement = document.createElement('div');
    cesgTreElement.id = 'csgtree';
    document.body.appendChild(cesgTreElement);

    function handleClose() {
      if (cesgTreElement && cesgTreElement.parentNode) {
        React.unmountComponentAtNode(cesgTreElement);
      }
    }

    React.render((
      <Tree
        handleClose={handleClose} />
    ), cesgTreElement);
  }

  selectPathClick () {
    this.setState({mode:'SELECT_PATH'});
  }

  onExtrude () {
    extrudeSketch();
  }

  render () {
    toolbarEvents.emit('toolbarMode', this.state.mode);

    // TODO: redraw the nice SVG arrow
    return (
      <div style={toolbarStyle}>
        <div style={this.state.mode === 'NONE' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.panClick} title="Pan">
          P
        </div>
        <div style={toolbarButtonStyle} onClick={this.arrowClick} title='Arrow'>
          <svg enableBackground='new 0 0 24 24' id='Layer_1' version='1.0' viewBox='0 0 24 24' width='20' height='20'>
            <path d='M7,2l12,11.2l-5.8,0.5l3.3,7.3l-2.2,1l-3.2-7.4L7,18.5V2' fill={this.state.mode === 'TWEAK' ? 'white' : 'black'}
              filter='url(#arrowBlur)'/>
          </svg>
        </div>
        <div style={this.state.mode === 'DRAW' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.drawClick} title='Polyline'>
          D
        </div>
        <div style={this.state.mode === 'NEWPATH' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.newPathClick} title='New Path'>
          N
        </div>
        <div style={toolbarButtonStyle} onClick={this.deletePointClick} title='Delete selected point'>
          X
        </div>

        <div style={toolbarButtonStyle} onClick={this.closePathClick} title="Close selected path">
          Cl
        </div>
        <div style={toolbarButtonStyle} onClick={this.openPathClick} title="Open selected path">
          Op
        </div>
        <div style={toolbarButtonStyle} onClick={this.addConstraintClick} title="Add Constraint">
          C
        </div>
        <div style={toolbarButtonStyle} onClick={this.onExtrude} title="Extrude">
          Ex
        </div>
        <div style={toolbarButtonStyle} onClick={this.csgTreeClick} title="CSG Tree">
          T
        </div>
        <div style={this.state.mode === 'SELECT_PATH' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.selectPathClick} title="Path Selection Tool">
          Pa
         </div>
      </div>
    );
  }
}

exports.initToolbar = initToolbar;
exports.toolbarEvents = toolbarEvents;

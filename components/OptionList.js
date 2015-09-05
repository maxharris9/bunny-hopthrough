import React, { Component } from 'react'

export default class OptionList extends Component {
  constructor (props) {
    super(props)
    this.setState(props)
  }

  render () {
    return (
      <ul className='OptionList'>{this.props.children}</ul>
    )
  }
}

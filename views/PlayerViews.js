import React from 'react';

const exports = {};

// Player views must be extended.
// It does not have its own Wrapper view.

exports.GetFingers = class extends React.Component {
  render() {
    const {parent, playable, finger} = this.props;
    return (
      <div>
        {finger ? 'It was a draw! Pick again.' : ''}
        <br />
        {!playable ? 'Please wait...' : ''}
        <br />
        {'Choose _ fingers!...'}
        <br />
        <button
          disabled={!playable}
          onClick={() => parent.showFinger('1')}
        >One</button>
        <button
          disabled={!playable}
          onClick={() => parent.showFinger('2')}
        >Two</button>
        <button
          disabled={!playable}
          onClick={() => parent.showFinger('3')}
        >Three</button>
        <button
          disabled={!playable}
          onClick={() => parent.showFinger('4')}
        >Four</button>
        <button
          disabled={!playable}
          onClick={() => parent.showFinger('5')}
        >Five</button>
      </div>
    );
  }
}

exports.GetGuess = class extends React.Component {
  render() {
    const {parent} = this.props;
    const guess = (this.state || {}).guess
    return (
      <div>
        <br />
        {'Guess the possible total!..'}
        <br />
        <input
          type='number'
          onChange={(e) => this.setState({guess: e.currentTarget.value})}
        /> 
        <button
          onClick={() => parent.setGuess(guess)}
        >Set guess</button>
      </div>
    );
  }
}

exports.WaitingForResults = class extends React.Component {
  render() {
    return (
      <div>
        Waiting for results...
      </div>
    );
  }
}

exports.Done = class extends React.Component {
  render() {
    const {outcome} = this.props;
    return (
      <div>
        The outcome of this game was:
        <br />{outcome || 'Unknown'}
      </div>
    );
  }
}

exports.Timeout = class extends React.Component {
  render() {
    return (
      <div>
        There's been a timeout. (Someone took too long.)
      </div>
    );
  }
}

export default exports;
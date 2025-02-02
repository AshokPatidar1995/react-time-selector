import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import AvailableTimes from '../AvailableTimes/AvailableTimes';
import styles from './styles.css';

import './reset.css';

function createMomentDate(hour, minute) {
  const date = moment().utc();
  date.set({
    date: date.startOf('week').add(1, 'day').date(),
    hour,
    minute,
    second: 0,
    millisecond: 0
  })
  return date.toISOString();
}

const TIME_ZONE = 'UTC';

const initialSelections = [
  {
    start: createMomentDate(5, 0),
    end: createMomentDate(6, 0),
  },
  {
    start: createMomentDate(9, 0),
    end: createMomentDate(11, 0),
  },
  {
    start: createMomentDate(12, 0),
    end: createMomentDate(13, 0),
  }
];

class Test extends Component {
  constructor() {
    super();
    this.state = {
      selections: initialSelections,
      clearSelection: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.clearSelection = this.clearSelection.bind(this)
    this.changeClearSeleation = this.changeClearSeleation.bind(this)
  }

  handleChange(selections) {
    this.setState({ selections });
  }
  clearSelection() {
    this.setState({ selections: [], clearSelection: true });
  }
  changeClearSeleation() {
    this.setState({ clearSelection: false });
  }

  render() {
    const { selections } = this.state
    return (
      <div>
        <div className={styles.example}>
          <div className={styles.main}>
            <AvailableTimes
              timeConvention="24h"
              clearSelection={this.state.clearSelection}
              changeClearSeleation={this.changeClearSeleation}
              timeZone={TIME_ZONE}
              height={750}
              weekStartsOn="monday"
              start={new Date()}
              onChange={this.handleChange}
              initialSelections={selections}
              availableHourRange={{ start: 1, end: 24 }}
            />
          </div>
        </div>
      </div>
    );
  }
}
ReactDOM.render(<Test />, document.getElementById('root'));

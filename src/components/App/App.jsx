import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import AvailableTimes from '../AvailableTimes/AvailableTimes';
import styles from './styles.css';

import './reset.css';

function dateAt(dayInWeek, hours, minutes) {
  const date = new Date();
  while (date.getDay() > 0) {
    // reset to sunday
    date.setDate(date.getDate() - 1);
  }
  for (let i = 0; i < dayInWeek; i++) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(hours, minutes, 0, 0);
  return moment(date).toISOString();
}

const TIME_ZONE = 'UTC';

const initialSelections = [
  {
    start: moment().utc().set({ date: 16, hour: 5, minute: 0, second: 0, millisecond: 0 }).toISOString(),
    end: moment().utc().set({ date: 16, hour: 6, minute: 0, second: 0, millisecond: 0 }).toISOString(),
  },
  {
    start: moment().utc().set({ date: 16, hour: 9, minute: 0, second: 0, millisecond: 0 }).toISOString(),
    end: moment().utc().set({ date: 16, hour: 11, minute: 0, second: 0, millisecond: 0 }).toISOString(),
  },
  {
    start: moment().utc().set({ date: 16, hour: 12, minute: 0, second: 0, millisecond: 0 }).toISOString(),
    end: moment().utc().set({ date: 16, hour: 13, minute: 0, second: 0, millisecond: 0 }).toISOString(),
  }
];

class Test extends Component {
  constructor() {
    super();
    this.state = {
      selections: initialSelections,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(selections) {
    this.setState({ selections });
    console.log({ selections })
  }

  render() {
    const { selections } = this.state
    return (
      <div>
        <div className={styles.example}>
          <div className={styles.main}>
            <AvailableTimes
              timeConvention="24h"
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

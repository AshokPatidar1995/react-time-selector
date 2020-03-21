import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import momentTimezone from 'moment-timezone';

import Week from '../Week/Week';
import styles from './AvailableTimes.css';
import { weekAt } from '../../utils/helper';


function flatten(selections) {
  const result = [];
  Object.keys(selections).forEach((date) => {
    if (date === "0") {
      result.push(...selections[date]);
    }
  });
  return result;
}

export default class AvailableTimes extends PureComponent {
  constructor({
    initialSelections = [],
    timeZone,
    weekStartsOn,
  }) {
    super();
    this.state = {
      weeks: [],
      selections: initialSelections,
      availableWidth: 10,
    };
    this.selections = {};
    initialSelections.forEach((selection) => {
      const week = weekAt(weekStartsOn, selection.start, timeZone);
      const existing = this.selections[week.start] || [];
      existing.push(selection);
      this.selections[week.start] = existing;
    });
    this.setRef = this.setRef.bind(this);
    this.handleWeekChange = this.handleWeekChange.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowResize);
    this.setState({
      weeks: this.expandWeeks(),
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  setRef(element) {
    if (!element) {
      return;
    }
    this.ref = element;
    this.setState({
      availableWidth: element.offsetWidth,
    });
  }

  handleWindowResize() {
    this.setState({
      availableWidth: this.ref.offsetWidth,
    });
  }
  handleWeekChange(weekSelections) {
    this.selections[0] = weekSelections;
    const newSelections = this.triggerOnChange();
    // console.log({ newSelections, weekSelections })
    this.setState({
      selections: newSelections,
    });
  }
  triggerOnChange() {
    const { onChange } = this.props;
    const newSelections = flatten(this.selections);
    if (onChange) {
      onChange(newSelections);
    }
    return newSelections;
  }

  expandWeeks() {
    const { weekStartsOn, timeZone } = this.props;
    return weekAt(weekStartsOn, new Date(), timeZone);
  }

  render() {
    const {
      width,
      height,
      timeConvention,
      timeZone,
      touchToDeleteSelection,
      availableHourRange,
    } = this.props;
    const {
      availableWidth,
      selections,
      weeks,
    } = this.state;

    return (
      <div
        className={styles.component}
        style={{
          height,
          width,
        }}
        ref={this.setRef}
      >
        <div
          className={styles.inner}
        >
          <div className={styles.main}>
            <Week
              timeConvention={timeConvention}
              timeZone={timeZone}
              availableWidth={availableWidth}
              key={weeks.start}
              days={weeks.days}
              initialSelections={selections}
              onChange={this.handleWeekChange}
              height={height}
              touchToDeleteSelection={touchToDeleteSelection}
              availableHourRange={availableHourRange}
            />
          </div>
        </div>
      </div>
    );
  }
}

AvailableTimes.propTypes = {
  timeConvention: PropTypes.oneOf(['12h', '24h']),
  timeZone: PropTypes.string.isRequired,
  initialSelections: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.number,
    ]),
    end: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.number,
    ]),
  })),
  weekStartsOn: PropTypes.oneOf(['sunday', 'monday']),
  onChange: PropTypes.func,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  touchToDeleteSelection: PropTypes.bool,
  availableHourRange: PropTypes.shape({
    start: PropTypes.number,
    end: PropTypes.number,
  }).isRequired,
};

AvailableTimes.defaultProps = {
  timeZone: momentTimezone.tz.guess(),
  weekStartsOn: 'sunday',
  touchToDeleteSelection: 'ontouchstart' in window,
  availableHourRange: { start: 0, end: 24 },
};

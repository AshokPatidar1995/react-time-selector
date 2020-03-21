import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import momentTimezone from 'moment-timezone';
import moment from 'moment';

import { HOUR_IN_PIXELS, RULER_WIDTH_IN_PIXELS, MINUTE_IN_PIXELS } from '../../utils/Constants';
import Day from '../Day/Day';
import Ruler from '../Ruler/Ruler';
import { getIncludedEvents } from '../../utils/helper';
import styles from './Week.css';

function flatten(selections) {
  const result = [];
  selections.forEach((selectionsInDay) => {
    result.push(...selectionsInDay);
  });
  return result;
}

function weekEvents(days, items, timeZone) {
  const result = [];
  days.forEach(({ date }) => {
    const startMoment = momentTimezone.tz(date, timeZone).hour(0);
    const end = momentTimezone.tz(startMoment, timeZone).date(startMoment.date() + 1).toDate();
    const start = startMoment.toDate();
    result.push(getIncludedEvents(items || [], start, end));
  });
  return result;
}

let cachedScrollbarWidth;
function computeWidthOfAScrollbar() {
  // based on https://davidwalsh.name/detect-scrollbar-width
  if (cachedScrollbarWidth) {
    return cachedScrollbarWidth;
  }
  const scrollDiv = document.createElement('div');
  scrollDiv.style = `
    width: 100px;
    height: 100px;
    overflow: scroll;
    position: absolute;
    top: -9999px;
  `;
  document.body.appendChild(scrollDiv);
  cachedScrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);
  return cachedScrollbarWidth;
}

export default class Week extends PureComponent {
  constructor({ days, initialSelections, timeZone }) {
    super();
    this.state = {
      daySelections: weekEvents(days, initialSelections, timeZone),
    };
    this.handleDayChange = this.handleDayChange.bind(this);
  }

  componentWillMount() {
    this.setState({
      widthOfAScrollbar: computeWidthOfAScrollbar(),
    });
  }

  handleDayChange(selections) {
    this.setState(({ daySelections }) => {
      const { onChange } = this.props;
      if (!onChange) {
        return undefined;
      }
      // eslint-disable-next-line no-param-reassign
      daySelections[0] = selections;
      const flattened = flatten(daySelections);
      onChange(flattened);
      return { daySelections };
    });
  }

  // generate the props required for Day to block specific hours.
  generateHourLimits() {
    const { availableHourRange } = this.props;
    return {
      top: availableHourRange.start * HOUR_IN_PIXELS, // top blocker
      bottom: availableHourRange.end * HOUR_IN_PIXELS,
      bottomHeight: (24 - availableHourRange.end) * HOUR_IN_PIXELS, // bottom height
      difference: ((availableHourRange.end - availableHourRange.start) * HOUR_IN_PIXELS)
        + (MINUTE_IN_PIXELS * 14),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  renderLines() {
    const result = [];
    for (let i = 0; i < 24; i++) {
      result.push(
        <div
          key={i}
          className={styles.hour}
          style={{ height: HOUR_IN_PIXELS }}
        />
      );
    }
    return result;
  }

  render() {
    const {
      days,
      availableWidth,
      timeConvention,
      timeZone,
      touchToDeleteSelection,
    } = this.props;
    const { daySelections } = this.state;
    return (
      <div className={styles.component}>
        <div
          className={styles.daysWrapper}
          ref={(element) => {
            if (!element || this.alreadyScrolled) {
              return;
            }
            this.alreadyScrolled = true;
            // eslint-disable-next-line no-param-reassign
            element.scrollTop = HOUR_IN_PIXELS * 6.5;
          }}
        >
          <div className={styles.lines}>
            {this.renderLines()}
          </div>
          <div className={styles.days} >
            <Ruler timeConvention={timeConvention} />
            <Day
              // eslint-disable-next-line react/jsx-boolean-value
              available={true}
              availableWidth={(availableWidth - RULER_WIDTH_IN_PIXELS)}
              timeConvention={timeConvention}
              timeZone={timeZone}
              index={0}
              key={days[0].date}
              date={days[0].date}
              initialSelections={daySelections[0]}
              onChange={this.handleDayChange}
              hourLimits={this.generateHourLimits()}
              touchToDeleteSelection={touchToDeleteSelection}
            />
          </div>
        </div>
      </div>
    );
  }
}

Week.propTypes = {
  availableWidth: PropTypes.number.isRequired,
  timeConvention: PropTypes.oneOf(['12h', '24h']),
  timeZone: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  initialSelections: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
  })),
  // eslint-disable-next-line react/forbid-prop-types
  days: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date)
  })),
  touchToDeleteSelection: PropTypes.bool,
  availableHourRange: PropTypes.shape({
    start: PropTypes.number,
    end: PropTypes.number,
  }).isRequired,
};

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { HOUR_IN_PIXELS, RULER_WIDTH_IN_PIXELS, MINUTE_IN_PIXELS } from '../../utils/Constants';
import Day from '../Day/Day';
import Ruler from '../Ruler/Ruler';
import styles from './Week.css';

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
  constructor({ initialSelections }) {
    super();
    this.state = { daySelections: initialSelections };
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
      daySelections = selections;
      onChange(daySelections);
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
      clearSelection,
      changeClearSeleation,
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
              clearSelection={clearSelection}
              changeClearSeleation={changeClearSeleation}
              index={0}
              key={'2020-03-23T00:00:00.000Z'}
              date={'2020-03-23T00:00:00.000Z'}
              initialSelections={daySelections}
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
    start: PropTypes.string,
    end: PropTypes.string,
  })),
  touchToDeleteSelection: PropTypes.bool,
  clearSelection: PropTypes.bool,
  changeClearSeleation: PropTypes.func,
  availableHourRange: PropTypes.shape({
    start: PropTypes.number,
    end: PropTypes.number,
  }).isRequired,
};

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import Week from '../Week/Week';
import styles from './AvailableTimes.css';
import { weekAt } from '../../utils/helper';
const TIME_ZONE = 'UTC';

export default class AvailableTimes extends PureComponent {
  constructor(props) {
    super();
    this.state = {
      weeks: [],
      selections: props.initialSelections,
      availableWidth: 10,
    };
    this.selections = props.initialSelections;
    this.setRef = this.setRef.bind(this);
    this.handleWeekChange = this.handleWeekChange.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowResize);
    this.setState({
      weeks: this.expandWeeks(),
      selections: this.triggerOnChange(),
    });
  }
  //WARNING! To be deprecated in React v17. Use new lifecycle static getDerivedStateFromProps instead.
  componentWillReceiveProps(nextProps) {
    let count = 0;
    if (nextProps.clearSelection && count === 0) {
      count = 1;
      this.setState({ selections: []})
      // const newSelections = this.triggerOnChange();
    }
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
    this.selections = weekSelections;
    const newSelections = this.triggerOnChange();
    this.setState({
      selections: newSelections,
    });
  }
  triggerOnChange() {
    const { onChange } = this.props;
    const newSelections = this.selections;
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
      clearSelection,
      changeClearSeleation,
    } = this.props;
    const {
      availableWidth,
      selections,
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
              clearSelection={clearSelection}
              availableWidth={availableWidth}
              changeClearSeleation={changeClearSeleation}
              key={'weeks.start'}
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
    start: PropTypes.string,
    end: PropTypes.string,
  })),
  weekStartsOn: PropTypes.oneOf(['sunday', 'monday']),
  onChange: PropTypes.func,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  touchToDeleteSelection: PropTypes.bool,
  clearSelection: PropTypes.bool,
  changeClearSeleation: PropTypes.func,
  availableHourRange: PropTypes.shape({
    start: PropTypes.number,
    end: PropTypes.number,
  }).isRequired,
};

AvailableTimes.defaultProps = {
  timeZone: TIME_ZONE,
  weekStartsOn: 'sunday',
  touchToDeleteSelection: 'ontouchstart' in window,
  availableHourRange: { start: 0, end: 24 },
};

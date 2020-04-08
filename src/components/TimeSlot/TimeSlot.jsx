import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import moment from 'moment';

import { MINUTE_IN_PIXELS } from '../../utils/Constants';
import { positionInDay } from '../../utils/helper';
import styles from './TimeSlot.css';

const BOTTOM_GAP = MINUTE_IN_PIXELS * 10;

export default class TimeSlot extends PureComponent {
  constructor() {
    super();
    this.handleResizerMouseDown = this.handleResizerMouseDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleResizerMouseUp = this.handleResizerMouseUp.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.preventMove = e => e.stopPropagation();
  }

  componentDidMount() {
    this.creationTime = new Date().getTime();
  }

  handleDelete(event) {
    if (new Date().getTime() - this.creationTime < 500) {
      // Just created. Ignore this event, as it's likely coming from the same
      // click event that created it.
      return;
    }
    event.stopPropagation();
    const { onDelete, end, start } = this.props;
    onDelete({ end, start }, event);
  }

  handleResizerMouseDown(event) {
    event.stopPropagation();
    const { onSizeChangeEndTime, end, start } = this.props;
    onSizeChangeEndTime({ end, start }, event);
  }
  handleResizerMouseUp(event) {
    event.stopPropagation();
    const { onSizeChangeStartTime, end, start } = this.props;
    onSizeChangeStartTime({ end, start }, event);
  }

  handleMouseDown(event) {
    const { onMoveStart, end, start } = this.props;
    onMoveStart({ end, start }, event);
  }

  formatTime(date) {
    const { timeConvention, frozen } = this.props;
    const m = moment.utc(date, 'H:mm');
    if (timeConvention === '12h') {
      if (frozen && m.minute() === 0) {
        return m.format('ha');
      }
      return m.format('hh:mma');
    }
    if (frozen && m.minute() === 0) {
      return m.format('HH');
    }
    return m.format('HH:mm');
  }

  timespan() {
    const { start, end } = this.props;
    return [this.formatTime(start), '-', this.formatTime(end)].join('');
  }

  render() {
    const {
      active,
      date,
      start,
      end,
      frozen,
      width,
      offset,
      timeZone,
      touchToDelete,
    } = this.props;

    const top = positionInDay(date, start, timeZone);
    const bottom = positionInDay(date, end, timeZone);

    const height = Math.max(
      bottom - top - (frozen ? BOTTOM_GAP : 0),
      1,
    );

    const classes = [styles.component];
    if (frozen) {
      classes.push(styles.frozen);
    }
    if (active) {
      classes.push(styles.active);
    }

    const style = {
      top,
      height,
    };

    if (typeof width !== 'undefined' && typeof offset !== 'undefined') {
      style.width = `calc(${width * 100}% - 5px)`;
      style.left = `${offset * 100}%`;
    }

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={classes.join(' ')}
        style={style}
        // onMouseDown={frozen || touchToDelete ? undefined : this.handleMouseDown}
        onClick={frozen || !touchToDelete ? undefined : this.handleDelete}
      >
        {!frozen && !touchToDelete && (
          <div>
            <div
              className={styles.topHandle}
              onMouseDown={this.handleResizerMouseUp}
            >
              ...
            </div>
          </div>
        )}
        <div
          className={styles.title}
          style={{
            // two lines of text in an hour
            lineHeight: `${(MINUTE_IN_PIXELS * 30) - (BOTTOM_GAP / 2)}px`,
          }}
        >
          {this.timespan()}
        </div>
        {!frozen && !touchToDelete && (
          <div>
            <div
              className={styles.handle}
              onMouseDown={this.handleResizerMouseDown}
            >
              ...
            </div>
            <button
              className={styles.delete}
              onClick={this.handleDelete}
              onMouseDown={this.preventMove}
            >
              ×
            </button>
          </div>
        )}
      </div>
    );
  }
}

TimeSlot.propTypes = {
  touchToDelete: PropTypes.bool,
  timeConvention: PropTypes.oneOf(['12h', '24h']),
  timeZone: PropTypes.string.isRequired,

  active: PropTypes.bool, // Whether the time slot is being changed
  date: PropTypes.string.isRequired, // The day in which the slot is displayed
  start: PropTypes.string.isRequired,
  end: PropTypes.string.isRequired,
  frozen: PropTypes.bool,

  onSizeChangeEndTime: PropTypes.func,
  onSizeChangeStartTime: PropTypes.func,
  onMoveStart: PropTypes.func,
  onDelete: PropTypes.func,

  // Props used to signal overlap
  width: PropTypes.number,
  offset: PropTypes.number,
};

TimeSlot.defaultProps = {
  touchToDelete: false,
};

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import moment from 'moment';
import { HOUR_IN_PIXELS, MINUTE_IN_PIXELS } from '../../utils/Constants';
import TimeSlot from '../TimeSlot/TimeSlot';
import { inSameDay, hasOverlap, toDate, positionInDay } from '../../utils/helper';
import styles from './Day.css';

const ROUND_TO_NEAREST_MINS = 30;

export default class Day extends PureComponent {
  constructor({ initialSelections }) {
    super();
    this.state = {
      index: undefined,
      selections: initialSelections,
    };
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleSizeChangeStart = this.handleItemModification.bind(this, 'end');
    this.handleMoveStart = this.handleItemModification.bind(this, 'both');
    this.handleDelete = this.handleDelete.bind(this);
    this.handleMouseTargetRef = (element) => {
      this.mouseTargetRef = element;
    };
  }
  componentWillReceiveProps(nextProps) {
    const { onChange, changeClearSeleation } = this.props;
    if (nextProps.clearSelection) {
      this.setState(({ selections }) => {

        for (let i = 0; i < selections.length; i++) {
          selections.splice(i, 1);
          onChange([]);
          return { selections: [] };
        }
        return {};
      });
      changeClearSeleation()
    }
  }

  findSelectionAt(date) {
    const { selections } = this.state;
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      if (
        new Date(moment.utc(selection.start, 'H:mm')).getTime() <= new Date(date).getTime() &&
        new Date(moment.utc(selection.end, 'H:mm')).getTime() > new Date(date).getTime()
      ) {
        return true;
      }
    }
    return undefined;
  }

  relativeY(pageY, rounding = ROUND_TO_NEAREST_MINS) {
    const { top } = this.mouseTargetRef.getBoundingClientRect();
    let realY = pageY - top - (window.pageYOffset ||
      document.documentElement.scrollTop || document.body.scrollTop || 0);
    realY += this.props.hourLimits.top; // offset top blocker
    const snapTo = (rounding / 60) * HOUR_IN_PIXELS;
    return Math.floor(realY / snapTo) * snapTo;
  }


  handleDelete({ start, end }) {
    const { onChange } = this.props;
    this.setState(({ selections }) => {
      for (let i = 0; i < selections.length; i++) {
        if (selections[i].start === start && selections[i].end === end) {
          selections.splice(i, 1);
          onChange(selections);
          return { selections: selections.slice(0) };
        }
      }
      return {};
    });
  }

  handleItemModification(edge, { start, end }, { pageY, currentTarget }) {
    const position = this.relativeY(pageY);
    this.setState(({ selections }) => {
      for (let i = 0; i < selections.length; i++) {
        if (selections[i].start === start && selections[i].end === end) {
          return {
            edge,
            index: i,
            lastKnownPosition: position,
            minLengthInMinutes: 30,
            target: currentTarget,
          };
        }
      }
      return {};
    });
  }

  handleTouchStart(e) {
    this.touch = {
      startY: e.touches[0].pageY,
      startX: e.touches[0].pageX,
    };
  }

  handleTouchMove(e) {
    this.touch.currentY = e.touches[0].pageY;
    this.touch.currentX = e.touches[0].pageX;
  }

  handleTouchEnd() {
    const { startY, currentY, startX, currentX } = this.touch;
    if (
      Math.abs(startX - (currentX || startX)) < 20 &&
      Math.abs(startY - (currentY || startY)) < 20
    ) {
      this.handleMouseDown({ pageY: startY });
      setTimeout(() => {
        this.handleMouseUp();
      });
    }
    this.touch = undefined;
  }

  handleMouseDown(e) {
    const { timeZone } = this.props;
    const position = this.relativeY(e.pageY, 60);
    const dateAtPosition = toDate(position, timeZone);

    if (this.findSelectionAt(dateAtPosition)) {
      return;
    }

    let end = toDate(position + HOUR_IN_PIXELS, timeZone);
    end = hasOverlap(this.state.selections, dateAtPosition, end) || end;
    if (end - dateAtPosition < 1800000) {
      // slot is less than 30 mins
      return;
    }
    this.setState(({ selections }) => ({
      edge: 'end',
      index: selections.length,
      lastKnownPosition: position,
      minLengthInMinutes: 60,
      selections: selections.concat([{
        start: dateAtPosition,
        end: dateAtPosition === '23:00' ? '23:59' : end,
      }]),
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  hasReachedTop({ offsetTop }) {
    const { hourLimits } = this.props;
    return offsetTop <= hourLimits.top;
  }

  hasReachedBottom({ offsetTop, offsetHeight }) {
    const { hourLimits } = this.props;
    return (offsetTop + offsetHeight) >= hourLimits.bottom;
  }
  handleMouseMove({ pageY }) {
    if (typeof this.state.index === 'undefined') {
      return;
    }
    const { date, timeZone } = this.props;
    const position = this.relativeY(pageY);
    this.setState(({ minLengthInMinutes, selections, edge, index, lastKnownPosition, target }) => {
      const selection = selections[index];
      let newMinLength = minLengthInMinutes;
      if (edge === 'both') {
        // move element
        const diff = moment.utc(toDate(position, timeZone), 'H:mm').diff(moment.utc(toDate(lastKnownPosition, timeZone), 'H:mm'), 'minutes')

        let newStart = moment.utc(selection.start, 'H:mm').add(diff, 'minutes');
        let newEnd = moment.utc(selection.end, 'H:mm').add(diff, 'minutes');
        if (hasOverlap(selections, newStart, newEnd, index)) {
          return {};
        }
        if (this.hasReachedTop(target) && diff < 0) {
          // if has reached top blocker and it is going upwards, fix the newStart.
          newStart = selection.start;
        }

        if (this.hasReachedBottom(target) && diff > 0) {
          // if has reached bottom blocker and it is going downwards, fix.
          newEnd = selection.end;
        }

        selection.start = newStart.format('H:mm');
        selection.end = newEnd.format('H:mm');
      } else {
        // stretch element
        const startPos = positionInDay(date, selection.start, timeZone);
        const minPos = startPos + (minLengthInMinutes * MINUTE_IN_PIXELS);
        if (minPos < position) {
          // We've exceeded 60 mins now, allow smaller
          newMinLength = 30;
        }
        const newEnd = toDate(Math.max(minPos, position), timeZone);
        if (hasOverlap(selections, selection.start, newEnd, index)) {
          // Collision! Let
          return {};
        }
        selection.end = newEnd === '23:30' ? '23:59' : newEnd;
      }
      return {
        lastKnownPosition: position,
        minLengthInMinutes: newMinLength,
        selections,
      };
    });
  }

  handleMouseUp() {
    if (typeof this.state.index === 'undefined') {
      return;
    }
    this.setState({
      edge: undefined,
      index: undefined,
      lastKnownPosition: undefined,
      minLengthInMinutes: undefined,
    });
    const selections = this.state.selections
    const changes = selections.map((selection) => {
      const data = {
        start: selection.start,
        end: selection.end === '23:59' || selection.end === '00:00' ? '23:45' : selection.end,
      };
      if (selection.id) {
        data.id = selection.id;
      }
      return data;
    })
    this.props.onChange(changes);
  }

  render() {
    const {
      available,
      availableWidth,
      date,
      timeConvention,
      timeZone,
      touchToDeleteSelection,
      hourLimits,
    } = this.props;

    const { selections, index } = this.state;
    const classes = [styles.component];

    if (!available) {
      classes.push(styles.grayed);
    }

    if (inSameDay(date, new Date(), timeZone)) {
      classes.push(styles.today);
    }

    return (
      <div
        className={classes.join(' ')}
        style={{
          height: HOUR_IN_PIXELS * 24,
          width: availableWidth,
        }}
      >
        <div
          className={`${styles.grayed} ${styles.block}`}
          style={{
            height: hourLimits.top,
            top: 0,
          }}
        />
        <div
          className={`${styles.grayed} ${styles.block}`}
          style={{
            height: hourLimits.bottomHeight,
            top: hourLimits.bottom,
          }}
        />
        {available && (
          <div
            onMouseDown={this.handleMouseDown}
            onMouseUp={this.handleMouseUp}
            onMouseMove={this.handleMouseMove}
            onMouseOut={this.handleMouseUp}
            onTouchStart={this.handleTouchStart}
            onTouchMove={this.handleTouchMove}
            onTouchEnd={this.handleTouchEnd}
            className={styles.mouseTarget}
            ref={this.handleMouseTargetRef}
            style={{
              top: hourLimits.top,
              height: hourLimits.difference,
            }}
          />
        )}
        {selections.map(({ start, end }, i) => (
          <TimeSlot
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            timeConvention={timeConvention}
            timeZone={timeZone}
            date={date}
            start={start}
            end={end}
            active={typeof index !== 'undefined'}
            onSizeChangeStart={this.handleSizeChangeStart}
            onMoveStart={this.handleMoveStart}
            onDelete={this.handleDelete}
            touchToDelete={touchToDeleteSelection}
          />
        ))}
      </div>
    );
  }
}

Day.propTypes = {
  available: PropTypes.bool,
  availableWidth: PropTypes.number.isRequired,
  hourLimits: PropTypes.shape({
    top: PropTypes.number,
    bottom: PropTypes.number,
    bottomHeight: PropTypes.number,
    difference: PropTypes.number,
  }).isRequired,
  timeConvention: PropTypes.oneOf(['12h', '24h']),
  timeZone: PropTypes.string.isRequired,
  clearSelection: PropTypes.bool,
  changeClearSeleation: PropTypes.func,
  date: PropTypes.string,
  initialSelections: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.string,
    end: PropTypes.string,
  })),
  onChange: PropTypes.func.isRequired,
  touchToDeleteSelection: PropTypes.bool,
};


import moment from 'moment';
import momentTimezone from 'moment-timezone';

import { HOUR_IN_PIXELS, MINUTE_IN_PIXELS, ONE_WEEK_MINUTES, DAYS_IN_WEEK } from './Constants';

export const getIncludedEvents = (events, dayStart, dayEnd) => {
  return events.filter(({ start, end, allDay }) => {
    if (allDay) {
      return dayStart >= start && dayStart < end;
    }
    return (dayStart <= start && start < dayEnd) ||
      (dayStart < end && end < dayEnd);
  });
}


export const inSameDay = (dateA, dateB, timeZone) => {
  return momentTimezone.tz(dateA, timeZone).format('YYYYMMDD') ===
    momentTimezone.tz(dateB, timeZone).format('YYYYMMDD');
}

export const positionInDay = (withinDay, date, timeZone) => {
  if (!timeZone) {
    throw new Error('Missing timeZone');
  }
  if (!inSameDay(date, withinDay, timeZone)) {
    if (date < withinDay) {
      return 0;
    }
    return 24 * HOUR_IN_PIXELS;
  }
  const mom = momentTimezone.tz(date, timeZone);
  return (
    (mom.hours() * HOUR_IN_PIXELS) +
    (mom.minutes() * MINUTE_IN_PIXELS)
  );
}

function formatTime(date, timeConvention) {
  if (timeConvention === '12h') {
    return date.format('ha');
  }
  return date.format('HH');
}

export const hours = (timeConvention) => {
  const result = [];
  const date = moment().minutes(0).seconds(0).milliseconds(0);
  for (let i = 0; i < 24; i++) {
    date.hour(i);
    result.push(formatTime(date, timeConvention));
  }
  return result;
}

export const hasOverlap = (events, start, end, ignoreIndex) => {
  for (let i = 0; i < events.length; i++) {
    if (i === ignoreIndex) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const selection = events[i];
    if (selection.start > start && selection.start < end) {
      // overlapping start
      return selection.start;
    }
    if (selection.end > start && selection.end < end) {
      // overlapping end
      return selection.end;
    }
    if (selection.start <= start && selection.end >= end) {
      // inside
      return selection.start;
    }
  }
  return undefined;
}

export const toDate = (day, pixelsFromTop, timeZone) => {
  if (!timeZone) {
    throw new Error('Missing timeZone');
  }
  const m = momentTimezone.tz(day, timeZone);
  const hours = Math.floor(pixelsFromTop / HOUR_IN_PIXELS);
  const minutes = Math.ceil(((pixelsFromTop % HOUR_IN_PIXELS) / HOUR_IN_PIXELS) * 60);
  m.hour(hours).minutes(minutes).seconds(0).milliseconds(0);
  return m.toISOString();
}

export const dateIntervalString = (fromDate, toDate, timeZone) => {
  const from = momentTimezone.tz(fromDate, timeZone);
  const to = momentTimezone.tz(toDate, timeZone);
  if (from.month() === to.month()) {
    return [
      from.format('MMM D'),
      '–', // en dash
      to.format('D'),
    ].join(' ');
  }
  return [
    from.format('MMM D'),
    '–', // en dash
    to.format('MMM D'),
  ].join(' ');
}

export const weekAt = (weekStartsOn, atDate, timeZone) => {
  if (!timeZone) {
    throw new Error('Missing timeZone');
  }
  // Create a copy so that we're not mutating the original
  const date = momentTimezone.tz(atDate, timeZone);
  if (date.day() === 0 && weekStartsOn === 'monday') {
    // We want sunday to be the last day here, so go back to saturday to make
    // sure we end up with the right week interval.
    date.add(-1, 'day');
  }

  // Set the clock to noon so that calculations to get following/previous days
  // work despite daylight savings time. We have to use local time (as opposed
  // to `setHoursUTC` so that we're not accidentally changing the date.
  date.hour(12).minute(0).second(0).millisecond(0);
  date.day(weekStartsOn === 'monday' ? 1 : 0);

  const start = momentTimezone.tz(date, timeZone);
  start.hour(0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push({
      date: date.toISOString(),
      name: date.format('dddd'),
      abbreviated: date.format('ddd'),
    });
    date.weekday(date.weekday() + 1);
  }
  const end = momentTimezone.tz(date, timeZone);
  end.hour(0);
  return {
    days,
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export const makeRecurring = ({ start, end }, timeZone, weekStartsOn) => {
  if (!timeZone) {
    throw new Error('Missing timeZone');
  }
  if (!weekStartsOn) {
    throw new Error('Missing weekStartsOn');
  }
  const weekStart = momentTimezone.tz(start, timeZone)
    .hour(0)
    .minute(0)
    .seconds(0)
    .milliseconds(0);

  // To avoid DST issues, move to the first week of the year (which should be
  // DST free).
  weekStart.week(0);
  const startM = momentTimezone.tz(start, timeZone).week(0);
  const endM = momentTimezone.tz(end, timeZone).week(0);

  weekStart.day(weekStartsOn === 'monday' ? 1 : 0);
  const weekStartMs = weekStart.toISOString().getTime();
  let startMins = (startM.toISOString().getTime() - weekStartMs) / 60000;
  let endMins = (endM.toISOString().getTime() - weekStartMs) / 60000;

  if (startMins < 0) {
    // This happens when the event starts on a sunday, but monday is set to
    // first day.
    startMins = ONE_WEEK_MINUTES + startMins;
    endMins = ONE_WEEK_MINUTES + endMins;
  }
  return {
    start: startMins,
    end: endMins,
  };
}

export const validateDays = (propValue, key, componentName, location, propFullName) => {
  if (!DAYS_IN_WEEK.includes(propValue[key])) {
    return new Error(`Invalid prop ${propFullName} supplied to ${componentName}. Validation failed.`);
  }
  return true;
}

// event store 

function compareDates(a, b) {
  return a.start < b.start ? -1 : 1;
}

function find(arr, func) {
  for (let i = 0; i < arr.length; i++) {
    if (func(arr[i])) {
      return arr[i];
    }
  }
  return undefined;
}

function groupEvents(events) {
  const groups = [];
  events.forEach((event) => {
    // Add all allDay events in separate groups
    if (!event.allDay) {
      return;
    }
    groups.push({
      start: event.start,
      end: event.end,
      columns: [[event]],
    });
  });

  let currentGroup;
  events.forEach((event) => {
    if (event.allDay) {
      // ignore
      return;
    }
    if (currentGroup && event.start >= currentGroup.end) {
      currentGroup = undefined;
    }
    if (currentGroup) {
      const existingCol = find(currentGroup.columns,
        column => !!find(column, ({ end }) => end <= event.start));
      if (existingCol) {
        existingCol.push(event);
      } else {
        currentGroup.columns.push([event]);
      }
    }
    if (!currentGroup) {
      currentGroup = {
        start: event.start,
        end: event.end,
        columns: [[event]],
      };
      groups.push(currentGroup);
    }
    currentGroup.end = Math.max(currentGroup.end, event.end);
  });
  return groups;
}

function flattenGroups(groups) {
  const result = [];
  groups.forEach((group) => {
    const columnsLength = group.columns.length;
    group.columns.forEach((events, columnIndex) => {
      events.forEach((event) => {
        let colspan = 1;
        // Peek ahead to see if the event fits in another column
        let j = columnIndex + 1;
        while (
          j < group.columns.length &&
          !hasOverlap(group.columns[j], event.start, event.end)
        ) {
          colspan++;
          j++;
        }
        result.push(Object.assign({
          width: colspan / columnsLength,
          offset: columnIndex / columnsLength,
        }, event));
      });
    });
  });
  result.sort(compareDates);
  return result;
}

function normalize(events, timeZone) {
  return events.map(event => Object.assign({}, event, {
    start: momentTimezone.tz(event.start, timeZone).toISOString(),
    end: momentTimezone.tz(event.end, timeZone).toISOString(),
  }));
}

export const decorateEvents = (events, timeZone) => {
  // Make sure events are sorted by start time
  const orderedByStartTime = normalize(events, timeZone).sort(compareDates);
  const groups = groupEvents(orderedByStartTime);
  return flattenGroups(groups);
}

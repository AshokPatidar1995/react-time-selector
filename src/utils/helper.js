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

export const positionInDay = (date) => {
  // if (!timeZone) {
  //   throw new Error('Missing timeZone');
  // }
  // if (!inSameDay(date, withinDay, timeZone)) {
  //   if (date < withinDay) {
  //     return 0;
  //   }
  //   return 24 * HOUR_IN_PIXELS;
  // }
  const mom = moment.utc(date, 'H:mm');
  if (mom.hours() == 0 && mom.minute() === 0) {
    return (
      (24 * HOUR_IN_PIXELS) + (23 * MINUTE_IN_PIXELS)
    );
  }
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

export const toDate = (pixelsFromTop) => {
  const m = moment.utc();
  const hours = Math.floor(pixelsFromTop / HOUR_IN_PIXELS);
  const minutes = Math.ceil(((pixelsFromTop % HOUR_IN_PIXELS) / HOUR_IN_PIXELS) * 60);
  m.hour(hours).minutes(minutes).seconds(0).milliseconds(0);
  return m.format('H:mm');
}


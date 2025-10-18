import TimeSettings from '../models/timeSettingsModel.js';

// Build a Date (UTC instant) for a given local time in a specific timezone
const buildTzDate = (refDate, tz, hhmm) => {
  const [hh, mm] = (hhmm || '00:00').split(':').map(v => parseInt(v, 10));
  const ymd = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(refDate);
  const year = parseInt(ymd.find(p => p.type === 'year').value, 10);
  const month = parseInt(ymd.find(p => p.type === 'month').value, 10);
  const day = parseInt(ymd.find(p => p.type === 'day').value, 10);
  const naiveUtcMs = Date.UTC(year, month - 1, day, hh, mm, 0, 0);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const parts = dtf.formatToParts(new Date(naiveUtcMs));
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';
  const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  let offsetMs = 0;
  if (m) {
    const sign = m[1] === '+' ? 1 : -1;
    const oh = parseInt(m[2] || '0', 10);
    const om = parseInt(m[3] || '0', 10);
    offsetMs = sign * (oh * 60 + om) * 60 * 1000;
  } else {
    const naiveUtcDate = new Date(naiveUtcMs);
    const tzLocal = new Date(naiveUtcDate.toLocaleString('en-US', { timeZone: tz })).getTime();
    offsetMs = tzLocal - naiveUtcMs;
  }
  return new Date(naiveUtcMs - offsetMs);
};

export const calculateShopStatus = async (now = new Date()) => {
  const settings = await TimeSettings.getCurrentSettings();
  const tz = settings.timezone;
  const isOpen = settings.isShopOpen();

  const dowShort = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
  const dayIndexMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const currentDay = dayIndexMap.indexOf(dowShort);
  const today = now.toLocaleDateString('en-CA', { timeZone: tz });

  const specialDay = settings.specialDays.find(day => {
    const specialDate = new Date(day.date).toLocaleDateString('en-CA', { timeZone: tz });
    return specialDate === today;
  });

  const isWeekend = currentDay === 0 || currentDay === 6;
  const pauses = settings.dailyPauseWindows || [];
  let operatingHours;
  let message = '';

  if (specialDay) {
    if (specialDay.isClosed) {
      operatingHours = null;
      message = specialDay.description || 'Closed for special day';
    } else {
      operatingHours = {
        startTime: specialDay.startTime || (isWeekend ? settings.weekend.startTime : settings.weekday.startTime),
        endTime: specialDay.endTime || (isWeekend ? settings.weekend.endTime : settings.weekday.endTime)
      };
      message = specialDay.description || '';
    }
  } else {
    const schedule = isWeekend ? settings.weekend : settings.weekday;
    operatingHours = schedule.isActive ? { startTime: schedule.startTime, endTime: schedule.endTime } : null;
  }

  let closingTime = null;
  let nextOpenTime = null;

  if (isOpen && operatingHours) {
    const nextOccurrence = (ref, hhmm) => {
      let d = buildTzDate(ref, tz, hhmm);
      if (d <= now) {
        const nextRef = new Date(ref);
        nextRef.setUTCDate(nextRef.getUTCDate() + 1);
        d = buildTzDate(nextRef, tz, hhmm);
      }
      return d;
    };
    const endCandidate = nextOccurrence(now, operatingHours.endTime);
    const pauseCandidates = pauses
      .filter(w => w?.startTime && w?.endTime)
      .map(w => nextOccurrence(now, w.startTime))
      .filter(d => d <= endCandidate);
    const allCandidates = [endCandidate, ...pauseCandidates].filter(Boolean);
    const closing = allCandidates.reduce((min, d) => (!min || d < min ? d : min), null);
    closingTime = closing ? closing.toISOString() : null;
  }

  if (!isOpen) {
    if (operatingHours) {
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, timeZone: tz, hour: '2-digit', minute: '2-digit' });
      let target = null;
      for (const w of pauses) {
        if (!w?.startTime || !w?.endTime) continue;
        const within = (w.startTime === w.endTime) ||
          (w.startTime < w.endTime ? (currentTime >= w.startTime && currentTime <= w.endTime)
                                    : (currentTime >= w.startTime || currentTime <= w.endTime));
        if (within) { target = w.endTime; break; }
      }
      if (!target) target = operatingHours.startTime;
      let opening = buildTzDate(now, tz, target);
      if (opening <= now) {
        const nextRef = new Date(now);
        nextRef.setUTCDate(nextRef.getUTCDate() + 1);
        opening = buildTzDate(nextRef, tz, target);
      }
      nextOpenTime = opening.toISOString();
    } else {
      // next active day
      let daysToAdd = 1; let found = false;
      while (!found && daysToAdd <= 7) {
        const futureRef = new Date(now);
        futureRef.setUTCDate(futureRef.getUTCDate() + daysToAdd);
        const dow = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(futureRef);
        const idx = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(dow);
        const futureSchedule = (idx === 0 || idx === 6) ? settings.weekend : settings.weekday;
        if (futureSchedule.isActive) {
          const opening = buildTzDate(futureRef, tz, futureSchedule.startTime);
          nextOpenTime = opening.toISOString();
          found = true;
        } else {
          daysToAdd++;
        }
      }
    }
  }

  return {
    isOpen,
    nextOpenTime,
    closingTime,
    currentTime: now.toISOString(),
    timezone: settings.timezone,
    operatingHours,
    message
  };
};

export default calculateShopStatus;

/** @about System Timer 1.0.0 @min_api 4.0 @author: Silver, Zepp Health. @license: MIT */
import { createSysTimer, stopTimer } from "@zos/timer";

function SystemTimer() {
  /** @private */
  this.MAX_TIMERS = 10;
  /** @private */
  this.active_timers = 0;
  /** @private */
  this.timer_ids = new Set();

  /** @private */
  this.reminder_last_time = Date.now();
  /** @private */
  this.reminder_interval = 60000; // 1 min
  /** @private */
  this.is_reminder_enabled = false; // false?
}

SystemTimer.prototype = {

  /** Create a one-shot timer. @param {function} callback @param {number} delay @param {...any} args @returns {number|null} */
  setTimeout(callback, delay, ...args) {
    return this.createTimer(false, delay, callback, ...args);
  },

  /** Create a recurring timer. @param {function} callback @param {number} delay @param {...any} args @returns {number|null} */
  setInterval(callback, delay, ...args) {
    return this.createTimer(true, delay, callback, ...args);
  },

  /** Execute immediately. @param {function} callback @param {...any} args @returns {number|null} */
  setImmediate(callback, ...args) {
    return this.createTimer(false, 0, callback, ...args);
  },

  /** Stop a timer by a specific ID. @param {number} id */
  clear(id) {
    if (this.use_systimer) {
      if (id !== null && this.timer_ids.has(id)) {
        stopTimer(id);
        this.active_timers--;
        this.timer_ids.delete(id);
      }
    } else {
      clearTimeout(id);
      clearInterval(id);
    }
  },

  /** Stop all running system timers. */
  stopAllTimers() {
    for (const id of this.timer_ids) {
      if (this.use_systimer) {
        stopTimer(id);
      } else {
        clearTimeout(id);
        clearInterval(id);
      }
    }
    this.timer_ids.clear();
    this.active_timers = 0;
  },

  /**
   * Set options for the SystemTimer.
   * @param {Object} options - The options to set.
   * @param {boolean} [options.use_systimer] - Set whether to use the system timer or fallback to JS timer.
   * @param {boolean} [options.reminder] - Enable or disable the periodic reminder about running system timers.
   * @param {number} [options.reminder_interval] - Set the interval for reminders in milliseconds (default 1 min = 60000ms).
   */
  setOptions(options = {}) {
    const { use_systimer, reminder, reminder_interval } = options;

    if (reminder !== undefined) {
      this.is_reminder_enabled = reminder;
    }

    if (reminder_interval !== undefined) {
      if (reminder_interval >= 1000) {
        this.reminder_interval = reminder_interval;
      } else {
        this.reminder_interval = 1000;
      }
    }

    if (use_systimer !== undefined) {
      this.use_systimer = use_systimer;
      if (this.use_systimer && typeof createSysTimer === 'undefined') {
        console.log("System Timer is not available, using JS timer");
        this.use_systimer = false;
      }
    }
  },

  /**
   * Get current options and status of the SystemTimer.
   * @returns {Object} The current options and status.
   * @property {number} active_timers - The number of currently active timers.
   * @property {boolean} use_systimer - Whether the System Timer used.
   * @property {boolean} reminder - Whether the periodic reminder is enabled.
   * @property {number} reminder_interval - The interval for reminders in milliseconds.
   */
  getStatus() {
    return {
      active_timers: this.active_timers,
      use_systimer: this.use_systimer,
      reminder: this.is_reminder_enabled,
      reminder_interval: this.reminder_interval,
    };
  }
};

/** @private */
SystemTimer.prototype.checkAndRemind = function () {
  const now = Date.now();
  if (this.is_reminder_enabled && now - this.reminder_last_time >= this.reminder_interval) {
    this.reminder_last_time = now;
    // TODO: fix
    // console.log(`INFO: (${this.active_timers}) system timers are running`);
  }
}

/** @private */
SystemTimer.prototype.createTimer = function (is_repeat, delay, callback, ...args) {

  if (typeof callback !== 'function') {
    console.log("ERR: Callback must be a function");
    return null;
  }

  if (this.use_systimer) {
    if (this.active_timers >= this.MAX_TIMERS) {
      console.log("WARN: Cannot create more than 10 system timers");
      return null;
    }

    if (delay >= 0 && delay < 1000) {
      delay = 1000;
    }

    const cb_with_reminder = () => {
      this.checkAndRemind();
      callback(...args);
      if (!is_repeat) {
        this.active_timers--;
        this.timer_ids.delete(id);
      }
    };

    const id = createSysTimer(is_repeat, delay, cb_with_reminder);

    if (id) {
      this.active_timers++;
      this.timer_ids.add(id);
    } else {
      console.log("Failed to create system timer");
    }

    return id;
  } else { // fallback: use default JS timer methods
    if (is_repeat) {
      return setInterval(callback, delay, ...args);
    } else {
      return setTimeout(callback, delay, ...args);
    }
  }
};

/** @type {SystemTimer} */
const SysTimer = new SystemTimer();

export { SysTimer };
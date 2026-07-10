export const times = {
  second: 1000,
  get minute() {return this.second * 60},
  get hour() {return this.minute * 60},
  get day() {return this.hour * 24},
  get week() {return this.day * 7},
  get month() {return this.day * 30},
  get year() {return Math.round(365.2425 * this.day)}
}
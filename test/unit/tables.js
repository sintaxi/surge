var should = require('should')
var tables = require('../../lib/util/tables')

// minimal analytics payload in the shape exports.traffic consumes.
// routes are keyed by date; every date in range gets an entry.
var payload = function (dates, uniquesPerDay) {
  var s = uniquesPerDay
  var t = s.reduce(function (a, b) { return a + b }, 0)
  var byDate = {}
  dates.forEach(function (d) { byDate[d] = [{ count: s[0] || 0, name: '/' }] })
  return {
    range: dates,
    normalizedAtInWords: '1 minute ago',
    traffic: {
      uniques:     { s: s.slice(), t: t },
      visits:      { s: s.slice(), t: t },
      connections: { s: s.slice(), t: t }
    },
    encryption: { cE: { t: t }, cU: { t: 0 }, cRe: { t: 0 }, cRu: { t: 0 } },
    cache: { hit: { t: t }, miss: { t: 0 } },
    success: byDate, fail: byDate, redirect: byDate, source: byDate
  }
}

describe('tables', function () {

  describe('calculateDays', function () {

    it('indexes the last three days when 3+ days exist', function () {
      var days = tables.calculateDays(payload(['2026-06-30', '2026-07-01', '2026-07-02'], [5, 9, 2]))
      days.todayIndex.should.equal(2)
      days.yesterdayIndex.should.equal(1)
      days.dayBeforeIndex.should.equal(0)
      days.focusDayWord.should.equal('yesterday') // today (2) not busier than yesterday (9)
      days.focusDayDate.should.equal('2026-07-01')
    })

    it('focuses on today when today has more traffic', function () {
      var days = tables.calculateDays(payload(['2026-07-01', '2026-07-02'], [3, 8]))
      days.focusDayWord.should.equal('today')
      days.focusDayDate.should.equal('2026-07-02')
    })

    it('clamps indexes for a 2-day range', function () {
      var days = tables.calculateDays(payload(['2026-07-01', '2026-07-02'], [9, 3]))
      days.dayBeforeIndex.should.equal(0)
      should(days.dayBeforeDate).be.ok()
      should(days.focusDayDate).be.ok()
    })

    it('handles a 1-day range without undefined dates', function () {
      var days = tables.calculateDays(payload(['2026-07-02'], [4]))
      days.todayIndex.should.equal(0)
      days.yesterdayIndex.should.equal(0)
      days.dayBeforeIndex.should.equal(0)
      days.focusDayWord.should.equal('today')
      days.focusDayDate.should.equal('2026-07-02')
    })

  })

  describe('traffic', function () {

    it('renders a day-one site with zero traffic (no crash, no NaN)', function () {
      var out = tables.traffic(payload(['2026-07-02'], [0])).toString()
      out.should.not.match(/NaN/)
      out.should.not.match(/undefined/)
    })

    it('renders a 2-day site without crashing', function () {
      var out = tables.traffic(payload(['2026-07-01', '2026-07-02'], [5, 10])).toString()
      out.should.not.match(/NaN/)
      out.should.not.match(/undefined/)
    })

    it('shows uniques delta as a percent change, not a ratio', function () {
      // the trend compares the two most recent COMPLETE days: 5 -> 10 is
      // +100% regardless of the partial count on today (the last entry)
      var doubled = tables.traffic(payload(['2026-06-30', '2026-07-01', '2026-07-02'], [5, 10, 1])).toString()
      doubled.should.match(/100% ↗/)

      var flat = tables.traffic(payload(['2026-06-30', '2026-07-01', '2026-07-02'], [7, 7, 1])).toString()
      flat.should.not.match(/1% ↗/)
    })

    it('shows no delta on a 2-day site (only one complete day)', function () {
      var out = tables.traffic(payload(['2026-07-01', '2026-07-02'], [5, 10])).toString()
      out.should.not.match(/% ↗/)
      out.should.not.match(/% ↘/)
    })

  })

  describe('cert', function () {

    var cert = function (autoRenew) {
      var c = {
        subject: 'example.surge.sh',
        issuer: "Let's Encrypt",
        subjectAltNames: ['example.surge.sh'],
        expInDays: 42
      }
      if (autoRenew !== undefined) c.autoRenew = autoRenew
      return c
    }

    it('renders autoRenew true', function () {
      tables.cert(cert(true)).toString().should.match(/true/)
    })

    it('renders autoRenew false', function () {
      tables.cert(cert(false)).toString().should.match(/false/)
    })

    it('renders a cert with autoRenew missing instead of crashing', function () {
      tables.cert(cert(undefined)).toString().should.match(/false/)
    })

  })

})

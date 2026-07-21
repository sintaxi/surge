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

  describe('certsShort', function () {

    var cert = function (overrides) {
      var c = {
        issuer: "Let's Encrypt",
        subjectAltNames: ['example.com', '*.example.com'],
        expInDays: 42,
        certName: 'provisioned',
        autoRenew: true
      }
      Object.keys(overrides || {}).forEach(function (k) { c[k] = overrides[k] })
      return c
    }

    it('renders one condensed line per cert — names and renewal, no issuer', function () {
      var out = tables.certsShort([cert()], 100).toString()
      out.should.match(/CERT/)
      out.should.match(/example\.com, \*\.example\.com/)
      out.should.match(/auto-renew/)
      out.should.not.match(/Let's Encrypt/)
      out.should.not.match(/expires/)
    })

    it('mirrors the instances table column widths so the boxes align', function () {
      // label 10, domain 18, city 23, ip 21, provider 13, status 11 —
      // cells are label / domain+city+ip / provider+status
      var stripCodes = function (s) { return s.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '') }
      var out = stripCodes(tables.certsShort([cert()], [10, 18, 23, 21, 13, 11]).toString())
      var top = out.split('\n')[0]
      top.indexOf('┬').should.equal(11)                    // after the label column
      top.indexOf('┬', 12).should.equal(76)                // domain(18) + city(23) + ip(21) + 2 junctions
      top.indexOf('┬', 77).should.equal(-1)                // no further junction — verdict cell runs to the edge
      top.length.should.equal(103)                         // full table width
    })

    it('keeps the expiry countdown for an uploaded pem — that renewal is the user\'s', function () {
      var out = tables.certsShort([cert({ certName: 'uploaded', autoRenew: false })], 100).toString()
      out.should.match(/expires in 42 days/)
      out.should.not.match(/auto-renew/)
    })

    it('treats the platform wildcard as ours — auto-renew, no countdown', function () {
      var out = tables.certsShort([cert({ subjectAltNames: ['*.surge.sh', 'surge.sh'], certName: 'uploaded', autoRenew: false, expInDays: 149 })], 100, 'surge.sh').toString()
      out.should.match(/auto-renew/)
      out.should.not.match(/expires/)
    })

    it('reports an expired uploaded pem', function () {
      tables.certsShort([cert({ certName: 'uploaded', autoRenew: false, expInDays: -3 })], 100)
        .toString().should.match(/expired 3 days ago/)
    })

    it('renders cert and dns rows together in one verdicts box, ruled apart', function () {
      var out = tables.verdicts([cert()], { via: 'ns' }, 100).toString()
      out.should.match(/CERT/)
      out.should.match(/auto-renew/)
      out.should.match(/DNS/)
      out.should.match(/using Surge Name Servers/)
      out.should.match(/geo-aware/)
      out.should.match(/├/)   // a rule separates the rows
    })

    it('renders a pending cert row when there are no certs yet', function () {
      var out = tables.verdicts([], { via: null }, 100).toString()
      out.should.match(/CERT/)
      out.should.match(/none/)
      out.should.match(/waiting on dns/)
      // dns pointing at us makes the missing cert our move, not the user's
      tables.verdicts([], { via: 'ns' }, 100).toString().should.match(/securing/)
    })

    it('reports every dns verdict in the box', function () {
      tables.verdicts([], { via: 'cname' }, 100).toString().should.match(/using Surge CNAME Record/)
      var a = tables.verdicts([], { via: 'a' }, 100).toString()
      a.should.match(/using Surge A Record/)
      a.should.match(/not geo-aware/)
      var unresolved = tables.verdicts([], { via: null }, 100).toString()
      unresolved.should.match(/not resolving to Surge/)
      unresolved.should.match(/action required/)
    })

  })

  describe('instances', function () {

    var servers = [
      { type: 'NS', domain: 'ns1.surge.world' },
      { type: 'NS', domain: 'ns2.surge.world' },
      { type: 'CNAME', domain: 'geo.surge.sh' },
      { type: 'HTTP', domain: 'sfo.surge.sh', location: 'US, San Francisco', ip: '138.197.235.123', provider: 'D.Ocean', status: 'OK', statusColor: 'green', confirmation: 'ok', confirmationColor: 'green' }
    ]

    // colors chop the phrases mid-string — match on the uncolored text
    var strip = function (s) { return s.replace(/\[[0-9;]*m/g, '') }

    it('renders no header when the verdict is present — the verdicts box carries it', function () {
      var out = strip(tables.instances(servers, { via: 'ns' }).toString())
      out.should.not.match(/via Surge/)
      out.should.not.match(/DNS/)
      out.should.not.match(/ns1\.surge\.world/)
      out.should.match(/sfo\.surge\.sh/)
    })

    it('the verdicts box built from the fleet widths matches the fleet table width', function () {
      var fleet  = strip(tables.instances(servers, { via: 'ns' }).toString())
      var widths = fleet.split('\n').slice(-1)[0].slice(1, -1).split('┴').map(function(s){ return s.length })
      var box    = strip(tables.verdicts([], { via: 'ns' }, widths).toString())
      box.split('\n')[0].length.should.equal(fleet.split('\n')[0].length)
    })

    it('replaces the static nameserver advice when the verdict is present', function () {
      tables.instances(servers, { via: 'ns' }).toString().should.not.match(/ns1\.surge\.world/)
    })

    it('falls back to the static nameserver advice without a verdict (old server)', function () {
      var out = tables.instances(servers).toString()
      out.should.match(/ns1\.surge\.world/)
      out.should.match(/geo\.surge\.sh/)
    })

  })

})

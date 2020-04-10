var z = require('zero-fill')
  , n = require('numbro')
  , Phenotypes = require('../../../lib/phenotype')

/*
 Licence: Creative Common (Zero CC0)
 Contact: king_fredo on reddit

 Donations are welcome! 
 ETH: 0x0e4c8a26b4bf9a03d8229d9fb6e34ff1d1713d35
 BTC: 1BXC1NQC3act5WyU94wr4vBVS7YS6BgMP8
 Verge XVG (low fees!): DKaXPhXL5THEwEh8ijgP3QFmjBwDEHovwo
*/

module.exports = {
  name: 'minmax',
  description: 'Trade if candle close is min or max of history periods.',

  getOptions: function () {
	this.option('period', 'period length, same as --period_length', String, '10s')
	this.option('period_length', 'period length, same as --period', String, '10s')
	this.option('periods', 'number of history periods', Number, 500)
	this.option('timeout_buy', 'periods after market action to wait', Number, 50)
	this.option('timeout_sell', 'periods after market action to wait', Number, 50)
  },

  calculate: function (s) {

	// Initially set buy / sell timeout to zero
    	if (typeof s.timeout_buy === 'undefined'){
    		s.timeout_buy = 0
    	}
    	if (typeof s.timeout_sell === 'undefined'){
    		s.timeout_sell = 0
    	}
  },
  onPeriod: function (s, cb) {
		
		// Find min & max close of history periods
		var arr = []
		var periods = s.options.periods
		for (let i = 0; i < periods && i < s.lookback.length; i++) {
			arr.push(s.lookback[i].close)
		}
		s.period.min = arr[0], s.period.max = arr[0];

		for (let i = 1, len=arr.length; i < len; i++) {
		let v = arr[i];
			s.period.min = (v < s.period.min) ? v : s.period.min;
			s.period.max = (v > s.period.max) ? v : s.period.max;
		}		
		// Is period close min or max? Trade if it is!
		if (s.period.close >= s.period.max && s.timeout_sell < 0) {
			s.signal = 'sell'
			s.timeout_sell = s.options.timeout_sell
		}
		else if (s.period.close <= s.period.min && s.timeout_buy < 0) {
			s.signal = 'buy'
			s.timeout_buy = s.options.timeout_buy
    		}
		else {
    		s.timeout_sell = s.timeout_sell-1
		s.timeout_buy = s.timeout_buy-1
		}
    cb()
  },

  onReport: function (s) {
    var cols = []

	//MIN MAX Indicator
	if (typeof (s.period.min && s.period.max && s.period.close) !== 'undefined') {
		color = 'grey'
		cols.push('  Min: ')
		cols.push(z(11, n(s.period.min).format('0.00000000'), ' ')[color])
		cols.push('  Max: ')
		cols.push(z(11, n(s.period.max).format('0.00000000'), ' ')[color])
		cols.push(' timeout sell: ')
		cols.push(z(6, n(s.timeout_sell).format('0000'), ' ')[color])
		cols.push(' timeout buy: ')
		cols.push(z(6, n(s.timeout_buy).format('0000'), ' ')[color])
		cols.push('  Period: ')
		if (s.period.close == (s.period.min || s.period.max)) {
			color = 'blue'
			}
		cols.push(z(11, n(s.period.close).format('0.00000000'), ' ')[color])

		}
	else {
	cols.push('                                                      ')
	}
    return cols
  },

  phenotypes: {
    // -- common
    period_length: Phenotypes.RangePeriod(1, 120, 'm'),
    min_periods: Phenotypes.Range(1, 100),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1,20),

    // -- strategy
    periods: Phenotypes.RangePeriod(20, 10000)
  }
}

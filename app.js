/* business-parser
 *
 * this is a tool for parsing business data and creating a business document
 * to put in a nosql db.  will also fill out business object with additional
 * pertinent information from yelp.com api.
 *
 */

var fs       = require('fs')
var request  = require('request')
var S        = require('string')
var _        = require('underscore')
var path     = require('path')
var nano     = require('nano')('http://localhost:5984')

// yelp api nonsense
var consumer_key = 'nMttGA-pdyXSk20Ady60NQ'
var consumer_secret = '47R_D2JGjK20j1qmlNyNRRsGWm8'
var token = '9O7nuodRovArOdoJwOESz9O4BL4xaX2m'
var token_secret = 'M0fk8as_3vsanFkMxeTEf8FpduE'
// yelp request url
var yelp_url = 'http://api.yelp.com'
// yelp oauth shit
var oauth = {
	consumer_key: consumer_key,
	consumer_secret: consumer_secret,
	token: token,
	token_secret: token_secret
}

var day = process.argv[2]
var biz
var bizs

parse_business()

function parse_business() {
	console.log("parsing businesses...")
  bizs = []
  var dealos = []
  // read data/ directory
  fs.readdir('data/', function (err, files) {
    files.map(function (file) {
      return path.join('data/', file)
    }).forEach(function (file) {
			fs.readFile(file, 'utf8', function(err, data) {
			console.log("reading file...")
			if (err) throw err

				var lines = S(data).lines()
				// console.log(lines[0]) // output restaurant name
				// create var that will hold our business obj
				// while we work on it

				biz = {
					_id: lines[0],
					name: lines[0],
					address: lines[1] + "," + lines[2],
					phone: lines[3],
					url: lines[4],
					desc: null,
					deals: null,
					hours: null,
					events: null
				}

				// now we start looking for our tags
				console.log("working on deals...")
				if (_.contains(lines, "Deals:")) {
					// raw data
					var deals = lines.slice(_.indexOf(lines, "Deals:") + 1, _.indexOf(lines, "-", _.indexOf(lines, "Deals:")))
					// reset array
					dealos = []
					// populate the array
					build_deals(deals, dealos)

					biz.deals = dealos
				}

				console.log("working on events...")
				if (_.contains(lines, "Events:")) {
					var events = lines.slice(_.indexOf(lines, "Events:"), _.indexOf(lines, "-", _.indexOf(lines, "Events:")))
					var eventos = []

					build_events(events, eventos)

					biz.events = eventos
				}

				console.log("working on hours...")
				if (_.contains(lines, "Hours:")) {
					var hours = lines.slice(_.indexOf(lines, "Hours:"), _.indexOf(lines, "-", _.indexOf(lines, "Hours:")))
					var houros = []

					build_hours(hours, houros)

					biz.hours = houros
				}
				console.log("storing everything...")
				bizs.push(biz)
				store_biz(biz)
				store_deals(biz.deals)
			})
		})
  })
}



function store_biz(biz) {
	console.log("storing business")
  var db_bizs = nano.db.use('bizs')
  db_bizs.insert(biz, function(err, body) {
    if (err) console.log(err)
    console.log(body)
  })
}

function store_deals(deals) {
	console.log("storing deals")
  var db_deals = nano.use('deals')
  db_deals.bulk({"docs": deals}, function(err, body) {
    if (err) console.log(err)
    console.log(body)
  })
}

function build_events(events, eventos) {
  events = _.rest(events)
  events = events.map(function (element) {
    return element.split(': ')
  })

  events.forEach(function (element) {
    eventos.push({
      day: element[0],
      text: element[1]
    })
  })
}

function build_hours(hours, houros) {
  hours = _.rest(hours)
  hours = hours.map(function (element) {
    return element.split(': ')
  })

  hours.forEach(function (element) {
    houros.push({
      day: element[0],
      hours: element[1]
    })
  })
}

// deals: [{
//   text:String,
//   day:String,
//   hours:String,
//   drink:String,
//   eat:boolean,
//   price:float,
//   place:String
// }]
function build_deals(deals, dealos) {
  deals = _.compact(deals)

  deals = deals.map(function (element) {
    return element.split(': ')
  })

  deals.forEach(function (element) {
    // handle multiple days
    if (S(element).contains(',')) {
      var day = element[0].split(', ')
      day.forEach(function (d) {
        // check for hours
        var h = null;
        if (S(d).contains(' ')) {
          var dh = S(d).split(' ')
          d = dh[0] // set d to just the day
          h = dh[1] // set h to be the hours
        }
        // parse out the dollar price if we have one
        var price = null;
        if (S(element[1]).contains('$')) {
          var strprice = S(element[1]).match('(\\$[0-9]+(?:\\.[0-9][0-9])?)(?![\\d])')
          // console.log("STRPRICE:")
          // console.log(strprice[0])
          price = strprice[0]
        }
        // check if food/drink boolean was included
        var drink = false;
        var eat = false;
        if (element[2]) {
          drink = S(element[2]).toBoolean()
          eat = !S(element[2]).toBoolean()
        }
        dealos.push({
          _id: element[1],
          day: d,
          text: element[1],
          hours: h,
          drink: drink,
          eat: eat,
          price: price,
					place: biz.name
        })
      })
    } else {
      // check for hours
      if (S(d).contains(' ')) {
        var dh = S(d).split(' ')
        d = dh[0] // set d to just the day
        var h = dh[1] // set h to be the hours
      }
      // parse out the dollar price if we have one
      if (S(element[1]).contains('$')) {
        var strprice = S(element[1]).match('(\\$[0-9]+(?:\\.[0-9][0-9])?)(?![\\d])')
        // console.log("STRPRICE:")
        // console.log(strprice[0])
      }
      // check if food/drink boolean was included
      var drink = false;
      var eat = false;
      if (element[2]) {
        drink = S(element[2]).toBoolean()
        eat = !S(element[2]).toBoolean()
      }
      dealos.push({
        _id: element[1],
        day: d,
        text: element[1],
        hours: h,
        drink: drink,
        eat: eat,
        price: strprice[0],
        place: biz.name
      })
    }
  })
}

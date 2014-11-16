FORMATTING INSTRUCTIONS FOR DATA DOCUMENT
=========================================

the first five lines should contain information about the business

0: name
1: first line add
2: second line add
3: phone
4: url

then, in any order (and not all are required) you can include the following
sections:

- hours
- deals
- events

each section is separated by a single dash (-)

Hours:

Day Hour-range, repeat for each day open

Events:

Day: event title - event text

Deals:

Day Hour-range [, repeat for each day]: deal text[: true if drink false if food]


BUSINESS DATA
------------------
```
{
  name:String,
  desc:String,
  address:String,
  phone:String,
  url:String,
  hours: [{
    day:String,
    hours:String
  }],
  events: [{
    day:String,
    text:String
  }],
  deals: [{
    text:String,
    day:String,
    hours:String,
    drink:String,
    eat:boolean,
    price:float
  }]
}
```

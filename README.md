# Uber Analytics #
Interactive analytics dashboard of Uber pricing data

## Stack ##
- D3.js
- Keen.io

## Specifications ##
The following data specification was used to compse this visual:
``
{ 'MTWTF': { 0: { maxFare: [fare, ..., fare],
                  minDare: [fare, ..., fare],
                  surge: [surge, ..., surge]
                 }
             .
             .
             .
             23:
           },
  'SS':    { 0: { maxFare: [fare, ..., fare],
                  minDare: [fare, ..., fare],
                  surge: [surge, ..., surge]
                 }
             .
             .
             .
             23:
           }
}
``
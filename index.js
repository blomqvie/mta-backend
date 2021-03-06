import express from 'express'
import Mta from 'mta-gtfs'
import 'dotenv/config'
import mcache from 'memory-cache'
import _ from 'lodash'
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import differenceInMinutes from 'date-fns/difference_in_minutes'

const app = express()
const mta = new Mta({
    key: process.env.MTA_API_KEY
})

const cache = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url
        let cachedBody = mcache.get(key)
        if(cachedBody) {
            res.send(cachedBody)
            return
        }
        else {
            res.sendResponse = res.send
            res.send = (body) => {
                mcache.put(key, body, duration * 1000)
                res.sendResponse(body)
            }
            next()
        }
    }
}

const feedRegex = '1|26|16|21|2|11|31|36|51'
const directionRegex = 'N|S'

const decorateDeparture = d => {
    const arrivalTime = new Date(d.arrivalTime * 1000)
    return {
        ...d,
        arrivalInMinutes: differenceInMinutes(arrivalTime, new Date()),
        arrivalText: distanceInWordsToNow(arrivalTime)
    }
}

app.get(`/schedule/:feedId(${feedRegex})/stop/:stopId/direction/:direction(${directionRegex})`, cache(10), (req, res, next) => {
    const stopId = req.params.stopId
    const feedId = req.params.feedId
    const direction = req.params.direction
    mta.schedule(stopId, feedId)
        .then(schedule => {
            const scheduleObj = schedule["schedule"]
            if(scheduleObj) {
                const nextDepartures = scheduleObj[stopId][direction]
                const mappedDepartures = _.map(nextDepartures, decorateDeparture)
                res.send(mappedDepartures)
            } else {
                res.send({})
            }
        })
        .catch(next)
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

import express from 'express'
import Mta from 'mta-gtfs'
import 'dotenv/config'
import mcache from 'memory-cache'

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


app.get('/schedule/:feedId/stop/:stopId/direction/:direction', cache(30), (req, res, next) => {
    const stopId = req.params.stopId
    const feedId = req.params.feedId
    const direction = req.params.direction
    mta.schedule(stopId, feedId)
        .then(schedule => {res.send(schedule["schedule"][stopId][direction])})
        .catch(next)
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

import express from 'express'
import Mta from 'mta-gtfs'
import 'dotenv/config'

const app = express()
const mta = new Mta({
    key: process.env.MTA_API_KEY
})

app.get('/schedule/:feedId/stop/:stopId/direction/:direction', (req, res, next) => {
    const stopId = req.params.stopId
    const feedId = req.params.feedId
    const direction = req.params.direction
    mta.schedule(stopId, feedId)
        .then(schedule => {res.send(schedule["schedule"][stopId][direction])})
        .catch(next)
})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})

import { Router } from 'express'
import { getHistoricHomeData, getOpenRestaurantDetail } from './repository.js'

const router = Router()

router.get('/home', (req, res) => {
  const data = getHistoricHomeData()
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/industry/:slug/detail', (req, res) => {
  const data = getOpenRestaurantDetail(req.params.slug)
  if (!data) {
    return res.status(404).json({ code: 404, msg: 'industry not found' })
  }

  res.json({ code: 200, data, msg: 'success' })
})

export default router

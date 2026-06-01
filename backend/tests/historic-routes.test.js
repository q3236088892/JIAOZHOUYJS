import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

async function getAuthToken() {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' })
  return res.body.data.token
}

describe('historic routes', () => {
  it('GET /api/historic/public/home should work', async () => {
    const res = await request(app).get('/api/historic/public/home')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(Array.isArray(res.body.data.industries)).toBe(true)
  })

  it('GET /api/historic/public/industry/openRestaurant/detail should work', async () => {
    const res = await request(app).get('/api/historic/public/industry/openRestaurant/detail')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(res.body.data.leftMenu.length).toBeGreaterThan(0)

    const leftAnchors = res.body.data.leftMenu.flatMap((s) =>
      s.categories.flatMap((c) => c.items.map((i) => i.anchorKey))
    )
    const rightAnchors = res.body.data.stages.flatMap((s) =>
      s.categories.flatMap((c) => c.topics.map((t) => t.anchor_key))
    )
    expect(leftAnchors).toEqual(rightAnchors)
  })

  it('GET /api/admin/historic/nav-items should work', async () => {
    const token = await getAuthToken()
    const res = await request(app).get('/api/admin/historic/nav-items').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('POST /api/admin/historic/nav-items should validate required fields', async () => {
    const token = await getAuthToken()
    const res = await request(app).post('/api/admin/historic/nav-items').set('Authorization', `Bearer ${token}`).send({
      title: '',
      link_type: 'internal',
      link_target: '/historicDistrict'
    })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe(400)
  })

  it('admin nav CRUD should work', async () => {
    const token = await getAuthToken()
    const auth = (req) => req.set('Authorization', `Bearer ${token}`)
    const marker = `\u6d4b\u8bd5\u5bfc\u822a-${Date.now()}`

    const createRes = await auth(request(app)
      .post('/api/admin/historic/nav-items'))
      .send({
        title: marker,
        link_type: 'internal',
        link_target: '/historicDistrict',
        open_mode: '_self'
      })

    expect(createRes.status).toBe(200)
    expect(createRes.body.code).toBe(200)

    const listAfterCreate = await auth(request(app).get('/api/admin/historic/nav-items'))
    const created = listAfterCreate.body.data.find((x) => x.title === marker)
    expect(created).toBeTruthy()

    const updatedTitle = `${marker}-\u66f4\u65b0`
    const updateRes = await auth(request(app)
      .put(`/api/admin/historic/nav-items/${created.id}`))
      .send({
        title: updatedTitle,
        link_type: 'external',
        link_target: 'https://example.com',
        open_mode: '_blank'
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.code).toBe(200)

    const listAfterUpdate = await auth(request(app).get('/api/admin/historic/nav-items'))
    const updated = listAfterUpdate.body.data.find((x) => x.id === created.id)
    expect(updated.title).toBe(updatedTitle)
    expect(updated.link_type).toBe('external')

    const deleteRes = await auth(request(app).delete(`/api/admin/historic/nav-items/${created.id}`))
    expect(deleteRes.status).toBe(200)
    expect(deleteRes.body.code).toBe(200)

    const listAfterDelete = await auth(request(app).get('/api/admin/historic/nav-items'))
    expect(listAfterDelete.body.data.some((x) => x.id === created.id)).toBe(false)
  })
})

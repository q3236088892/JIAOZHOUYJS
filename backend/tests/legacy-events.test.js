import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('legacy events api', () => {
  it('GET /api/events should return { code: 200, data: [] } structure', async () => {
    const res = await request(app).get('/api/events')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/events/:id should return 404 json when id not found', async () => {
    const res = await request(app).get('/api/events/999999999')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe(404)
    expect(typeof res.body.msg).toBe('string')
  })

  it('PUT /api/events/:id should return 404 json when id not found', async () => {
    const res = await request(app)
      .put('/api/events/999999999')
      .send({
        title: 'updated title',
        content: 'updated content',
        eventType: 'legacy',
        status: 'done'
      })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe(404)
    expect(typeof res.body.msg).toBe('string')
  })

  it('POST /api/events should return 400 json when title is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        content: 'content only',
        eventType: 'legacy',
        status: 'todo'
      })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe(400)
    expect(typeof res.body.msg).toBe('string')
  })

  it('POST /api/events should create event and return 200 with numeric data.id', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        title: `new event ${Date.now()}`,
        content: 'create content',
        eventType: 'legacy',
        status: 'todo'
      })

    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(res.body.data).toBeTruthy()
    expect(typeof res.body.data.id).toBe('number')
  })

  it('PUT /api/events/:id should update event and return 200 with updated fields', async () => {
    const created = await request(app)
      .post('/api/events')
      .send({
        title: `seed event ${Date.now()}`,
        content: 'seed content',
        eventType: 'legacy',
        status: 'todo'
      })

    expect(created.status).toBe(200)
    expect(created.body.code).toBe(200)

    const id = created.body.data.id
    const updatedTitle = `updated title ${Date.now()}`
    const updatedStatus = 'done'

    const updated = await request(app)
      .put(`/api/events/${id}`)
      .send({
        title: updatedTitle,
        status: updatedStatus
      })

    expect(updated.status).toBe(200)
    expect(updated.body.code).toBe(200)
    expect(updated.body.data.id).toBe(id)
    expect(updated.body.data.title).toBe(updatedTitle)
    expect(updated.body.data.status).toBe(updatedStatus)
  })

  it('PUT /api/events/:id should support partial body without 500', async () => {
    const created = await request(app)
      .post('/api/events')
      .send({
        title: `partial seed ${Date.now()}`,
        content: 'seed content',
        eventType: 'legacy',
        status: 'todo'
      })

    const id = created.body.data.id
    const updated = await request(app)
      .put(`/api/events/${id}`)
      .send({
        status: 'in_progress'
      })

    expect(updated.status).toBe(200)
    expect(updated.body.code).toBe(200)
    expect(updated.body.data.id).toBe(id)
    expect(updated.body.data.status).toBe('in_progress')
  })
})

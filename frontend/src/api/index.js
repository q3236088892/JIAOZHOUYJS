import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

export const getEvents = () => api.get('/events')
export const getEvent = (id) => api.get(`/events/${id}`)
export const createEvent = (data) => api.post('/events', data)
export const updateEvent = (id, data) => api.put(`/events/${id}`, data)
export const deleteEvent = (id) => api.delete(`/events/${id}`)
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/system/oss/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export default api
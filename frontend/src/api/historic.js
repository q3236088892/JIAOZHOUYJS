import api from './index'

export const getHistoricHome = () => api.get('/historic/public/home')
export const getHistoricIndustryDetail = (slug) => api.get(`/historic/public/industry/${slug}/detail`)

export const getAdminNavItems = () => api.get('/admin/historic/nav-items')
export const createAdminNavItem = (data) => api.post('/admin/historic/nav-items', data)
export const updateAdminNavItem = (id, data) => api.put(`/admin/historic/nav-items/${id}`, data)
export const deleteAdminNavItem = (id) => api.delete(`/admin/historic/nav-items/${id}`)

export const getAdminIndustries = () => api.get('/admin/historic/industries')
export const getAdminHomeServices = () => api.get('/admin/historic/home-services')
export const getAdminStages = () => api.get('/admin/historic/stages')
export const getAdminCategories = () => api.get('/admin/historic/categories')
export const getAdminTopics = () => api.get('/admin/historic/topics')
export const getAdminTopicLinks = () => api.get('/admin/historic/topic-links')
export const getAdminTopicInfoFields = () => api.get('/admin/historic/topic-info-fields')

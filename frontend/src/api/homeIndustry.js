import api from './index'

// Public
export const getCdModules = () => api.get('/cd/public/modules')
export const getCdModuleTree = (code) => api.get(`/cd/public/modules/${code}/tree`)
export const getCdNodeDetail = (id) => api.get(`/cd/public/nodes/${id}`)

// Admin - Modules
export const getAdminCdModules = () => api.get('/admin/cd/modules')
export const createAdminCdModule = (data) => api.post('/admin/cd/modules', data)
export const updateAdminCdModule = (id, data) => api.put(`/admin/cd/modules/${id}`, data)
export const deleteAdminCdModule = (id) => api.delete(`/admin/cd/modules/${id}`)

// Admin - Tree
export const getAdminCdTree = (moduleId) => api.get(`/admin/cd/modules/${moduleId}/tree`)
export const createAdminCdNode = (data) => api.post('/admin/cd/nodes', data)
export const updateAdminCdNode = (id, data) => api.put(`/admin/cd/nodes/${id}`, data)
export const deleteAdminCdNode = (id) => api.delete(`/admin/cd/nodes/${id}`)
export const moveAdminCdNode = (id, data) => api.put(`/admin/cd/nodes/${id}/move`, data)

// Admin - Content
export const updateAdminCdContent = (nodeId, data) => api.put(`/admin/cd/contents/${nodeId}`, data)
export const createAdminCdField = (data) => api.post('/admin/cd/content-fields', data)
export const updateAdminCdField = (id, data) => api.put(`/admin/cd/content-fields/${id}`, data)
export const deleteAdminCdField = (id) => api.delete(`/admin/cd/content-fields/${id}`)

// Admin - Import
export const importCdExcel = (moduleId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  if (moduleId) formData.append('module_id', moduleId)
  return api.post('/admin/cd/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

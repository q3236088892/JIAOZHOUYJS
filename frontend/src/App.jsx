import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import EventForm from './pages/EventForm'
import HistoricHomePage from './pages/historic/HistoricHomePage'
import HistoricOpenRestaurantPage from './pages/historic/HistoricOpenRestaurantPage'
import AdminHistoricPage from './pages/admin/AdminHistoricPage'
import AdminHomeIndustryPage from './pages/admin/AdminHomeIndustryPage'
import HomeIndustryHomePage from './pages/home-industry/HomeIndustryHomePage'
import ModuleDetailPage from './pages/home-industry/ModuleDetailPage'
import './styles/index.css'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/new" element={<EventForm />} />
        <Route path="/events/edit/:id" element={<EventForm />} />
        <Route path="/historicDistrict" element={<HistoricHomePage />} />
        <Route path="/historicDistrict/openRestaurant" element={<HistoricOpenRestaurantPage />} />
        <Route path="/admin" element={<AdminHistoricPage />} />
        <Route path="/admin/cd" element={<AdminHomeIndustryPage />} />
        <Route path="/homeIndustry" element={<HomeIndustryHomePage />} />
        <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />

        {/* 兼容带前缀访问路径 */}
        <Route path="/one_type_event" element={<Navigate to="/one_type_event/historicDistrict" replace />} />
        <Route path="/one_type_event/historicDistrict" element={<HistoricHomePage />} />
        <Route path="/one_type_event/historicDistrict/openRestaurant" element={<HistoricOpenRestaurantPage />} />
        <Route path="/one_type_event/openRestaurant" element={<Navigate to="/one_type_event/historicDistrict/openRestaurant" replace />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App

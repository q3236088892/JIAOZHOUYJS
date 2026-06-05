import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal, Select, Space, Switch, Tree, message, Tag, Popconfirm, Dropdown, Upload } from 'antd'
import { PlusOutlined, DeleteOutlined, ImportOutlined, FolderOutlined, FileTextOutlined, DownOutlined, PictureOutlined, UploadOutlined, SettingOutlined, PlayCircleOutlined } from '@ant-design/icons'
import {
  getAdminCdModules, createAdminCdModule, updateAdminCdModule, uploadCdImage,
  getAdminCdTree, createAdminCdNode, updateAdminCdNode, deleteAdminCdNode,
  getAdminCdSettings, updateAdminCdSetting
} from '../../api/homeIndustry'
import { toAntdTreeData, findNodeInTree, collectExpandedKeys } from '../../utils/homeIndustryTree'
import {
  HOME_INDUSTRY_NAV_VISIBILITY_SETTING_KEY,
  HOME_INDUSTRY_TOP_NAV,
  parseHomeIndustryNavVisibility
} from '../../utils/homeIndustryNavigation'
import ContentEditor from './ContentEditor'
import ExcelImportModal from './ExcelImportModal'
import '../../styles/admin.css'

const MODULE_DISPLAY_TITLES = {
  value_added: '首页展示'
}

const SPECIAL_TEMPLATE_ASSETS = {
  产业简介: {
    title: '产业简介',
    route: '/homeIndustry/value_added?section=industry-intro',
    assetDir: '/home-industry/industry-intro/',
    description: '前台使用专题展板模板展示，后台正文内容不会直接作为前台页面主体展示。',
    assets: [
      { type: 'image', title: '产业简介展板1', src: '/home-industry/industry-intro/industry-intro-01.webp', alt: '产业简介展板1' },
      { type: 'image', title: '产业简介展板2', src: '/home-industry/industry-intro/industry-intro-02.webp', alt: '产业简介展板2' },
      { type: 'image', title: '上合智能家居产业情况介绍', src: '/home-industry/industry-intro/shanghe-smart-home.webp', alt: '上合智能家居产业情况介绍' },
      { type: 'image', title: '源氏木语家具产业情况介绍', src: '/home-industry/industry-intro/yuanshi-muyu-home.webp', alt: '源氏木语家具产业情况介绍' }
    ]
  },
  招商宣传: {
    title: '招商宣传',
    route: '/homeIndustry/value_added?section=investment-promo',
    assetDir: '/home-industry/investment-promo/',
    description: '前台使用视频置顶 + 招商展板模板展示，后台正文内容不会直接作为前台页面主体展示。',
    assets: [
      { type: 'video', title: '宣传视频', src: '/home-industry/investment-promo/promo-video.mp4' },
      { type: 'image', title: '完善供应链展板', src: '/home-industry/investment-promo/supply-chain.webp', alt: '完善供应链展板' },
      { type: 'image', title: '做强产业链展板', src: '/home-industry/investment-promo/strong-chain.webp', alt: '做强产业链展板' }
    ]
  }
}

function getModuleDisplayTitle(module) {
  return MODULE_DISPLAY_TITLES[module?.code] || module?.title || ''
}

function findNodePath(tree, nodeId, path = []) {
  for (const node of tree || []) {
    const nextPath = [...path, node]
    if (String(node.id) === String(nodeId)) return nextPath
    const childPath = findNodePath(node.children || [], nodeId, nextPath)
    if (childPath) return childPath
  }
  return null
}

function getSpecialTemplateConfig(module, tree, nodeId) {
  if (module?.code !== 'value_added' || !nodeId) return null
  const path = findNodePath(tree, nodeId)
  const rootTitle = path?.[0]?.title
  return SPECIAL_TEMPLATE_ASSETS[rootTitle] || null
}

function SpecialTemplateAssetCard({ config }) {
  if (!config) return null
  return (
    <div className="cd-special-template-card">
      <div className="cd-special-template-card__header">
        <div>
          <div className="cd-special-template-card__title">前台专题模板说明</div>
          <div className="cd-special-template-card__desc">
            {config.description}
            <br />
            前台访问地址：<code>{config.route}</code>
            <br />
            前台素材目录：<code>{config.assetDir}</code>
          </div>
        </div>
        <Tag color="blue">静态专题</Tag>
      </div>
      <div className="cd-special-template-card__grid">
        {config.assets.map((asset) => (
          <div key={asset.src} className="cd-special-template-asset">
            <div className="cd-special-template-asset__title">{asset.title}</div>
            {asset.type === 'image' ? (
              <img
                src={asset.src}
                alt={asset.alt || asset.title}
                className="cd-special-template-asset__preview"
              />
            ) : (
              <div className="cd-special-template-asset__preview cd-special-template-asset__preview--video">
                <PlayCircleOutlined style={{ marginRight: 6, color: '#427aff' }} />
                {asset.src.split('/').pop()}
              </div>
            )}
            <div className="cd-special-template-asset__path">{asset.src}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminHomeIndustryPage() {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [selectedModuleId, setSelectedModuleId] = useState(null)
  const [treeData, setTreeData] = useState([])
  const [rawTree, setRawTree] = useState([])
  const [stats, setStats] = useState({ nodeCount: 0, leafCount: 0 })
  const [expandedKeys, setExpandedKeys] = useState([])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [newModuleCode, setNewModuleCode] = useState('')
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModuleSettings, setShowModuleSettings] = useState(false)
  const [moduleSettings, setModuleSettings] = useState({ home_banner_url: '', detail_banner_url: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [siteSettings, setSiteSettings] = useState({ home_banner: '' })
  const [showNavSettings, setShowNavSettings] = useState(false)
  const [navVisibility, setNavVisibility] = useState({})

  const loadModules = useCallback(async () => {
    try {
      const res = await getAdminCdModules()
      if (res.data.code === 200) {
        setModules(res.data.data)
        if (!selectedModuleId && res.data.data.length > 0) {
          setSelectedModuleId(res.data.data[0].id)
        }
      }
    } catch { message.error('加载模块列表失败') }
  }, [selectedModuleId])

  const loadTree = useCallback(async () => {
    if (!selectedModuleId) return
    setLoading(true)
    try {
      const res = await getAdminCdTree(selectedModuleId)
      if (res.data.code === 200) {
        const { tree, stats: s } = res.data.data
        setRawTree(tree)
        setTreeData(toAntdTreeData(tree))
        setStats(s)
        setExpandedKeys(collectExpandedKeys(tree))
      }
    } catch { message.error('加载树形数据失败') }
    finally { setLoading(false) }
  }, [selectedModuleId])

  useEffect(() => { loadModules() }, [loadModules])
  useEffect(() => { loadTree() }, [loadTree])

  useEffect(() => {
    getAdminCdSettings()
      .then((res) => {
        if (res.data.code === 200) {
          setSiteSettings({ home_banner: res.data.data.home_banner || '' })
          setNavVisibility(parseHomeIndustryNavVisibility(res.data.data[HOME_INDUSTRY_NAV_VISIBILITY_SETTING_KEY]))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const mod = modules.find(m => m.id === selectedModuleId)
    if (mod) {
      setModuleSettings({
        home_banner_url: mod.home_banner_url || '',
        detail_banner_url: mod.detail_banner_url || ''
      })
    }
  }, [selectedModuleId, modules])

  const handleSelect = (keys) => {
    if (keys.length === 0) {
      setSelectedNodeId(null)
      setSelectedNode(null)
      return
    }
    const id = keys[0]
    setSelectedNodeId(id)
    setSelectedNode(findNodeInTree(rawTree, id))
  }

  const handleAddChild = async (parentNodeType) => {
    const title = prompt('请输入节点标题：')
    if (!title || !title.trim()) return

    try {
      await createAdminCdNode({
        module_id: selectedModuleId,
        parent_id: selectedNodeId,
        title: title.trim(),
        node_type: parentNodeType === 'branch' ? 'branch' : 'leaf',
        sort_order: 999
      })
      message.success('添加成功')
      await loadTree()
    } catch { message.error('添加失败') }
  }

  const handleDeleteNode = async (nodeId) => {
    try {
      await deleteAdminCdNode(nodeId)
      message.success('删除成功')
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null)
        setSelectedNode(null)
      }
      await loadTree()
    } catch { message.error('删除失败') }
  }

  const handleCreateModule = async () => {
    if (!newModuleCode.trim() || !newModuleTitle.trim()) {
      message.warning('请填写模块编码和标题')
      return
    }
    try {
      await createAdminCdModule({ code: newModuleCode.trim(), title: newModuleTitle.trim() })
      message.success('模块创建成功')
      setShowModuleModal(false)
      setNewModuleCode('')
      setNewModuleTitle('')
      await loadModules()
    } catch { message.error('创建失败') }
  }

  const handleBannerUpload = async (file, field) => {
    try {
      const res = await uploadCdImage(file)
      if (res.data.code === 200) {
        setModuleSettings(prev => ({ ...prev, [field]: res.data.data.url }))
        await updateAdminCdModule(selectedModuleId, { [field]: res.data.data.url })
        message.success('上传成功')
        await loadModules()
      }
    } catch {
      message.error('上传失败')
    }
  }

  const handleHomeBannerUpload = async (file) => {
    try {
      const res = await uploadCdImage(file)
      if (res.data.code === 200) {
        await updateAdminCdSetting('home_banner', res.data.data.url)
        setSiteSettings({ home_banner: res.data.data.url })
        message.success('首页 Banner 上传成功')
      }
    } catch {
      message.error('上传失败')
    }
  }

  const handleNavVisibilityChange = async (key, checked) => {
    const next = { ...navVisibility, [key]: checked }
    setNavVisibility(next)
    try {
      await updateAdminCdSetting(HOME_INDUSTRY_NAV_VISIBILITY_SETTING_KEY, JSON.stringify(next))
      message.success('导航菜单设置已保存')
    } catch {
      message.error('导航菜单设置保存失败')
    }
  }

  const handleImportSuccess = () => {
    setShowImport(false)
    loadTree()
  }

  const selectedModule = modules.find(m => m.id === selectedModuleId)
  const selectedSpecialTemplateConfig = getSpecialTemplateConfig(selectedModule, rawTree, selectedNodeId)

  const renderTreeTitle = (nodeData) => {
    const isLeaf = nodeData.data?.node_type === 'leaf'
    return (
      <div className="tree-node-title">
        <span>{nodeData.title}</span>
        {isLeaf && <Tag color="green" style={{ marginLeft: 8, fontSize: 12 }}>叶子</Tag>}
      </div>
    )
  }

  const getNodeMenuItems = (node) => {
    const items = []
    if (node.node_type === 'branch') {
      items.push({
        key: 'add-branch',
        label: '添加子目录',
        onClick: () => handleAddChild('branch')
      })
      items.push({
        key: 'add-leaf',
        label: '添加内容节点',
        onClick: () => handleAddChild('leaf')
      })
    }
    items.push({
      key: 'delete',
      label: <span style={{ color: '#ff4d4f' }}>删除</span>,
      onClick: () => {
        Modal.confirm({
          title: `确认删除 "${node.title}" 及其所有子节点？`,
          okText: '确认删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => handleDeleteNode(node.id)
        })
      }
    })
    return items
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>{'家居产业内容管理'}</h1>
        <Button size="small" onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); navigate('/login', { replace: true }) }}>
          退出登录
        </Button>
      </div>

      <div className="admin-card">
        <Space className="cd-admin-toolbar">
          <Select
            style={{ width: 200 }}
            value={selectedModuleId}
            onChange={(v) => { setSelectedModuleId(v); setSelectedNodeId(null); setSelectedNode(null) }}
            options={modules.map((m) => ({ label: getModuleDisplayTitle(m), value: m.id }))}
            placeholder="选择模块"
          />
          <Button icon={<PlusOutlined />} onClick={() => setShowModuleModal(true)}>{'新增模块'}</Button>
          <Button icon={<ImportOutlined />} onClick={() => setShowImport(true)}>{'导入Excel'}</Button>
          <Button
            icon={<PictureOutlined />}
            onClick={() => setShowModuleSettings(!showModuleSettings)}
            type={showModuleSettings ? 'primary' : 'default'}
          >
            {'Banner设置'}
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setShowNavSettings(!showNavSettings)}
            type={showNavSettings ? 'primary' : 'default'}
          >
            {'导航菜单设置'}
          </Button>
        </Space>

        {showNavSettings && (
          <div style={{ marginBottom: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1e2a3e', marginBottom: 12 }}>前台顶部导航菜单显示控制</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {HOME_INDUSTRY_TOP_NAV.map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid #eef1f5', borderRadius: 6 }}>
                  <span>{item.label}</span>
                  <Switch
                    size="small"
                    aria-label={`显示${item.label}`}
                    checked={navVisibility[item.key] !== false}
                    onChange={(checked) => handleNavVisibilityChange(item.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {showModuleSettings && (
          <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left card - 网站首页 Banner */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e2a3e' }}>网站首页 Banner</div>
                <Tag color="purple" style={{ marginLeft: 8, fontSize: 12 }}>网站级</Tag>
              </div>
              <div style={{
                width: '100%',
                aspectRatio: '16 / 5',
                background: '#f5f7fb',
                border: '1px dashed #d9d9d9',
                borderRadius: 6,
                marginBottom: 12,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontSize: 13
              }}>
                {siteSettings.home_banner ? (
                  <img
                    src={siteSettings.home_banner}
                    alt="网站首页Banner"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>暂无图片，点击下方按钮上传</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#999' }}>
                  应用于：<code style={{ background: '#f0f0f0', padding: '0 4px', borderRadius: 3 }}>/homeIndustry</code>
                </span>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={({ file }) => handleHomeBannerUpload(file)}
                >
                  <Button type="primary" icon={<UploadOutlined />} size="small">
                    {siteSettings.home_banner ? '更换图片' : '上传图片'}
                  </Button>
                </Upload>
              </div>
            </div>

            {/* Right card - 各模块详情页 Banner */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e2a3e' }}>模块详情页 Banner</div>
                <Tag color="blue" style={{ fontSize: 12 }}>按模块</Tag>
                <div style={{ marginLeft: 'auto' }}>
                  <Select
                    size="small"
                    style={{ width: 140 }}
                    value={selectedModuleId}
                    onChange={(v) => { setSelectedModuleId(v); setSelectedNodeId(null); setSelectedNode(null) }}
                    options={modules.map((m) => ({ label: getModuleDisplayTitle(m), value: m.id }))}
                  />
                </div>
              </div>
              <div style={{
                width: '100%',
                aspectRatio: '16 / 5',
                background: '#f5f7fb',
                border: '1px dashed #d9d9d9',
                borderRadius: 6,
                marginBottom: 12,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontSize: 13
              }}>
                {moduleSettings.detail_banner_url ? (
                  <img
                    src={moduleSettings.detail_banner_url}
                    alt="详情页Banner"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{getModuleDisplayTitle(selectedModule) || '该模块'} 暂无图片</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#999' }}>
                  当前：<span style={{ color: '#427aff', fontWeight: 500 }}>{getModuleDisplayTitle(selectedModule) || '-'}</span>
                </span>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={({ file }) => handleBannerUpload(file, 'detail_banner_url')}
                >
                  <Button type="primary" icon={<UploadOutlined />} size="small">
                    {moduleSettings.detail_banner_url ? '更换图片' : '上传图片'}
                  </Button>
                </Upload>
              </div>
            </div>
          </div>
        )}

        <div className="cd-admin-layout">
          <div className="cd-admin-tree">
            <div className="cd-admin-tree-header">
              <span>内容树</span>
              {selectedModuleId && (
                <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => handleAddChild('branch')}>
                  添加根节点
                </Button>
              )}
            </div>
            {treeData.length > 0 ? (
              <Tree
                showLine
                showIcon
                switcherIcon={<DownOutlined />}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                selectedKeys={selectedNodeId ? [selectedNodeId] : []}
                onSelect={handleSelect}
                treeData={treeData}
                titleRender={(node) => (
                  <Dropdown menu={{ items: getNodeMenuItems(node.data) }} trigger={['contextMenu']}>
                    <div className="cd-tree-node" onDoubleClick={() => {
                      const items = getNodeMenuItems(node.data)
                      if (items.length > 0) items[0].onClick?.()
                    }}>
                      {renderTreeTitle(node)}
                    </div>
                  </Dropdown>
                )}
              />
            ) : (
              <div className="cd-admin-empty">
                <p>暂无内容</p>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleAddChild('branch')}>
                  添加第一个节点
                </Button>
              </div>
            )}
          </div>

          <div className="cd-admin-editor">
            {selectedNode ? (
              <>
                <SpecialTemplateAssetCard config={selectedSpecialTemplateConfig} />
                <ContentEditor
                  node={selectedNode}
                  onRefresh={loadTree}
                />
              </>
            ) : (
              <div className="cd-admin-empty">
                <FolderOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <p>选择左侧节点进行编辑</p>
                <p style={{ color: '#999', fontSize: 12 }}>
                  右键菜单可添加子节点或删除 | 双击可快速添加子节点
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ExcelImportModal
        open={showImport}
        modules={modules}
        selectedModuleId={selectedModuleId}
        onClose={() => setShowImport(false)}
        onSuccess={handleImportSuccess}
      />

      <Modal
        open={showModuleModal}
        title="新增模块"
        okText="创建"
        cancelText="取消"
        onOk={handleCreateModule}
        onCancel={() => { setShowModuleModal(false); setNewModuleCode(''); setNewModuleTitle('') }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="模块编码（英文，如 value_added）"
            value={newModuleCode}
            onChange={(e) => setNewModuleCode(e.target.value)}
          />
          <Input
            placeholder="模块标题（如 首页展示）"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  )
}

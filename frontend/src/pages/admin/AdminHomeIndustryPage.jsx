import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal, Select, Space, Tree, message, Tag, Popconfirm, Dropdown, Upload } from 'antd'
import { PlusOutlined, DeleteOutlined, ImportOutlined, FolderOutlined, FileTextOutlined, DownOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons'
import {
  getAdminCdModules, createAdminCdModule, updateAdminCdModule, uploadCdImage,
  getAdminCdTree, createAdminCdNode, updateAdminCdNode, deleteAdminCdNode
} from '../../api/homeIndustry'
import { toAntdTreeData, findNodeInTree, collectExpandedKeys } from '../../utils/homeIndustryTree'
import ContentEditor from './ContentEditor'
import ExcelImportModal from './ExcelImportModal'
import '../../styles/admin.css'

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

  const handleImportSuccess = () => {
    setShowImport(false)
    loadTree()
  }

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
        <Space style={{ marginBottom: 16 }}>
          <Select
            style={{ width: 200 }}
            value={selectedModuleId}
            onChange={(v) => { setSelectedModuleId(v); setSelectedNodeId(null); setSelectedNode(null) }}
            options={modules.map((m) => ({ label: m.title, value: m.id }))}
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
        </Space>

        {showModuleSettings && selectedModuleId && (
          <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Banner 图片设置</div>
            <Space size="large" wrap>
              <div>
                <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>首页 Banner</div>
                {moduleSettings.home_banner_url && (
                  <img
                    src={moduleSettings.home_banner_url}
                    alt="首页Banner"
                    style={{ width: 300, height: 60, objectFit: 'cover', borderRadius: 4, marginBottom: 8, display: 'block', border: '1px solid #e5e7eb' }}
                  />
                )}
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={({ file }) => handleBannerUpload(file, 'home_banner_url')}
                >
                  <Button icon={<UploadOutlined />} size="small">
                    {moduleSettings.home_banner_url ? '更换' : '上传'}首页Banner
                  </Button>
                </Upload>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>详情页 Banner</div>
                {moduleSettings.detail_banner_url && (
                  <img
                    src={moduleSettings.detail_banner_url}
                    alt="详情页Banner"
                    style={{ width: 300, height: 60, objectFit: 'cover', borderRadius: 4, marginBottom: 8, display: 'block', border: '1px solid #e5e7eb' }}
                  />
                )}
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={({ file }) => handleBannerUpload(file, 'detail_banner_url')}
                >
                  <Button icon={<UploadOutlined />} size="small">
                    {moduleSettings.detail_banner_url ? '更换' : '上传'}详情页Banner
                  </Button>
                </Upload>
              </div>
            </Space>
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
              <ContentEditor
                node={selectedNode}
                onRefresh={loadTree}
              />
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
            placeholder="模块标题（如 增值服务）"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  )
}

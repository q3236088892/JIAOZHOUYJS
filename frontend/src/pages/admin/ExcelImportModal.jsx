import { useState } from 'react'
import { Modal, Upload, Select, Space, message, Alert, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { importCdExcel } from '../../api/homeIndustry'

const { Dragger } = Upload
const { Text } = Typography

export default function ExcelImportModal({ open, modules, selectedModuleId, onClose, onSuccess }) {
  const [moduleId, setModuleId] = useState(selectedModuleId)
  const [fileList, setFileList] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('请选择Excel文件')
      return
    }

    setImporting(true)
    setResult(null)
    try {
      const res = await importCdExcel(moduleId || null, fileList[0].originFileObj)
      if (res.data.code === 200) {
        setResult(res.data.data)
        message.success('导入完成')
      } else {
        message.error(res.data.msg || '导入失败')
      }
    } catch (e) {
      message.error('导入失败: ' + (e.response?.data?.msg || e.message))
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFileList([])
    setResult(null)
    onClose?.()
  }

  const handleOk = () => {
    if (result) {
      onSuccess?.()
    } else {
      handleImport()
    }
  }

  return (
    <Modal
      open={open}
      title="导入Excel数据"
      okText={result ? '完成' : '开始导入'}
      cancelText="取消"
      onOk={handleOk}
      onCancel={handleClose}
      confirmLoading={importing}
      width={520}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <div style={{ marginBottom: 8 }}>目标模块</div>
          <Select
            style={{ width: '100%' }}
            value={moduleId}
            onChange={setModuleId}
            options={[
              { label: '自动识别（按工作表名称匹配模块）', value: null },
              ...modules.map((m) => ({ label: m.title, value: m.id }))
            ]}
            placeholder="选择模块"
          />
        </div>

        {!result && (
          <Dragger
            accept=".xls,.xlsx"
            maxCount={1}
            fileList={fileList}
            onChange={({ fileList: f }) => setFileList(f)}
            beforeUpload={() => false}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽Excel文件到此区域</p>
            <p className="ant-upload-hint">支持 .xls 和 .xlsx 格式</p>
          </Dragger>
        )}

        {result && (
          <Alert
            type="success"
            showIcon
            message="导入完成"
            description={
              <Space direction="vertical">
                <Text>处理了 {result.sheetsProcessed} 个工作表</Text>
                <Text>新建节点: <Text strong>{result.created}</Text></Text>
                <Text>跳过（已存在）: <Text strong>{result.skipped}</Text></Text>
              </Space>
            }
          />
        )}
      </Space>
    </Modal>
  )
}

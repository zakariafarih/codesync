import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface DeleteModalProps {
  title: string
  isOpen: boolean
  onOk: () => void
  onCancel: () => void
  itemName: string
  confirmLoading?: boolean
  error?: string | null
}

export function DeleteModal({ 
  title, 
  isOpen, 
  onOk, 
  onCancel, 
  itemName,
  confirmLoading = false,
  error = null
}: DeleteModalProps) {
  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
          {title}
        </span>
      }
      open={isOpen}
      onOk={onOk}
      onCancel={onCancel}
      okText="Delete"
      cancelText="Cancel"
      confirmLoading={confirmLoading}
      okButtonProps={{ 
        danger: true,
        style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }
      }}
    >
      <p>Are you sure you want to permanently delete &quot;{itemName}&quot;?</p>
      <p>This action cannot be undone.</p>
      {error && (
        <p style={{ color: '#ff4d4f', marginTop: '8px' }}>
          {error}
        </p>
      )}
    </Modal>
  )
}
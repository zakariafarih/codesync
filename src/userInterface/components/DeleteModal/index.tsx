/* eslint-disable linebreak-style */
import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface DeleteModalProps {
  title: string
  isOpen: boolean
  onOk: () => void
  onCancel: () => void
  itemName: string
}

export function DeleteModal({ title, isOpen, onOk, onCancel, itemName }: DeleteModalProps) {
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
      okButtonProps={{ 
        danger: true,
        style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }
      }}
    >
      <p>Are you sure you want to permanently delete &quot;{itemName}&quot;?</p>
      <p>This action cannot be undone.</p>
    </Modal>
  )
}
/* eslint-disable linebreak-style */
import { Modal, Input } from 'antd'
import { useState } from 'react'

interface CreateModalProps {
  title: string
  isOpen: boolean
  onOk: (name: string) => void
  onCancel: () => void
  placeholder?: string
}

export function CreateModal({ title, isOpen, onOk, onCancel, placeholder }: CreateModalProps) {
  const [name, setName] = useState('')

  const handleOk = () => {
    if (name.trim()) {
      onOk(name)
      setName('')
    }
  }

  const handleCancel = () => {
    setName('')
    onCancel()
  }

  return (
    <Modal
      title={title}
      open={isOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      okButtonProps={{ disabled: !name.trim() }}
    >
      <Input
        placeholder={placeholder || 'Enter name'}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
    </Modal>
  )
}

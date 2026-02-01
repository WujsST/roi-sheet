"use client"

import { X } from "lucide-react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#0a0a0a] p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white font-display">{title}</h2>
              <button onClick={onClose} className="text-text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

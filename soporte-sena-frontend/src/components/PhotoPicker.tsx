import { useState, useRef } from 'react'
import { Camera, Image as ImageIcon, Trash2, Plus, AlertCircle, Eye, X } from 'lucide-react'

export interface PhotoItem {
  id: string
  file: File
  previewUrl: string
}

interface PhotoPickerProps {
  label?: string
  minPhotos?: number
  maxPhotos?: number
  required?: boolean
  photos: PhotoItem[]
  onChange: (photos: PhotoItem[]) => void
  error?: string
}

export default function PhotoPicker({
  label = 'Fotografías',
  minPhotos = 1,
  maxPhotos = 3,
  required = true,
  photos,
  onChange,
  error,
}: PhotoPickerProps) {
  const [activePreview, setActivePreview] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newItems: PhotoItem[] = []
    const availableSlots = maxPhotos - photos.length

    for (let i = 0; i < Math.min(files.length, availableSlots); i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const previewUrl = URL.createObjectURL(file)
      newItems.push({ id, file, previewUrl })
    }

    if (newItems.length > 0) {
      onChange([...photos, ...newItems])
    }

    // Reset inputs
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleRemove = (id: string) => {
    const itemToRemove = photos.find(p => p.id === id)
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.previewUrl)
    }
    onChange(photos.filter(p => p.id !== id))
  }

  const canAddMore = photos.length < maxPhotos

  return (
    <div className="space-y-3">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Camera size={14} className="text-sena-green" /> {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
          photos.length >= minPhotos
            ? 'bg-green-100 text-sena-green'
            : 'bg-red-50 text-red-600'
        }`}>
          {photos.length} / {maxPhotos} foto{maxPhotos > 1 ? 's' : ''}
          {minPhotos > 0 && photos.length < minPhotos ? ` (mín. ${minPhotos})` : ''}
        </span>
      </div>

      {/* Grid of photo thumbnails */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((item, idx) => (
          <div
            key={item.id}
            className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-xs"
          >
            <img
              src={item.previewUrl}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Number badge */}
            <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-xs">
              {idx + 1}
            </span>

            {/* Hover overlay actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActivePreview(item.previewUrl)}
                className="p-1.5 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors"
                title="Ver imagen completa"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="Eliminar foto"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Add photo card slot if available */}
        {canAddMore && (
          <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-2 text-center">
            <Plus size={20} className="text-sena-green mb-1" />
            <span className="text-[10px] font-semibold text-gray-400">Agregar foto</span>
          </div>
        )}
      </div>

      {/* Action buttons (Camera / Gallery) */}
      {canAddMore && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-green-50 hover:border-sena-green/30 hover:text-sena-green transition-all shadow-xs"
          >
            <Camera size={14} className="text-sena-green" />
            Tomar foto
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-xs"
          >
            <ImageIcon size={14} className="text-blue-500" />
            Elegir de galería
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFilesAdded(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFilesAdded(e.target.files)}
      />

      {/* Helper & Validation Error */}
      {error ? (
        <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
          <AlertCircle size={12} /> {error}
        </p>
      ) : (
        <p className="text-[11px] text-gray-400">
          {required
            ? `Obligatorio: Adjunta de ${minPhotos} a ${maxPhotos} fotografía${maxPhotos > 1 ? 's' : ''} claras.`
            : `Puedes adjuntar hasta ${maxPhotos} fotografía${maxPhotos > 1 ? 's' : ''}.`}
        </p>
      )}

      {/* Modal Preview Fullscreen */}
      {activePreview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setActivePreview(null)}
        >
          <div className="relative max-w-lg w-full bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setActivePreview(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
            >
              <X size={18} />
            </button>
            <img src={activePreview} alt="Vista previa" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

import { useRef } from 'react'

interface ScanBillCTAProps {
  onFileSelected: (file: File) => void
  loading?: boolean
}

export default function ScanBillCTA({ onFileSelected, loading }: ScanBillCTAProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-center text-white">
      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
        <span className="text-3xl">📸</span>
      </div>
      <h3 className="text-lg font-bold mb-1">Imbas bil anda</h3>
      <p className="text-sm text-white/80 mb-4">
        Snap gambar bil kertas atau PDF.<br />Kami baca jumlahnya untuk anda.
      </p>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="bg-white text-primary-700 font-bold text-sm px-5 py-3 rounded-xl hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? 'Membaca bil...' : 'Scan Bill'}
      </button>
      <p className="text-[11px] text-white/60 mt-2">Accurate 94% · ~20 sec</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

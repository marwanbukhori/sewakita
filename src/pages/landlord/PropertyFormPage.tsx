import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'

export default function PropertyFormPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    address: '',
    billing_date: 1,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    const { error } = await supabase.from('properties').insert({
      landlord_id: profile.id,
      name: form.name,
      address: form.address,
      billing_date: form.billing_date,
      is_active: true,
    })
    setLoading(false)

    if (error) {
      toast.error('Gagal menambah hartanah.')
      return
    }

    toast.success('Hartanah berjaya ditambah!')
    navigate('/properties')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <h1 className="text-xl font-bold text-gray-800">Tambah Hartanah</h1>

      <Card variant="elevated" padding="p-6" className="!rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama hartanah"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="cth: Rumah Taman Melati"
          />
          <Input
            label="Alamat"
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="cth: No 12, Jalan Melati 3, 53100 KL"
          />
          <Select
            label="Tarikh bil bulanan"
            value={form.billing_date}
            onChange={(e) => setForm({ ...form, billing_date: Number(e.target.value) })}
            helperText="Tarikh bil akan dijana setiap bulan"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>Hari {d}</option>
            ))}
          </Select>

          <Button type="submit" loading={loading} fullWidth size="lg">
            Simpan Hartanah
          </Button>
        </form>
      </Card>
    </div>
  )
}

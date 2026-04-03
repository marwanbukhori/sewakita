import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { Property, Room, Tenancy, Profile, DepositDeduction } from '@/types/database'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { SkeletonList } from '@/components/ui/Skeleton'
import { format } from 'date-fns'

export default function MoveOutPage() {
  const { propertyId, roomId } = useParams<{ propertyId: string; roomId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [tenancy, setTenancy] = useState<(Tenancy & { tenant: Profile }) | null>(null)

  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split('T')[0])
  const [deductions, setDeductions] = useState<DepositDeduction[]>([])

  useEffect(() => {
    loadData()
  }, [propertyId, roomId])

  async function loadData() {
    const [{ data: prop }, { data: roomData }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', propertyId!).single(),
      supabase.from('rooms')
        .select('*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*))')
        .eq('id', roomId!)
        .single(),
    ])

    setProperty(prop)
    setRoom(roomData)

    const active = roomData?.tenancies?.find((t: Tenancy) => t.status === 'active')
    setTenancy(active || null)
    setLoading(false)
  }

  function addDeduction() {
    setDeductions([...deductions, { item: '', amount: 0 }])
  }

  function updateDeduction(index: number, field: keyof DepositDeduction, value: string | number) {
    const updated = [...deductions]
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: Number(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setDeductions(updated)
  }

  function removeDeduction(index: number) {
    setDeductions(deductions.filter((_, i) => i !== index))
  }

  async function handleConfirmMoveOut() {
    if (!tenancy || !room) return

    // Validate deductions
    const validDeductions = deductions.filter(d => d.item.trim() && d.amount > 0)

    setSaving(true)

    // Update tenancy
    const { error: tenancyError } = await supabase.from('tenancies').update({
      status: 'ended',
      move_out: moveOutDate,
      deposit_deductions: validDeductions.length > 0 ? validDeductions : undefined,
    }).eq('id', tenancy.id)

    if (tenancyError) {
      toast.error('Gagal mengemaskini penyewaan.')
      setSaving(false)
      return
    }

    // Update room status to vacant
    const { error: roomError } = await supabase.from('rooms').update({
      status: 'vacant',
    }).eq('id', room.id)

    if (roomError) {
      toast.error('Gagal mengemaskini status bilik.')
      setSaving(false)
      return
    }

    setSaving(false)
    toast.success('Penyewa berjaya dipindahkan keluar!')
    navigate(`/properties/${propertyId}`)
  }

  if (loading) return <SkeletonList count={2} />

  if (!property || !room || !tenancy) {
    return <div className="text-center py-12 text-gray-500">Data tidak dijumpai.</div>
  }

  const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0)
  const refundAmount = tenancy.deposit - totalDeductions

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <div>
        <h1 className="text-xl font-bold text-gray-800">Pindah Keluar</h1>
        <p className="text-sm text-gray-500">{property.name} — {room.label}</p>
      </div>

      {/* Tenancy summary */}
      <Card variant="elevated" padding="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
            {tenancy.tenant?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{tenancy.tenant?.name}</p>
            <p className="text-xs text-gray-500">Masuk: {format(new Date(tenancy.move_in), 'dd MMM yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Sewa: <strong>RM{tenancy.agreed_rent}/bln</strong></span>
          <span>Deposit: <strong>RM{tenancy.deposit}</strong></span>
        </div>
      </Card>

      {/* Move-out date */}
      <Input
        label="Tarikh pindah keluar"
        type="date"
        value={moveOutDate}
        onChange={(e) => setMoveOutDate(e.target.value)}
      />

      {/* Deposit deductions */}
      <Card variant="elevated" padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">Potongan Deposit</h2>
          <Button variant="ghost" size="sm" icon={Plus} onClick={addDeduction}>
            Tambah
          </Button>
        </div>

        {deductions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Tiada potongan. Tekan "Tambah" jika ada kerosakan atau hutang.</p>
        ) : (
          <div className="space-y-3">
            {deductions.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Sebab (cth: Kerosakan pintu)"
                    value={d.item}
                    onChange={(e) => updateDeduction(i, 'item', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Jumlah (RM)"
                    value={d.amount || ''}
                    onChange={(e) => updateDeduction(i, 'amount', e.target.value)}
                  />
                </div>
                <button onClick={() => removeDeduction(i)} className="p-2 text-gray-400 hover:text-danger-500 mt-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Deposit calculation */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Deposit dibayar</span>
            <span className="font-medium text-gray-800">RM{tenancy.deposit.toLocaleString()}</span>
          </div>
          {totalDeductions > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jumlah potongan</span>
              <span className="font-medium text-danger-500">-RM{totalDeductions.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-1">
            <span className="text-gray-800">Pulangan deposit</span>
            <span className={refundAmount >= 0 ? 'text-green-600' : 'text-danger-500'}>
              RM{refundAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Confirm */}
      <Button variant="danger" fullWidth size="lg" loading={saving} onClick={handleConfirmMoveOut}>
        Sahkan Pindah Keluar
      </Button>
      <p className="text-xs text-gray-400 text-center">Tindakan ini tidak boleh dibatalkan. Status bilik akan bertukar kepada "Kosong".</p>
    </div>
  )
}

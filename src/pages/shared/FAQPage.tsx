import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const faqs = [
  {
    question: 'Bagaimana cara menambah hartanah baru?',
    answer: 'Pergi ke halaman Dashboard, tekan butang "Tambah Hartanah" di bahagian Quick Actions. Masukkan nama hartanah, alamat, dan tarikh bil bulanan.',
  },
  {
    question: 'Bagaimana cara menambah penyewa?',
    answer: 'Anda boleh menambah penyewa melalui Quick Actions di Dashboard atau dari halaman Hartanah > Bilik. Pilih bilik yang kosong dan masukkan maklumat penyewa.',
  },
  {
    question: 'Bagaimana cara menjana bil bulanan?',
    answer: 'Pergi ke halaman Bil, pilih hartanah dan bulan. Masukkan bil utiliti (elektrik, air, internet) terlebih dahulu, kemudian tekan "Jana Bil" untuk menjana bil secara automatik untuk semua penyewa.',
  },
  {
    question: 'Bagaimana cara merekod bayaran?',
    answer: 'Di halaman Bayaran, tekan pada bil penyewa untuk melihat butiran. Tekan "Rekod Bayaran", masukkan jumlah dan kaedah bayaran (bank transfer, DuitNow, tunai).',
  },
  {
    question: 'Bolehkah saya hantar bil melalui WhatsApp?',
    answer: 'Ya! Di halaman Bayaran, setiap bil ada butang WhatsApp untuk menghantar bil, peringatan bayaran, atau resit terus ke penyewa.',
  },
  {
    question: 'Bagaimana jika penyewa membayar separa?',
    answer: 'SewaKita menyokong bayaran separa. Rekodkan jumlah yang dibayar dan sistem akan mengemas kini baki secara automatik. Status bil akan bertukar kepada "Separa".',
  },
  {
    question: 'Bagaimana bil utiliti dikira?',
    answer: 'Anda boleh pilih kaedah pembahagian: sub-meter (ikut bacaan per bilik), bahagi sama rata, jumlah tetap per bilik, atau tuan rumah tanggung sepenuhnya.',
  },
  {
    question: 'Adakah data saya selamat?',
    answer: 'Ya. SewaKita menggunakan Supabase dengan Row-Level Security (RLS). Setiap pengguna hanya boleh melihat data mereka sendiri. Data disulitkan semasa penghantaran.',
  },
]

export default function FAQPage() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-4 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
        Kembali
      </Button>

      <div>
        <h1 className="text-xl font-bold text-gray-800">Soalan Lazim</h1>
        <p className="text-sm text-gray-500 mt-1">Jawapan kepada soalan yang sering ditanya</p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <Card key={i} variant="default" padding="p-0">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex-1 text-sm font-medium text-gray-800">{faq.question}</span>
              {openIndex === i
                ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                : <ChevronDown size={16} className="text-gray-400 shrink-0" />
              }
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

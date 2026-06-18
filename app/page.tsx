'use client';

import { GuestRecord, DashboardStats } from '@/lib/types';
import { Users, BedDouble, Wallet, TrendingUp, Search, Plus, Pencil, Trash2, X, Download } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export default function HomePage() {
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filter) params.set('status', filter);
    const res = await fetch(`/api/guests?${params}`);
    const data = (await res.json()) as { guests?: GuestRecord[]; stats?: DashboardStats };
    setGuests(data.guests || []);
    setStats(data.stats || null);
    setLoading(false);
  }, [search, filter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const fmtMoney = (n: number) => new Intl.NumberFormat('th-TH').format(n);

  const today = new Date().toISOString().slice(0, 10);
  const statusBadge = (g: GuestRecord) => {
    if (g.check_in > today) return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">จะเข้าพัก</span>;
    if (g.check_out < today) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">เช็คเอาท์แล้ว</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">กำลังพัก</span>;
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filter) params.set('status', filter);
    window.open(`/api/guests/export?${params}`, '_blank');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-brand-navy text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BedDouble className="text-brand-gold" />
            ระบบบันทึกการเข้าพัก
          </h1>
          <p className="text-sm text-slate-300 mt-1">จัดการข้อมูลแขกและห้องพักของโรงแรม</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="text-blue-600" />} label="แขกปัจจุบัน" value={`${stats.current_guests} คน`} bg="bg-blue-50" />
            <StatCard icon={<BedDouble className="text-emerald-600" />} label="ห้องว่าง / ทั้งหมด" value={`${stats.available_rooms} / 19`} bg="bg-emerald-50" />
            <StatCard icon={<Wallet className="text-amber-600" />} label="รายได้รวม" value={`฿${fmtMoney(stats.total_revenue)}`} bg="bg-amber-50" />
            <StatCard icon={<TrendingUp className="text-purple-600" />} label="ลูกค้าทั้งหมด" value={`${stats.total_guests} ราย`} bg="bg-purple-50" />
          </div>
        )}

        {/* Room breakdown */}
        {stats && stats.room_breakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-sm font-semibold text-slate-600 mb-3">สรุปตามประเภทห้อง</h2>
            <div className="flex flex-wrap gap-3">
              {stats.room_breakdown.map((r) => (
                <div key={r.room_type} className="px-4 py-2 rounded-lg bg-slate-50 border">
                  <span className="font-medium">{r.room_type}</span>
                  <span className="text-slate-500 text-sm ml-2">{r.count} ราย</span>
                  <span className="text-brand-gold font-semibold text-sm ml-2">฿{fmtMoney(r.revenue || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filter + Add + Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์, เลขห้อง..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-gold focus:outline-none text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
          >
            <option value="">ทั้งหมด</option>
            <option value="current">กำลังพัก</option>
            <option value="upcoming">จะเข้าพัก</option>
            <option value="past">เช็คเอาท์แล้ว</option>
          </select>
          <button
            onClick={exportCsv}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => { setEditingId(null); setShowForm(true); }}
            className="px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            บันทึกใหม่
          </button>
        </div>

        {/* Guest Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">กำลังโหลด...</div>
          ) : guests.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              ยังไม่มีข้อมูล กด &quot;บันทึกใหม่&quot; เพื่อเพิ่มรายการ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
                    <th className="text-left px-4 py-3 font-medium">เบอร์โทร</th>
                    <th className="text-left px-4 py-3 font-medium">บัตรปชช.</th>
                    <th className="text-left px-4 py-3 font-medium">ห้อง</th>
                    <th className="text-left px-4 py-3 font-medium">ประเภท</th>
                    <th className="text-left px-4 py-3 font-medium">เช็คอิน</th>
                    <th className="text-left px-4 py-3 font-medium">เช็คเอาท์</th>
                    <th className="text-right px-4 py-3 font-medium">รวม (฿)</th>
                    <th className="text-center px-4 py-3 font-medium">สถานะ</th>
                    <th className="text-center px-4 py-3 font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guests.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{g.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{g.phone}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{g.id_card || '-'}</td>
                      <td className="px-4 py-3">{g.room_number}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{g.room_type}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{g.check_in}</td>
                      <td className="px-4 py-3 text-slate-600">{g.check_out}</td>
                      <td className="px-4 py-3 text-right font-medium text-brand-gold">{fmtMoney(g.total_amount)}</td>
                      <td className="px-4 py-3 text-center">{statusBadge(g)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditingId(g.id); setShowForm(true); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(g.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <GuestFormModal
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSaved={() => { setShowForm(false); setEditingId(null); fetchData(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <DeleteConfirm id={deleteId} onClose={() => setDeleteId(null)} onDeleted={() => { setDeleteId(null); fetchData(); }} />
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-sm text-slate-600">{label}</span></div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

// ── Guest Form Modal ───────────────────────────────

function GuestFormModal({ editingId, onClose, onSaved }: {
  editingId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: '', phone: '', id_card: '', address: '',
    room_number: '', room_type: 'Standard',
    check_in: '', check_out: '', price_per_night: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId !== null) {
      fetch(`/api/guests`)
        .then(r => r.json())
        .then((raw) => {
          const data = raw as { guests?: GuestRecord[] };
          const g = data.guests?.find((x: GuestRecord) => x.id === editingId);
          if (g) {
            setForm({
              full_name: g.full_name, phone: g.phone,
              id_card: g.id_card || '', address: g.address || '',
              room_number: g.room_number, room_type: g.room_type,
              check_in: g.check_in, check_out: g.check_out,
              price_per_night: String(g.price_per_night),
            });
          }
        });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const url = editingId !== null ? `/api/guests/${editingId}` : '/api/guests';
    const method = editingId !== null ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price_per_night: Number(form.price_per_night) }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || 'เกิดข้อผิดพลาด');
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-lg">{editingId !== null ? 'แก้ไขข้อมูล' : 'บันทึกการเข้าพักใหม่'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="ชื่อ-นามสกุล *">
            <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
              className="form-input" placeholder="เช่น นายสมชาย ใจดี" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="เบอร์โทร *">
              <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="form-input" placeholder="เช่น 0812345678" />
            </Field>
            <Field label="บัตรประชาชน/พาสปอร์ต">
              <input value={form.id_card} onChange={e => setForm({...form, id_card: e.target.value})}
                className="form-input" placeholder="เช่น 1-1023-45678-90" />
            </Field>
          </div>
          <Field label="ที่อยู่">
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="form-input" rows={2} placeholder="เช่น 123 ถ.พหลโยธิน ต.ในเมือง อ.เมือง จ.เชียงราย 57000" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="หมายเลขห้อง *">
              <input required value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})}
                className="form-input" placeholder="เช่น 101" />
            </Field>
            <Field label="ประเภทห้อง">
              <select value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})} className="form-input">
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Family</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="วันเช็คอิน *">
              <input required type="date" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className="form-input" />
            </Field>
            <Field label="วันเช็คเอาท์ *">
              <input required type="date" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="form-input" />
            </Field>
          </div>
          <Field label="ราคาต่อคืน (฿) *">
            <input required type="number" min="0" value={form.price_per_night}
              onChange={e => setForm({...form, price_per_night: e.target.value})} className="form-input" placeholder="เช่น 890" />
          </Field>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">ยกเลิก</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────

function DeleteConfirm({ id, onClose, onDeleted }: { id: number; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/guests/${id}`, { method: 'DELETE' });
    setDeleting(false);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-bold text-lg mb-1">ยืนยันการลบ</h3>
        <p className="text-slate-500 text-sm mb-5">ต้องการลบรายการนี้ใช่หรือไม่?</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'กำลังลบ...' : 'ลบ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Field ─────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

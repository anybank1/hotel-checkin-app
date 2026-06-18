'use client';

import { GuestRecord, DashboardStats, ActivityLog, RoomType, ROOM_PRICES, DEFAULT_ROOM_TYPE, APP_PASSWORD, ADMIN_PASSWORD } from '@/lib/types';
import { Users, BedDouble, Wallet, TrendingUp, Search, Plus, Pencil, Trash2, X, Download, ScrollText, Eye, EyeOff, Lock } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function fmtMonth(m: string): string {
  const [y, mo] = m.split('-');
  return `${THAI_MONTHS[Number(mo) - 1]} ${Number(y) + 543}`;
}

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  // Revenue reveal
  const [revenueVisible, setRevenueVisible] = useState(false);
  const [revenueMonth, setRevenueMonth] = useState('all');
  const [showRevenueUnlock, setShowRevenueUnlock] = useState(false);

  // Check app auth
  useEffect(() => {
    if (sessionStorage.getItem('hotel_auth') === 'ok') setAuthed(true);
  }, []);

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
    if (!authed) return;
    const timer = setTimeout(fetchData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, authed]);

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

  // ── Login Gate ─────────────────────────────────────────
  if (!authed) {
    return <LoginGate onSuccess={() => setAuthed(true)} />;
  }

  const displayedRevenue = (() => {
    if (!stats) return 0;
    if (revenueMonth === 'all') return stats.total_revenue;
    const m = stats.monthly_revenue.find(r => r.month === revenueMonth);
    return m?.revenue || 0;
  })();

  return (
    <div className="min-h-screen">
      <header className="bg-brand-navy text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BedDouble className="text-brand-gold" />
              ระบบบันทึกการเข้าพัก
            </h1>
            <p className="text-sm text-slate-300 mt-1">Life Hotel Rong Khun — ใกล้วัดร่องขุ่น เชียงราย</p>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('hotel_auth'); setAuthed(false); }}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm flex items-center gap-1"
          >
            <Lock className="w-4 h-4" /> ออก
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="text-blue-600" />} label="แขกปัจจุบัน" value={`${stats.current_guests} คน`} bg="bg-blue-50" />
            <StatCard icon={<BedDouble className="text-emerald-600" />} label="ห้องว่าง / ทั้งหมด" value={`${stats.available_rooms} / 19`} bg="bg-emerald-50" />
            <div className={`${'bg-amber-50'} rounded-xl p-4 shadow-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="text-amber-600" />
                <span className="text-sm text-slate-600">รายได้รวม</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-800">
                  {revenueVisible ? `฿${fmtMoney(displayedRevenue)}` : '••••••'}
                </p>
                <button
                  onClick={() => {
                    if (!revenueVisible) setShowRevenueUnlock(true);
                    else setRevenueVisible(false);
                  }}
                  className="p-1 rounded hover:bg-amber-100"
                >
                  {revenueVisible ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-amber-600" />}
                </button>
              </div>
              {/* Month dropdown */}
              {revenueVisible && (
                <select
                  value={revenueMonth}
                  onChange={e => setRevenueMonth(e.target.value)}
                  className="mt-2 w-full px-2 py-1 rounded border border-slate-300 text-xs"
                >
                  <option value="all">ทั้งหมด</option>
                  {stats.monthly_revenue.map(m => (
                    <option key={m.month} value={m.month}>
                      {fmtMonth(m.month)} — {m.count} ราย ฿{fmtMoney(m.revenue)}
                    </option>
                  ))}
                </select>
              )}
            </div>
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

        {/* Search + Filter + Add + Export + Logs */}
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
          <button onClick={exportCsv} className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setShowLogs(true)} className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5">
            <ScrollText className="w-4 h-4" /> Log
          </button>
          <button
            onClick={() => { setEditingId(null); setShowForm(true); }}
            className="px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> บันทึกใหม่
          </button>
        </div>

        {/* Guest Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">กำลังโหลด...</div>
          ) : guests.length === 0 ? (
            <div className="p-8 text-center text-slate-400">ยังไม่มีข้อมูล กด &quot;บันทึกใหม่&quot; เพื่อเพิ่มรายการ</div>
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
                    <th className="text-left px-4 py-3 font-medium">ผู้บันทึก</th>
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
                      <td className="px-4 py-3 text-slate-500 text-xs">{g.recorded_by || '-'}</td>
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

      {/* Delete Confirm with Password */}
      {deleteId !== null && (
        <DeleteConfirm id={deleteId} guestName={guests.find(g => g.id === deleteId)?.full_name || ''} onClose={() => setDeleteId(null)} onDeleted={() => { setDeleteId(null); fetchData(); }} />
      )}

      {/* Revenue Unlock */}
      {showRevenueUnlock && (
        <PasswordModal
          title="ปลดล็อกรายได้"
          icon={<Wallet className="w-6 h-6 text-amber-600" />}
          onClose={() => setShowRevenueUnlock(false)}
          onSuccess={() => { setRevenueVisible(true); setShowRevenueUnlock(false); }}
        />
      )}

      {/* Activity Logs */}
      {showLogs && <LogsModal onClose={() => setShowLogs(false)} />}
    </div>
  );
}

// ── Login Gate ─────────────────────────────────────────

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === APP_PASSWORD) {
      sessionStorage.setItem('hotel_auth', 'ok');
      onSuccess();
    } else {
      setErr('รหัสผ่านไม่ถูกต้อง');
      setPwd('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-navy flex items-center justify-center mb-3">
            <BedDouble className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Life Hotel</h1>
          <p className="text-sm text-slate-500">Rong Khun — Chiang Rai</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              autoFocus
              value={pwd}
              onChange={e => { setPwd(e.target.value); setErr(''); }}
              placeholder="กรุณาใส่รหัสผ่าน"
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-gold focus:outline-none text-center text-lg tracking-widest"
            />
          </div>
          {err && <p className="text-red-600 text-sm text-center">{err}</p>}
          <button type="submit" className="w-full py-3 rounded-lg bg-brand-navy text-white font-medium hover:opacity-90">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Password Modal (for revenue unlock) ────────────────

function PasswordModal({ title, icon, onClose, onSuccess }: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setErr('รหัสผ่านไม่ถูกต้อง');
      setPwd('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-3">
          {icon}
        </div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-slate-500 text-sm mb-4">กรุณาใส่รหัสผ่านเพื่อดูรายได้</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            autoFocus
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(''); }}
            placeholder="รหัสผ่าน"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-center focus:ring-2 focus:ring-amber-400 focus:outline-none mb-3"
          />
          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">ยกเลิก</button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700">ยืนยัน</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-sm text-slate-600">{label}</span></div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

// ── Guest Form Modal ───────────────────────────────────

function GuestFormModal({ editingId, onClose, onSaved }: {
  editingId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: '', phone: '', id_card: '', address: '',
    room_number: '', room_type: DEFAULT_ROOM_TYPE,
    check_in: '', check_out: '', price_per_night: String(ROOM_PRICES[DEFAULT_ROOM_TYPE]),
    recorded_by: '',
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
              recorded_by: g.recorded_by || '',
            });
          }
        });
    }
  }, [editingId]);

  const handleRoomTypeChange = (rt: RoomType) => {
    setForm({ ...form, room_type: rt, price_per_night: String(ROOM_PRICES[rt]) });
  };

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
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
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
              <select value={form.room_type} onChange={e => handleRoomTypeChange(e.target.value as RoomType)} className="form-input">
                {Object.keys(ROOM_PRICES).map((rt) => (
                  <option key={rt} value={rt}>
                    {rt} (฿{ROOM_PRICES[rt as RoomType].toLocaleString('th-TH')}/คืน)
                  </option>
                ))}
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
              onChange={e => setForm({...form, price_per_night: e.target.value})} className="form-input" placeholder="เช่น 550" />
          </Field>
          <Field label="ผู้บันทึก *">
            <input required value={form.recorded_by} onChange={e => setForm({...form, recorded_by: e.target.value})}
              className="form-input" placeholder="ชื่อผู้บันทึกข้อมูล" />
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

// ── Delete Confirm with Password ───────────────────────

function DeleteConfirm({ id, guestName, onClose, onDeleted }: {
  id: number;
  guestName: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [pwd, setPwd] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  const handleDelete = async () => {
    if (pwd !== ADMIN_PASSWORD) {
      setErr('รหัสผ่านไม่ถูกต้อง');
      setPwd('');
      return;
    }
    setDeleting(true);
    setErr('');
    const res = await fetch(`/api/guests/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    setDeleting(false);
    if (res.ok) {
      onDeleted();
    } else {
      const data = await res.json() as { error?: string };
      setErr(data.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-bold text-lg mb-1">ยืนยันการลบ</h3>
        <p className="text-slate-500 text-sm mb-1">ต้องการลบรายการของ</p>
        <p className="font-medium text-slate-700 mb-4">{guestName} หรือไม่?</p>
        <div className="relative mb-3">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="password"
            autoFocus
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(''); }}
            placeholder="ใส่รหัสผ่านเพื่อลบ"
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 text-center focus:ring-2 focus:ring-red-400 focus:outline-none"
          />
        </div>
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
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

// ── Activity Logs Modal ────────────────────────────────

function LogsModal({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logs?limit=100')
      .then(r => r.json())
      .then((data: unknown) => {
        setLogs((data as { logs?: ActivityLog[] }).logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const actionColor = (a: string) => {
    if (a === 'create') return 'bg-green-100 text-green-700';
    if (a === 'update') return 'bg-blue-100 text-blue-700';
    if (a === 'delete') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };
  const actionLabel = (a: string) => {
    if (a === 'create') return 'เพิ่ม';
    if (a === 'update') return 'แก้ไข';
    if (a === 'delete') return 'ลบ';
    return a;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-slate-600" /> ประวัติการเคลื่อนไหว
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="text-center text-slate-400 py-8">กำลังโหลด...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-slate-400 py-8">ยังไม่มีบันทึกการเคลื่อนไหว</div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                    {actionLabel(log.action)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{log.details}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {log.recorded_by && `โดย ${log.recorded_by} • `}{log.created_at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reusable Field ─────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Home as HomeIcon, GraduationCap, Users, BookOpen, Settings, ChevronDown, ChevronRight, Moon, Sun, LogOut,
  Search, Plus, Trash2, Edit, Eye, EyeOff, Download, Upload, Save, X, FileText, Award, Calendar, MapPin,
  Heart, Quote, User, Phone, Mail, Building, Hash, Shield, Star, Trophy, Medal, LayoutDashboard,
  Menu, ChevronLeft, School,
} from 'lucide-react';

/* ============================================================
   CONSTANTS
   ============================================================ */

const CHART_COLORS = ['#0d9488', '#16a34a', '#ea580c', '#ca8a04', '#7c3aed', '#dc2626'];

const SEM_COLORS = [
  { bg: '#ccfbf1', hd: '#0d9488', label: 'Semester 1' },
  { bg: '#dcfce7', hd: '#16a34a', label: 'Semester 2' },
  { bg: '#fef9c3', hd: '#854d0e', label: 'Semester 3' },
  { bg: '#fee2e2', hd: '#b91c1c', label: 'Semester 4' },
  { bg: '#ede9fe', hd: '#6d28d9', label: 'Semester 5' },
  { bg: '#d1fae5', hd: '#065f46', label: 'Semester 6' },
];

/* ============================================================
   TYPES
   ============================================================ */

interface Angkatan { id: number; year: number; _count?: { siswa: number }; }
interface Kelas { id: number; name: string; _count?: { siswa: number }; }
interface Mapel { id: number; name: string; semester: number; }
interface SiswaRow {
  id: number; name: string; nisn: string; jk: string; kelasId: number;
  angkatanId: number; birthDate: string; birthPlace: string; cita: string;
  kataMutiara: string; foto: string; kelas: Kelas; angkatan: Angkatan;
}
interface DashboardData {
  totalSiswa: number; totalL: number; totalP: number; totalAngkatan: number;
  angkatanStats: { angkatan: Angkatan; total: number; l: number; p: number; kelasCount: number }[];
  top3ByAngkatan: { angkatan: Angkatan; students: { name: string; kelas: string; avg: number; foto: string; jk: string }[] }[];
}
interface NilaiData {
  siswa: (SiswaRow & { nilaiMap: Record<number, number> })[];
  mapelBySem: Record<number, Mapel[]>;
}
interface CVData {
  siswa: SiswaRow;
  nilaiBySemester: Record<number, { mapel: string; value: number }[]>;
  semesterAverages: Record<number, number>;
  overallAverage: number;
}
interface SettingsData {
  school: { id: string; name: string; npsn: string; address: string; city: string; phone: string; email: string; accreditation: string; logo: string };
  admin: { username: string; displayName: string };
}

/* ============================================================
   MAIN APP COMPONENT
   ============================================================ */

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    isLoggedIn, displayName, currentPage, currentAngkatanId, currentAngkatanYear,
    sidebarOpen, sidebarCollapsed,
    setLoggedIn, setCurrentPage, toggleSidebar, toggleSidebarCollapsed,
  } = useAppStore();

  // Data states
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([]);
  const [siswaTotal, setSiswaTotal] = useState(0);
  const [siswaPage, setSiswaPage] = useState(1);
  const [siswaTotalPages, setSiswaTotalPages] = useState(1);
  const [nilaiData, setNilaiData] = useState<NilaiData | null>(null);
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);

  // UI states
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaKelasFilter, setSiswaKelasFilter] = useState('');
  const [siswaJkFilter, setSiswaJkFilter] = useState('');
  const [siswaRpp, setSiswaRpp] = useState(10);
  const [nilaiSemester, setNilaiSemester] = useState('');
  const [nilaiSearch, setNilaiSearch] = useState('');
  const [nilaiRpp, setNilaiRpp] = useState(10);
  const [nilaiPage, setNilaiPage] = useState(1);
  const [nilaiEdits, setNilaiEdits] = useState<Record<string, number>>({});

  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editStudent, setEditStudent] = useState<SiswaRow | null>(null);
  const [showCvModal, setShowCvModal] = useState(false);
  const [cvStudentId, setCvStudentId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{ nama: string; nisn: string; kelas: string; jk: string; tempat_lahir: string; tgl_lahir: string }[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);

  // Student form state
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formKelasId, setFormKelasId] = useState('');
  const [formJk, setFormJk] = useState('L');
  const [formAngkatanId, setFormAngkatanId] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formBirthPlace, setFormBirthPlace] = useState('');
  const [formCita, setFormCita] = useState('');
  const [formKataMutiara, setFormKataMutiara] = useState('');
  const [formFoto, setFormFoto] = useState('');

  // Settings form
  const [settingsForm, setSettingsForm] = useState({ name: '', npsn: '', address: '', city: '', phone: '', email: '', accreditation: '', logo: '' });
  const [adminForm, setAdminForm] = useState({ displayName: '', username: '', password: '', confirmPassword: '' });

  // Ref for mapel edit
  const [editMapelId, setEditMapelId] = useState<number | null>(null);
  const [editMapelName, setEditMapelName] = useState('');
  const [editMapelSem, setEditMapelSem] = useState(1);

  // Ref for add mapel
  const [addMapelName, setAddMapelName] = useState('');
  const [addMapelSem, setAddMapelSem] = useState(1);

  // Kelas page
  const [addKelasName, setAddKelasName] = useState('');
  const [kelasPage, setKelasPage] = useState(1);

  // Angkatan add
  const [addAngkatanYear, setAddAngkatanYear] = useState('');

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* ============================================================
     API HELPERS
     ============================================================ */

  const api = useCallback(async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
    return data;
  }, []);

  /* ============================================================
     DATA FETCHING
     ============================================================ */

  const fetchAngkatan = useCallback(async () => {
    try { const d = await api('/api/angkatan'); setAngkatanList(d); } catch (e: any) { toast.error(e.message); }
  }, [api]);

  const fetchKelas = useCallback(async () => {
    try { const d = await api('/api/kelas'); setKelasList(d); } catch (e: any) { toast.error(e.message); }
  }, [api]);

  const fetchMapel = useCallback(async () => {
    try { const d = await api('/api/mapel'); setMapelList(d); } catch (e: any) { toast.error(e.message); }
  }, [api]);

  const fetchDashboard = useCallback(async () => {
    try { const d = await api('/api/dashboard'); setDashboardData(d); } catch (e: any) { toast.error(e.message); }
  }, [api]);

  const fetchSiswa = useCallback(async () => {
    if (!currentAngkatanId) return;
    try {
      const params = new URLSearchParams({
        angkatanId: String(currentAngkatanId),
        page: String(siswaPage),
        rpp: String(siswaRpp),
      });
      if (siswaSearch) params.set('search', siswaSearch);
      if (siswaKelasFilter) params.set('kelas', siswaKelasFilter);
      if (siswaJkFilter) params.set('jk', siswaJkFilter);
      const d = await api(`/api/siswa?${params}`);
      setSiswaList(d.data);
      setSiswaTotal(d.total);
      setSiswaTotalPages(d.totalPages);
    } catch (e: any) { toast.error(e.message); }
  }, [api, currentAngkatanId, siswaPage, siswaRpp, siswaSearch, siswaKelasFilter, siswaJkFilter]);

  const fetchNilai = useCallback(async () => {
    if (!currentAngkatanId) return;
    try {
      const params = new URLSearchParams({ angkatanId: String(currentAngkatanId) });
      if (nilaiSemester) params.set('semester', nilaiSemester);
      const d = await api(`/api/nilai?${params}`);
      setNilaiData(d);
    } catch (e: any) { toast.error(e.message); }
  }, [api, currentAngkatanId, nilaiSemester]);

  const fetchSettings = useCallback(async () => {
    try { const d = await api('/api/settings'); setSettingsData(d); setSettingsForm(d.school); setAdminForm({ displayName: d.admin.displayName, username: d.admin.username, password: '', confirmPassword: '' }); } catch (e: any) { toast.error(e.message); }
  }, [api]);

  const fetchCV = useCallback(async (id: number) => {
    try { const d = await api(`/api/siswa/${id}/cv`); setCvData(d); } catch (e: any) { toast.error(e.message); }
  }, [api]);

  /* ============================================================
     EFFECTS - FETCH DATA ON PAGE CHANGE
     ============================================================ */

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAngkatan();
    fetchKelas();
    fetchMapel();
  }, [isLoggedIn, fetchAngkatan, fetchKelas, fetchMapel]);

  useEffect(() => {
    if (!isLoggedIn || currentPage !== 'beranda') return;
    fetchDashboard();
  }, [isLoggedIn, currentPage, fetchDashboard]);

  useEffect(() => {
    if (!isLoggedIn || currentPage !== 'siswa') return;
    fetchSiswa();
  }, [isLoggedIn, currentPage, fetchSiswa]);

  useEffect(() => {
    if (!isLoggedIn || currentPage !== 'nilai') return;
    fetchNilai();
  }, [isLoggedIn, currentPage, fetchNilai]);

  useEffect(() => {
    if (!isLoggedIn || currentPage !== 'pengaturan') return;
    fetchSettings();
  }, [isLoggedIn, currentPage, fetchSettings]);

  /* ============================================================
     HANDLERS
     ============================================================ */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) { setLoginError('Username dan password wajib diisi'); return; }
    setLoading(true);
    try {
      const d = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: loginUser, password: loginPass }) });
      if (d.success) { setLoggedIn(true, d.displayName); setCurrentPage('beranda'); setLoginError(''); }
    } catch (e: any) { setLoginError(e.message); }
    setLoading(false);
  };

  const handleLogout = () => { setLoggedIn(false); setCurrentPage('beranda'); setLoginUser(''); setLoginPass(''); };

  const navigateToSiswa = (angkatanId: number, year: number) => {
    setCurrentPage('siswa', angkatanId, year);
    setSiswaSearch(''); setSiswaKelasFilter(''); setSiswaJkFilter(''); setSiswaPage(1);
    setMobileSidebarOpen(false);
  };

  const navigateToNilai = (angkatanId: number, year: number) => {
    setCurrentPage('nilai', angkatanId, year);
    setNilaiSearch(''); setNilaiSemester(''); setNilaiPage(1); setNilaiEdits({});
    setMobileSidebarOpen(false);
  };

  const openStudentModal = (student?: SiswaRow) => {
    if (student) {
      setEditStudent(student);
      setFormName(student.name); setFormNisn(student.nisn); setFormKelasId(String(student.kelasId));
      setFormJk(student.jk); setFormAngkatanId(String(student.angkatanId));
      setFormBirthDate(student.birthDate); setFormBirthPlace(student.birthPlace);
      setFormCita(student.cita); setFormKataMutiara(student.kataMutiara); setFormFoto(student.foto);
    } else {
      setEditStudent(null);
      setFormName(''); setFormNisn(''); setFormKelasId(''); setFormJk('L');
      setFormAngkatanId(currentAngkatanId ? String(currentAngkatanId) : '');
      setFormBirthDate(''); setFormBirthPlace(''); setFormCita(''); setFormKataMutiara(''); setFormFoto('');
    }
    setShowStudentModal(true);
  };

  const handleSaveStudent = async () => {
    if (!formName || !formNisn || !formKelasId || !formAngkatanId) { toast.error('Nama, NISN, Kelas, dan Angkatan wajib diisi'); return; }
    setLoading(true);
    try {
      const body = { name: formName, nisn: formNisn, kelasId: parseInt(formKelasId), jk: formJk, angkatanId: parseInt(formAngkatanId), birthDate: formBirthDate, birthPlace: formBirthPlace, cita: formCita, kataMutiara: formKataMutiara, foto: formFoto };
      if (editStudent) {
        await api('/api/siswa', { method: 'PUT', body: JSON.stringify({ id: editStudent.id, ...body }) });
        toast.success('Data siswa berhasil diperbarui');
      } else {
        await api('/api/siswa', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Siswa berhasil ditambahkan');
      }
      setShowStudentModal(false);
      fetchSiswa();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const handleDeleteStudent = async (id: number) => {
    try { await api('/api/siswa', { method: 'DELETE', body: JSON.stringify({ id }) }); toast.success('Siswa berhasil dihapus'); fetchSiswa(); } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveNilai = async () => {
    if (Object.keys(nilaiEdits).length === 0) { toast.info('Tidak ada perubahan nilai'); return; }
    const values = Object.entries(nilaiEdits).map(([key, value]) => {
      const [siswaId, mapelId] = key.split('-').map(Number);
      return { siswaId, mapelId, value };
    });
    try { await api('/api/nilai', { method: 'PUT', body: JSON.stringify({ values }) }); toast.success('Nilai berhasil disimpan'); setNilaiEdits({}); fetchNilai(); } catch (e: any) { toast.error(e.message); }
  };

  const handleAddAngkatan = async () => {
    const year = parseInt(addAngkatanYear);
    if (!year || year < 2000 || year > 2100) { toast.error('Masukkan tahun yang valid (2000-2100)'); return; }
    try { await api('/api/angkatan', { method: 'POST', body: JSON.stringify({ year }) }); toast.success('Angkatan berhasil ditambahkan'); setAddAngkatanYear(''); fetchAngkatan(); } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteAngkatan = async (id: number) => {
    try { await api('/api/angkatan', { method: 'DELETE', body: JSON.stringify({ id }) }); toast.success('Angkatan berhasil dihapus'); fetchAngkatan(); } catch (e: any) { toast.error(e.message); }
  };

  const handleAddKelas = async () => {
    if (!addKelasName.trim()) { toast.error('Nama kelas wajib diisi'); return; }
    try { await api('/api/kelas', { method: 'POST', body: JSON.stringify({ name: addKelasName.trim() }) }); toast.success('Kelas berhasil ditambahkan'); setAddKelasName(''); fetchKelas(); } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteKelas = async (id: number) => {
    try { await api('/api/kelas', { method: 'DELETE', body: JSON.stringify({ id }) }); toast.success('Kelas berhasil dihapus'); fetchKelas(); } catch (e: any) { toast.error(e.message); }
  };

  const handleAddMapel = async () => {
    if (!addMapelName.trim()) { toast.error('Nama mapel wajib diisi'); return; }
    try { await api('/api/mapel', { method: 'POST', body: JSON.stringify({ name: addMapelName.trim(), semester: addMapelSem }) }); toast.success('Mapel berhasil ditambahkan'); setAddMapelName(''); setAddMapelSem(1); fetchMapel(); } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateMapel = async () => {
    if (!editMapelId) return;
    try { await api('/api/mapel', { method: 'PUT', body: JSON.stringify({ id: editMapelId, name: editMapelName, semester: editMapelSem }) }); toast.success('Mapel berhasil diperbarui'); setEditMapelId(null); fetchMapel(); } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteMapel = async (id: number) => {
    try { await api('/api/mapel', { method: 'DELETE', body: JSON.stringify({ id }) }); toast.success('Mapel berhasil dihapus'); fetchMapel(); } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const body: any = { school: settingsForm };
      if (adminForm.displayName || adminForm.username) { body.admin = { displayName: adminForm.displayName, username: adminForm.username }; if (adminForm.password) { if (adminForm.password !== adminForm.confirmPassword) { toast.error('Password dan konfirmasi password tidak cocok'); setLoading(false); return; } body.admin.password = adminForm.password; body.admin.confirmPassword = adminForm.confirmPassword; } }
      await api('/api/settings', { method: 'PUT', body: JSON.stringify(body) });
      toast.success('Pengaturan berhasil disimpan');
      if (adminForm.displayName) setLoggedIn(true, adminForm.displayName);
      fetchSettings();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran foto maksimal 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setFormFoto(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setSettingsForm(f => ({ ...f, logo: ev.target?.result as string })); };
    reader.readAsDataURL(file);
  };

  const downloadTemplate = () => {
    const csv = 'nama,nisn,kelas,jk,tempat_lahir,tgl_lahir\nAhmad,0012345678,X IPA 1,L,Jakarta,2008-01-15\nSiti,0012345679,X IPA 2,P,Bandung,2008-03-22';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_siswa.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Template CSV berhasil diunduh');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) { toast.error('File CSV kosong'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          nama: cols[headers.indexOf('nama')] || '',
          nisn: cols[headers.indexOf('nisn')] || '',
          kelas: cols[headers.indexOf('kelas')] || '',
          jk: cols[headers.indexOf('jk')] || 'L',
          tempat_lahir: cols[headers.indexOf('tempat_lahir')] || '',
          tgl_lahir: cols[headers.indexOf('tgl_lahir')] || '',
        };
      }).filter(r => r.nama && r.nisn);
      setImportPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (importPreview.length === 0) { toast.error('Tidak ada data untuk diimpor'); return; }
    setLoading(true);
    try {
      const d = await api('/api/import', { method: 'POST', body: JSON.stringify({ rows: importPreview, angkatanId: currentAngkatanId }) });
      toast.success(`${d.imported} siswa berhasil diimpor`);
      setShowImportModal(false); setImportPreview([]);
      fetchSiswa(); fetchKelas();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const openCvModal = (id: number) => {
    setCvStudentId(id);
    setCvData(null);
    setShowCvModal(true);
    fetchCV(id);
  };

  const confirmDelete = (type: string, id: number, name: string) => {
    setShowDeleteConfirm({ type, id, name });
  };

  const executeDelete = async () => {
    if (!showDeleteConfirm) return;
    const { type, id } = showDeleteConfirm;
    setShowDeleteConfirm(null);
    if (type === 'siswa') await handleDeleteStudent(id);
    else if (type === 'angkatan') await handleDeleteAngkatan(id);
    else if (type === 'kelas') await handleDeleteKelas(id);
    else if (type === 'mapel') await handleDeleteMapel(id);
  };

  /* ============================================================
     RENDER HELPERS
     ============================================================ */

  if (!mounted) return <div className="min-h-screen bg-background" />;

  const isDark = theme === 'dark';

  /* ============================================================
     LOGIN PAGE
     ============================================================ */

  if (!isLoggedIn) {
    return (
      <div className="login-bg flex items-center justify-center p-4">
        {/* Background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="glass-card-strong w-full max-w-md p-8 relative">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sistem Informasi Siswa</h1>
            <p className="text-teal-200/60 text-sm mt-1">Student Database Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-teal-200/80 text-sm mb-2 font-medium">Username</label>
              <input
                type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)}
                className="glass-input w-full px-4 py-3 text-white placeholder-white/30 outline-none"
                placeholder="Masukkan username"
              />
            </div>
            <div>
              <label className="block text-teal-200/80 text-sm mb-2 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={loginPass} onChange={e => setLoginPass(e.target.value)}
                  className="glass-input w-full px-4 py-3 pr-12 text-white placeholder-white/30 outline-none"
                  placeholder="Masukkan password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold
                hover:from-teal-400 hover:to-emerald-500 transition-all duration-300 shadow-lg shadow-teal-500/25
                disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-teal-500/40"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-teal-200/40 text-xs">Hint: admin / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN APP LAYOUT
     ============================================================ */

  const renderSidebar = () => {
    return (
      <>
        {/* Mobile overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
        )}

        <aside className={`glass-sidebar fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-72
          transform transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-white font-bold text-sm truncate">Sistem Informasi</h2>
                <p className="text-teal-300/50 text-xs">Siswa</p>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden ml-auto text-white/40 hover:text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3 space-y-1">
            {/* MENU UTAMA */}
            <div className="px-3 py-2 text-xs font-semibold text-teal-400/50 uppercase tracking-wider">Menu Utama</div>

            {/* Beranda */}
            <button onClick={() => { setCurrentPage('beranda'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                ${currentPage === 'beranda' ? 'sidebar-item-active text-teal-300' : 'text-white/60 hover:text-white/90 hover:bg-white/5'}`}
            >
              <HomeIcon className="w-4 h-4 flex-shrink-0" /> Beranda
            </button>

            {/* Tahun Angkatan collapsible */}
            <div>
              <button onClick={() => toggleSidebar('ang')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-200"
              >
                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Tahun Angkatan</span>
                {sidebarOpen.ang ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {sidebarOpen.ang && (
                <div className="ml-7 space-y-0.5 mt-1">
                  {angkatanList.map(a => (
                    <button key={a.id} onClick={() => navigateToSiswa(a.id, a.year)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
                        ${currentPage === 'siswa' && currentAngkatanId === a.id ? 'sidebar-item-active text-teal-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400/50 flex-shrink-0" />
                      Angkatan {a.year}
                      <span className="ml-auto text-white/30">{a._count?.siswa || 0}</span>
                    </button>
                  ))}
                  {angkatanList.length === 0 && <p className="text-white/30 text-xs px-3 py-2">Belum ada angkatan</p>}
                </div>
              )}
            </div>

            {/* Data Nilai collapsible */}
            <div>
              <button onClick={() => toggleSidebar('nilai')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-200"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Data Nilai</span>
                {sidebarOpen.nilai ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {sidebarOpen.nilai && (
                <div className="ml-7 space-y-0.5 mt-1">
                  {angkatanList.map(a => (
                    <button key={a.id} onClick={() => navigateToNilai(a.id, a.year)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
                        ${currentPage === 'nilai' && currentAngkatanId === a.id ? 'sidebar-item-active text-teal-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 flex-shrink-0" />
                      Angkatan {a.year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* REFERENSI */}
            <div className="px-3 py-2 mt-4 text-xs font-semibold text-teal-400/50 uppercase tracking-wider">Referensi</div>

            <button onClick={() => toggleSidebar('ref')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-200"
            >
              <Hash className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Referensi</span>
              {sidebarOpen.ref ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {sidebarOpen.ref && (
              <div className="ml-7 space-y-0.5 mt-1">
                <button onClick={() => { setCurrentPage('ref-angkatan'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
                    ${currentPage === 'ref-angkatan' ? 'sidebar-item-active text-teal-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Tahun Angkatan
                </button>
                <button onClick={() => { setCurrentPage('ref-kelas'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
                    ${currentPage === 'ref-kelas' ? 'sidebar-item-active text-teal-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                >
                  <Users className="w-3.5 h-3.5" /> Data Kelas
                </button>
                <button onClick={() => { setCurrentPage('ref-mapel'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
                    ${currentPage === 'ref-mapel' ? 'sidebar-item-active text-teal-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Data Mapel
                </button>
              </div>
            )}

            {/* SISTEM */}
            <div className="px-3 py-2 mt-4 text-xs font-semibold text-teal-400/50 uppercase tracking-wider">Sistem</div>
            <button onClick={() => { setCurrentPage('pengaturan'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                ${currentPage === 'pengaturan' ? 'sidebar-item-active text-teal-300' : 'text-white/60 hover:text-white/90 hover:bg-white/5'}`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" /> Pengaturan
            </button>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-teal-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white/90 text-sm font-medium truncate">{displayName}</p>
                <p className="text-white/40 text-xs">Administrator</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? 'Light' : 'Dark'}
              </button>
              <button onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-red-300/60 hover:text-red-300 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  };

  /* ============================================================
     DASHBOARD PAGE
     ============================================================ */

  const renderDashboard = () => {
    if (!dashboardData) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>;

    const { totalSiswa, totalL, totalP, totalAngkatan, angkatanStats, top3ByAngkatan } = dashboardData;

    const barChartData = angkatanStats.map(s => ({ name: `Angkatan ${s.angkatan.year}`, Laki: s.l, Perempuan: s.p, Total: s.total }));
    const pieData = [
      { name: 'Laki-laki', value: totalL, color: '#0d9488' },
      { name: 'Perempuan', value: totalP, color: '#ea580c' },
    ];

    const statCards = [
      { label: 'Total Siswa', value: totalSiswa, icon: Users, color: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/20' },
      { label: 'Laki-laki', value: totalL, icon: User, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
      { label: 'Perempuan', value: totalP, icon: Heart, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
      { label: 'Angkatan', value: totalAngkatan, icon: GraduationCap, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
    ];

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold gradient-text">Beranda</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="glass-card glow-hover p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg ${s.shadow}`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5 lg:col-span-2 glow-hover">
            <h3 className="text-sm font-semibold mb-4">Siswa per Angkatan</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <Tooltip contentStyle={{ background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '0.75rem', backdropFilter: 'blur(12px)' }} />
                <Bar dataKey="Laki" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Perempuan" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5 glow-hover">
            <h3 className="text-sm font-semibold mb-4">Distribusi Gender</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '0.75rem' }} />
                <Legend formatter={(value) => <span style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 3 per Angkatan */}
        {top3ByAngkatan.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold gradient-text">Top 3 Siswa per Angkatan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {top3ByAngkatan.map((a) => (
                <div key={a.angkatan.id} className="glass-card p-5">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Angkatan {a.angkatan.year}
                  </h4>
                  <div className="space-y-2">
                    {a.students.map((s, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${i === 0 ? 'medal-gold' : i === 1 ? 'medal-silver' : 'medal-bronze'}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          <p className="text-xs opacity-70">{s.kelas}</p>
                        </div>
                        <div className="text-sm font-bold">{s.avg}</div>
                      </div>
                    ))}
                    {a.students.length === 0 && <p className="text-muted-foreground text-xs py-2">Belum ada data</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Table */}
        {angkatanStats.length > 0 && (
          <div className="glass-card p-5 glow-hover">
            <h3 className="text-sm font-semibold mb-4">Ringkasan per Angkatan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-3 font-semibold text-muted-foreground text-xs">Angkatan</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground text-xs">Total</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground text-xs">Laki-laki</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground text-xs">Perempuan</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground text-xs">Kelas</th>
                  </tr>
                </thead>
                <tbody>
                  {angkatanStats.map((s) => (
                    <tr key={s.angkatan.id} className="glass-table-row border-b border-border/20">
                      <td className="py-3 px-3 font-medium">{s.angkatan.year}</td>
                      <td className="py-3 px-3 text-center">{s.total}</td>
                      <td className="py-3 px-3 text-center text-teal-600 dark:text-teal-400">{s.l}</td>
                      <td className="py-3 px-3 text-center text-orange-600 dark:text-orange-400">{s.p}</td>
                      <td className="py-3 px-3 text-center">{s.kelasCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ============================================================
     DATA SISWA PAGE
     ============================================================ */

  const renderSiswaPage = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold gradient-text">Data Siswa</h1>
          <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            Angkatan {currentAngkatanYear}
          </span>
        </div>

        {/* Toolbar */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{siswaTotal} siswa</span>
            <select value={siswaRpp} onChange={e => { setSiswaRpp(parseInt(e.target.value)); setSiswaPage(1); }}
              className="glass-input px-3 py-1.5 text-sm outline-none bg-transparent">
              {[5, 10, 25, 50].map(r => <option key={r} value={r} className="bg-background">{r} / hal</option>)}
            </select>
            <div className="flex-1" />
            <button onClick={downloadTemplate} className="glass-btn-gold glass-btn px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Template
            </button>
            <button onClick={() => setShowImportModal(true)} className="glass-btn px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button onClick={() => openStudentModal()} className="glass-btn px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 bg-teal-500/20 border-teal-500/30 text-teal-700 dark:text-teal-300">
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={siswaSearch} onChange={e => { setSiswaSearch(e.target.value); setSiswaPage(1); }}
                placeholder="Cari nama atau NISN..."
                className="glass-input w-full pl-9 pr-4 py-2 text-sm outline-none" />
            </div>
            <select value={siswaKelasFilter} onChange={e => { setSiswaKelasFilter(e.target.value); setSiswaPage(1); }}
              className="glass-input px-3 py-2 text-sm outline-none bg-transparent">
              <option value="" className="bg-background">Semua Kelas</option>
              {kelasList.map(k => <option key={k.id} value={k.name} className="bg-background">{k.name}</option>)}
            </select>
            <select value={siswaJkFilter} onChange={e => { setSiswaJkFilter(e.target.value); setSiswaPage(1); }}
              className="glass-input px-3 py-2 text-sm outline-none bg-transparent">
              <option value="" className="bg-background">Semua JK</option>
              <option value="L" className="bg-background">Laki-laki</option>
              <option value="P" className="bg-background">Perempuan</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-500/8 dark:bg-teal-500/5 border-b border-border/30">
                  <th className="text-left py-3 px-3 font-semibold text-xs w-10">#</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs">NISN</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs">Nama</th>
                  <th className="text-center py-3 px-3 font-semibold text-xs w-14">JK</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs">Kelas</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs hidden md:table-cell">Tempat Lahir</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs hidden lg:table-cell">Tgl Lahir</th>
                  <th className="text-center py-3 px-3 font-semibold text-xs w-14 hidden sm:table-cell">Foto</th>
                  <th className="text-center py-3 px-3 font-semibold text-xs w-28">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Tidak ada data siswa</td></tr>
                ) : siswaList.map((s, i) => (
                  <tr key={s.id} className="glass-table-row border-b border-border/15">
                    <td className="py-3 px-3 text-muted-foreground">{(siswaPage - 1) * siswaRpp + i + 1}</td>
                    <td className="py-3 px-3 font-mono text-xs">{s.nisn}</td>
                    <td className="py-3 px-3 font-medium">{s.name}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.jk === 'L' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                        {s.jk}
                      </span>
                    </td>
                    <td className="py-3 px-3">{s.kelas?.name}</td>
                    <td className="py-3 px-3 hidden md:table-cell text-muted-foreground">{s.birthPlace || '-'}</td>
                    <td className="py-3 px-3 hidden lg:table-cell text-muted-foreground">{s.birthDate || '-'}</td>
                    <td className="py-3 px-3 text-center hidden sm:table-cell">
                      {s.foto ? (
                        <img src={s.foto} alt={s.name} className="w-8 h-8 rounded-lg object-cover mx-auto" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mx-auto">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openCvModal(s.id)} title="CV" className="p-1.5 rounded-lg hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 transition">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => openStudentModal(s)} title="Edit" className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDelete('siswa', s.id, s.name)} title="Hapus" className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {siswaTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
              <span className="text-xs text-muted-foreground">
                Hal {siswaPage} dari {siswaTotalPages}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setSiswaPage(p => Math.max(1, p - 1))} disabled={siswaPage === 1}
                  className="px-3 py-1 rounded-lg text-xs glass-btn disabled:opacity-30">Prev</button>
                <button onClick={() => setSiswaPage(p => Math.min(siswaTotalPages, p + 1))} disabled={siswaPage === siswaTotalPages}
                  className="px-3 py-1 rounded-lg text-xs glass-btn disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================
     DATA NILAI PAGE
     ============================================================ */

  const renderNilaiPage = () => {
    if (!nilaiData) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>;

    const { siswa, mapelBySem } = nilaiData;
    const semesters = Object.keys(mapelBySem).map(Number).sort((a, b) => a - b);

    // Apply search filter
    const filteredSiswa = siswa.filter(s => {
      if (!nilaiSearch) return true;
      const q = nilaiSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.nisn.includes(q);
    });

    // Paginate
    const totalNilaiPages = Math.ceil(filteredSiswa.length / nilaiRpp);
    const paginatedSiswa = filteredSiswa.slice((nilaiPage - 1) * nilaiRpp, nilaiPage * nilaiRpp);

    // Filter mapel by semester
    const filteredMapelBySem: Record<number, Mapel[]> = {};
    for (const [sem, mapels] of Object.entries(mapelBySem)) {
      if (!nilaiSemester || sem === nilaiSemester) {
        filteredMapelBySem[parseInt(sem)] = mapels;
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold gradient-text">Data Nilai</h1>
          <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            Angkatan {currentAngkatanYear}
          </span>
        </div>

        {/* Toolbar */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{filteredSiswa.length} siswa</span>
            <select value={nilaiRpp} onChange={e => { setNilaiRpp(parseInt(e.target.value)); setNilaiPage(1); }}
              className="glass-input px-3 py-1.5 text-sm outline-none bg-transparent">
              {[5, 10, 25, 50].map(r => <option key={r} value={r} className="bg-background">{r} / hal</option>)}
            </select>
            <div className="flex-1" />
            {Object.keys(nilaiEdits).length > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {Object.keys(nilaiEdits).length} perubahan
              </span>
            )}
            <button onClick={handleSaveNilai} disabled={loading}
              className="glass-btn px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 bg-teal-500/20 border-teal-500/30 text-teal-700 dark:text-teal-300">
              <Save className="w-3.5 h-3.5" /> Simpan
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={nilaiSearch} onChange={e => setNilaiSearch(e.target.value)}
                placeholder="Cari nama atau NISN..."
                className="glass-input w-full pl-9 pr-4 py-2 text-sm outline-none" />
            </div>
            <select value={nilaiSemester} onChange={e => setNilaiSemester(e.target.value)}
              className="glass-input px-3 py-2 text-sm outline-none bg-transparent">
              <option value="" className="bg-background">Semua Semester</option>
              {semesters.map(s => <option key={s} value={String(s)} className="bg-background">Semester {s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-500/8 dark:bg-teal-500/5 border-b border-border/30">
                  <th className="text-left py-3 px-3 font-semibold text-xs w-10 sticky left-0 bg-teal-500/8 dark:bg-teal-500/5 z-10">#</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs sticky left-10 bg-teal-500/8 dark:bg-teal-500/5 z-10 min-w-[140px]">Nama</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs sticky left-[190px] bg-teal-500/8 dark:bg-teal-500/5 z-10 min-w-[60px]">Kelas</th>
                  {Object.entries(filteredMapelBySem).map(([sem, mapels]) => (
                    <React.Fragment key={sem}>
                      <th colSpan={mapels.length}
                        className="text-center py-2 px-2 text-xs font-bold border-l border-border/20"
                        style={{ backgroundColor: SEM_COLORS[(parseInt(sem) - 1) % SEM_COLORS.length].bg, color: SEM_COLORS[(parseInt(sem) - 1) % SEM_COLORS.length].hd }}>
                        Semester {sem}
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
                <tr className="border-b border-border/30">
                  <th className="py-2 px-3 sticky left-0 bg-background z-10" />
                  <th className="py-2 px-3 sticky left-10 bg-background z-10" />
                  <th className="py-2 px-3 sticky left-[190px] bg-background z-10" />
                  {Object.entries(filteredMapelBySem).map(([sem, mapels]) => (
                    mapels.map(m => (
                      <th key={m.id} className="text-center py-2 px-1 text-xs font-medium border-l border-border/10 min-w-[70px]"
                        style={{ backgroundColor: SEM_COLORS[(parseInt(sem) - 1) % SEM_COLORS.length].bg + '60' }}>
                        <div className="truncate max-w-[70px]" title={m.name}>{m.name}</div>
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedSiswa.length === 0 ? (
                  <tr><td colSpan={100} className="py-12 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : paginatedSiswa.map((s, i) => (
                  <tr key={s.id} className="glass-table-row border-b border-border/10">
                    <td className="py-2 px-3 text-muted-foreground sticky left-0 bg-background z-10">{(nilaiPage - 1) * nilaiRpp + i + 1}</td>
                    <td className="py-2 px-3 font-medium sticky left-10 bg-background z-10">{s.name}</td>
                    <td className="py-2 px-3 text-muted-foreground sticky left-[190px] bg-background z-10">{s.kelas?.name}</td>
                    {Object.entries(filteredMapelBySem).map(([sem, mapels]) => (
                      mapels.map(m => {
                        const key = `${s.id}-${m.id}`;
                        const val = nilaiEdits[key] !== undefined ? nilaiEdits[key] : (s.nilaiMap[m.id] ?? 0);
                        return (
                          <td key={m.id} className="py-1 px-0.5 text-center border-l border-border/5">
                            <input
                              type="number" min={0} max={100} value={val}
                              onChange={e => {
                                const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                setNilaiEdits(prev => ({ ...prev, [key]: v }));
                              }}
                              className="w-full text-center text-xs py-1 px-1 bg-transparent border border-transparent hover:border-teal-300/30 focus:border-teal-400 rounded outline-none transition"
                              style={{ backgroundColor: SEM_COLORS[(parseInt(sem) - 1) % SEM_COLORS.length].bg + '30' }}
                            />
                          </td>
                        );
                      })
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalNilaiPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
              <span className="text-xs text-muted-foreground">Hal {nilaiPage} dari {totalNilaiPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setNilaiPage(p => Math.max(1, p - 1))} disabled={nilaiPage === 1}
                  className="px-3 py-1 rounded-lg text-xs glass-btn disabled:opacity-30">Prev</button>
                <button onClick={() => setNilaiPage(p => Math.min(totalNilaiPages, p + 1))} disabled={nilaiPage === totalNilaiPages}
                  className="px-3 py-1 rounded-lg text-xs glass-btn disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================
     REFERENSI - ANGKATAN
     ============================================================ */

  const renderRefAngkatan = () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold gradient-text">Tahun Angkatan</h1>
      <div className="glass-card p-5">
        <div className="flex gap-3 max-w-md">
          <input type="number" value={addAngkatanYear} onChange={e => setAddAngkatanYear(e.target.value)}
            placeholder="Tahun angkatan (misal: 2024)" min={2000} max={2100}
            className="glass-input flex-1 px-4 py-2 text-sm outline-none"
            onKeyDown={e => e.key === 'Enter' && handleAddAngkatan()} />
          <button onClick={handleAddAngkatan} className="glass-btn px-4 py-2 text-sm font-medium flex items-center gap-1.5 bg-teal-500/20 border-teal-500/30 text-teal-700 dark:text-teal-300">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {angkatanList.sort((a, b) => b.year - a.year).map(a => (
            <div key={a.id} className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-2">
              <GraduationCap className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium">{a.year}</span>
              <span className="text-xs text-muted-foreground">({a._count?.siswa || 0})</span>
              <button onClick={() => confirmDelete('angkatan', a.id, String(a.year))}
                className="ml-1 p-1 rounded-lg hover:bg-red-500/15 text-red-400 transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {angkatanList.length === 0 && <p className="text-muted-foreground text-sm">Belum ada angkatan</p>}
        </div>
      </div>
    </div>
  );

  /* ============================================================
     REFERENSI - KELAS
     ============================================================ */

  const renderRefKelas = () => {
    const kelasRpp = 10;
    const totalKelasPages = Math.ceil(kelasList.length / kelasRpp);
    const paginatedKelas = kelasList.slice((kelasPage - 1) * kelasRpp, kelasPage * kelasRpp);

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold gradient-text">Data Kelas</h1>
        <div className="glass-card p-5">
          <div className="flex gap-3 max-w-md">
            <input value={addKelasName} onChange={e => setAddKelasName(e.target.value)}
              placeholder="Nama kelas (misal: X IPA 1)"
              className="glass-input flex-1 px-4 py-2 text-sm outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAddKelas()} />
            <button onClick={handleAddKelas} className="glass-btn px-4 py-2 text-sm font-medium flex items-center gap-1.5 bg-teal-500/20 border-teal-500/30 text-teal-700 dark:text-teal-300">
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-500/8 dark:bg-teal-500/5 border-b border-border/30">
                  <th className="text-left py-3 px-4 font-semibold text-xs w-10">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs">Nama Kelas</th>
                  <th className="text-center py-3 px-4 font-semibold text-xs">Jumlah Siswa</th>
                  <th className="text-center py-3 px-4 font-semibold text-xs w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedKelas.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">Tidak ada data kelas</td></tr>
                ) : paginatedKelas.map((k, i) => (
                  <tr key={k.id} className="glass-table-row border-b border-border/15">
                    <td className="py-3 px-4 text-muted-foreground">{(kelasPage - 1) * kelasRpp + i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-center">{k._count?.siswa || 0}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => confirmDelete('kelas', k.id, k.name)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalKelasPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
              <span className="text-xs text-muted-foreground">Hal {kelasPage} dari {totalKelasPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setKelasPage(p => Math.max(1, p - 1))} disabled={kelasPage === 1}
                  className="px-3 py-1 rounded-lg text-xs glass-btn disabled:opacity-30">Prev</button>
                <button onClick={() => setKelasPage(p => Math.min(totalKelasPages, p + 1))} disabled={kelasPage === totalKelasPages}
                  className="px-3 py-1 rounded-lg text-xs glass-btn disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================
     REFERENSI - MAPEL
     ============================================================ */

  const renderRefMapel = () => {
    const mapelRpp = 10;
    const mapelPageLocal = 1;
    const totalMapelPages = Math.ceil(mapelList.length / mapelRpp);
    const paginatedMapel = mapelList.slice((mapelPageLocal - 1) * mapelRpp, mapelPageLocal * mapelRpp);

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold gradient-text">Data Mapel</h1>

        {/* Add form */}
        <div className="glass-card p-5">
          <div className="flex gap-3 flex-wrap max-w-2xl">
            <input value={addMapelName} onChange={e => setAddMapelName(e.target.value)}
              placeholder="Nama mata pelajaran"
              className="glass-input flex-1 min-w-[200px] px-4 py-2 text-sm outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAddMapel()} />
            <select value={addMapelSem} onChange={e => setAddMapelSem(parseInt(e.target.value))}
              className="glass-input px-4 py-2 text-sm outline-none bg-transparent">
              {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s} className="bg-background">Semester {s}</option>)}
            </select>
            <button onClick={handleAddMapel} className="glass-btn px-4 py-2 text-sm font-medium flex items-center gap-1.5 bg-teal-500/20 border-teal-500/30 text-teal-700 dark:text-teal-300">
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-500/8 dark:bg-teal-500/5 border-b border-border/30">
                  <th className="text-left py-3 px-4 font-semibold text-xs w-10">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs">Nama Mapel</th>
                  <th className="text-center py-3 px-4 font-semibold text-xs">Semester</th>
                  <th className="text-center py-3 px-4 font-semibold text-xs w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMapel.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">Tidak ada data mapel</td></tr>
                ) : paginatedMapel.map((m, i) => (
                  <tr key={m.id} className="glass-table-row border-b border-border/15">
                    <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-4">
                      {editMapelId === m.id ? (
                        <input value={editMapelName} onChange={e => setEditMapelName(e.target.value)}
                          className="glass-input px-3 py-1 text-sm outline-none w-full"
                          onKeyDown={e => e.key === 'Enter' && handleUpdateMapel()} />
                      ) : (
                        <span className="font-medium">{m.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editMapelId === m.id ? (
                        <select value={editMapelSem} onChange={e => setEditMapelSem(parseInt(e.target.value))}
                          className="glass-input px-3 py-1 text-sm outline-none bg-transparent">
                          {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s} className="bg-background">Sem {s}</option>)}
                        </select>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: SEM_COLORS[(m.semester - 1) % SEM_COLORS.length].bg,
                            color: SEM_COLORS[(m.semester - 1) % SEM_COLORS.length].hd,
                          }}>
                          Sem {m.semester}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {editMapelId === m.id ? (
                          <>
                            <button onClick={handleUpdateMapel} className="p-1.5 rounded-lg hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 transition">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditMapelId(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditMapelId(m.id); setEditMapelName(m.name); setEditMapelSem(m.semester); }}
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => confirmDelete('mapel', m.id, m.name)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================
     PENGATURAN PAGE
     ============================================================ */

  const renderPengaturan = () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold gradient-text">Pengaturan</h1>

      {/* School Identity */}
      <div className="glass-card p-6 glow-hover">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-teal-500" /> Identitas Sekolah
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Nama Sekolah</label>
            <input value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">NPSN</label>
            <input value={settingsForm.npsn} onChange={e => setSettingsForm(f => ({ ...f, npsn: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Alamat</label>
            <input value={settingsForm.address} onChange={e => setSettingsForm(f => ({ ...f, address: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Kota</label>
            <input value={settingsForm.city} onChange={e => setSettingsForm(f => ({ ...f, city: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Akreditasi</label>
            <input value={settingsForm.accreditation} onChange={e => setSettingsForm(f => ({ ...f, accreditation: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Telepon</label>
            <input value={settingsForm.phone} onChange={e => setSettingsForm(f => ({ ...f, phone: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Email</label>
            <input value={settingsForm.email} onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
        </div>

        {/* Logo upload */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Logo Sekolah</label>
          <div className="flex items-center gap-4">
            {settingsForm.logo && (
              <img src={settingsForm.logo} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-white/5 p-1" />
            )}
            <label className="glass-btn px-4 py-2 text-sm cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="glass-card p-6 glow-hover">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-500" /> Akun Admin
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Nama Tampilan</label>
            <input value={adminForm.displayName} onChange={e => setAdminForm(f => ({ ...f, displayName: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Username</label>
            <input value={adminForm.username} onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))}
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Password Baru</label>
            <input type="password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Kosongkan jika tidak diubah"
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Konfirmasi Password</label>
            <input type="password" value={adminForm.confirmPassword} onChange={e => setAdminForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Ulangi password baru"
              className="glass-input w-full px-4 py-2 text-sm outline-none" />
          </div>
        </div>
      </div>

      <button onClick={handleSaveSettings} disabled={loading}
        className="glass-btn px-6 py-2.5 text-sm font-medium flex items-center gap-2 bg-teal-500/20 border-teal-500/30 text-teal-700 dark:text-teal-300">
        <Save className="w-4 h-4" /> {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </div>
  );

  /* ============================================================
     STUDENT MODAL
     ============================================================ */

  const renderStudentModal = () => {
    if (!showStudentModal) return null;
    const wordCountCita = formCita.trim() ? formCita.trim().split(/\s+/).length : 0;
    const wordCountMutiara = formKataMutiara.trim() ? formKataMutiara.trim().split(/\s+/).length : 0;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowStudentModal(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="glass-modal relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">{editStudent ? 'Edit Siswa' : 'Tambah Siswa'}</h2>
            <button onClick={() => setShowStudentModal(false)} className="p-2 rounded-lg hover:bg-white/10 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama <span className="text-red-400">*</span></label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm outline-none" placeholder="Nama lengkap" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">NISN <span className="text-red-400">*</span></label>
                <input value={formNisn} onChange={e => setFormNisn(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm outline-none" placeholder="NISN" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kelas <span className="text-red-400">*</span></label>
                <select value={formKelasId} onChange={e => setFormKelasId(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm outline-none bg-transparent">
                  <option value="" className="bg-background">Pilih Kelas</option>
                  {kelasList.map(k => <option key={k.id} value={String(k.id)} className="bg-background">{k.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Jenis Kelamin</label>
                <select value={formJk} onChange={e => setFormJk(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm outline-none bg-transparent">
                  <option value="L" className="bg-background">Laki-laki</option>
                  <option value="P" className="bg-background">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Angkatan <span className="text-red-400">*</span></label>
                <select value={formAngkatanId} onChange={e => setFormAngkatanId(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm outline-none bg-transparent">
                  <option value="" className="bg-background">Pilih Angkatan</option>
                  {angkatanList.map(a => <option key={a.id} value={String(a.id)} className="bg-background">{a.year}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tempat Lahir</label>
                <input value={formBirthPlace} onChange={e => setFormBirthPlace(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm outline-none" placeholder="Kota kelahiran" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tanggal Lahir</label>
                <input type="date" value={formBirthDate} onChange={e => setFormBirthDate(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Cita-cita <span className="text-xs text-muted-foreground">({wordCountCita}/50 kata)</span></label>
              <textarea value={formCita} onChange={e => { const words = e.target.value.trim().split(/\s+/); if (words.length <= 50) setFormCita(e.target.value); }}
                className="glass-input w-full px-4 py-2 text-sm outline-none resize-none" rows={2} placeholder="Cita-cita siswa" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Kata Mutiara <span className="text-xs text-muted-foreground">({wordCountMutiara}/50 kata)</span></label>
              <textarea value={formKataMutiara} onChange={e => { const words = e.target.value.trim().split(/\s+/); if (words.length <= 50) setFormKataMutiara(e.target.value); }}
                className="glass-input w-full px-4 py-2 text-sm outline-none resize-none" rows={2} placeholder="Kata mutiara siswa" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Foto</label>
              <div className="flex items-center gap-4">
                {formFoto && (
                  <div className="relative">
                    <img src={formFoto} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                    <button onClick={() => setFormFoto('')}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <label className="glass-btn px-4 py-2 text-sm cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Foto
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowStudentModal(false)} className="glass-btn px-4 py-2 text-sm">Batal</button>
            <button onClick={handleSaveStudent} disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-400 hover:to-emerald-500 transition shadow-lg shadow-teal-500/20 disabled:opacity-50">
              {loading ? 'Menyimpan...' : editStudent ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================
     CV PREVIEW MODAL
     ============================================================ */

  const renderCvModal = () => {
    if (!showCvModal) return null;
    const cv = cvData;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowCvModal(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="glass-modal relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
          {cv ? (
            <div className="cv-preview">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 rounded-t-2xl">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/30">
                    {cv.siswa.foto ? (
                      <img src={cv.siswa.foto} alt={cv.siswa.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{cv.siswa.name}</h2>
                    <p className="text-teal-100/80 text-sm">NISN: {cv.siswa.nisn}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                    {cv.siswa.kelas?.name}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Angkatan {cv.siswa.angkatan?.year}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${cv.siswa.jk === 'L' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                    {cv.siswa.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                  {cv.overallAverage > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Rata-rata: {cv.overallAverage}
                    </span>
                  )}
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cv.siswa.birthPlace && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-teal-500" />
                      <span className="text-muted-foreground">Tempat Lahir:</span>
                      <span>{cv.siswa.birthPlace}</span>
                    </div>
                  )}
                  {cv.siswa.birthDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-teal-500" />
                      <span className="text-muted-foreground">Tgl Lahir:</span>
                      <span>{cv.siswa.birthDate}</span>
                    </div>
                  )}
                  {cv.siswa.cita && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-muted-foreground">Cita-cita:</span>
                      <span>{cv.siswa.cita}</span>
                    </div>
                  )}
                </div>

                {/* Kata Mutiara */}
                {cv.siswa.kataMutiara && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-4 rounded-xl border border-amber-200/30 dark:border-amber-700/20">
                    <div className="flex items-start gap-2">
                      <Quote className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm italic">{cv.siswa.kataMutiara}</p>
                    </div>
                  </div>
                )}

                {/* Nilai per Semester */}
                {Object.keys(cv.nilaiBySemester).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-500" /> Nilai per Semester
                    </h3>
                    {Object.entries(cv.nilaiBySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, items]) => {
                      const semIdx = (parseInt(sem) - 1) % SEM_COLORS.length;
                      const avg = cv.semesterAverages[parseInt(sem)] || 0;
                      return (
                        <div key={sem} className="rounded-xl overflow-hidden border" style={{ borderColor: SEM_COLORS[semIdx].hd + '30' }}>
                          <div className="px-4 py-2 font-semibold text-sm flex items-center justify-between"
                            style={{ backgroundColor: SEM_COLORS[semIdx].bg, color: SEM_COLORS[semIdx].hd }}>
                            <span>Semester {sem}</span>
                            <span>Rata-rata: {avg}</span>
                          </div>
                          <div className="p-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-background/50 rounded-lg px-3 py-2">
                                  <span className="truncate mr-2">{item.mapel}</span>
                                  <span className="font-bold" style={{ color: SEM_COLORS[semIdx].hd }}>{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-border/30 text-center text-xs text-muted-foreground">
                  <p>{settingsData?.school?.name || 'SMA Nusantara'} &mdash; Dicetak pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
          )}

          <button onClick={() => setShowCvModal(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 backdrop-blur text-white hover:bg-black/30 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  /* ============================================================
     IMPORT MODAL
     ============================================================ */

  const renderImportModal = () => {
    if (!showImportModal) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="glass-modal relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Import Data Siswa</h2>
            <button onClick={() => setShowImportModal(false)} className="p-2 rounded-lg hover:bg-white/10 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Upload zone */}
          <div className="border-2 border-dashed border-teal-300/30 rounded-xl p-8 text-center mb-4 hover:border-teal-300/50 transition">
            <Upload className="w-10 h-10 mx-auto text-teal-400/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Upload file CSV dengan format: nama, nisn, kelas, jk, tempat_lahir, tgl_lahir</p>
            <label className="glass-btn px-4 py-2 text-sm cursor-pointer inline-flex items-center gap-2 bg-teal-500/20 border-teal-500/30 text-teal-700 dark:text-teal-300">
              <Upload className="w-4 h-4" /> Pilih File CSV
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>

          {/* Preview */}
          {importPreview.length > 0 && (
            <>
              <p className="text-sm font-medium mb-2">{importPreview.length} data akan diimpor ke Angkatan {currentAngkatanYear}</p>
              <div className="overflow-x-auto mb-4 max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-teal-500/10 border-b border-border/30">
                      <th className="py-2 px-2 text-left">#</th>
                      <th className="py-2 px-2 text-left">Nama</th>
                      <th className="py-2 px-2 text-left">NISN</th>
                      <th className="py-2 px-2 text-left">Kelas</th>
                      <th className="py-2 px-2 text-left">JK</th>
                      <th className="py-2 px-2 text-left">Tempat Lahir</th>
                      <th className="py-2 px-2 text-left">Tgl Lahir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((r, i) => (
                      <tr key={i} className="border-b border-border/10">
                        <td className="py-1.5 px-2">{i + 1}</td>
                        <td className="py-1.5 px-2">{r.nama}</td>
                        <td className="py-1.5 px-2">{r.nisn}</td>
                        <td className="py-1.5 px-2">{r.kelas}</td>
                        <td className="py-1.5 px-2">{r.jk}</td>
                        <td className="py-1.5 px-2">{r.tempat_lahir}</td>
                        <td className="py-1.5 px-2">{r.tgl_lahir}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setImportPreview([])} className="glass-btn px-4 py-2 text-sm">Reset</button>
                <button onClick={handleImport} disabled={loading}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-400 hover:to-emerald-500 transition shadow-lg shadow-teal-500/20 disabled:opacity-50">
                  {loading ? 'Mengimpor...' : 'Import'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================
     DELETE CONFIRM MODAL
     ============================================================ */

  const renderDeleteConfirm = () => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="glass-modal relative w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-foreground">&quot;{showDeleteConfirm.name}&quot;</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="glass-btn flex-1 px-4 py-2 text-sm">Batal</button>
              <button onClick={executeDelete}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition">
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================
     CONTENT ROUTER
     ============================================================ */

  const renderContent = () => {
    switch (currentPage) {
      case 'beranda': return renderDashboard();
      case 'siswa': return renderSiswaPage();
      case 'nilai': return renderNilaiPage();
      case 'ref-angkatan': return renderRefAngkatan();
      case 'ref-kelas': return renderRefKelas();
      case 'ref-mapel': return renderRefMapel();
      case 'pengaturan': return renderPengaturan();
      default: return renderDashboard();
    }
  };

  /* ============================================================
     MAIN RENDER
     ============================================================ */

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="bg-gradient-mesh" />
      <div className="bg-blob-1" />
      <div className="bg-blob-2" />
      <div className="bg-blob-3" />

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="flex items-center gap-3 p-3 lg:p-4 border-b border-border/20 bg-background/50 backdrop-blur-lg sticky top-0 z-30">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-teal-500" />
            <h2 className="text-sm font-semibold">
              {currentPage === 'beranda' ? 'Beranda' :
               currentPage === 'siswa' ? `Data Siswa — Angkatan ${currentAngkatanYear}` :
               currentPage === 'nilai' ? `Data Nilai — Angkatan ${currentAngkatanYear}` :
               currentPage === 'ref-angkatan' ? 'Referensi — Tahun Angkatan' :
               currentPage === 'ref-kelas' ? 'Referensi — Data Kelas' :
               currentPage === 'ref-mapel' ? 'Referensi — Data Mapel' :
               currentPage === 'pengaturan' ? 'Pengaturan' : 'Beranda'}
            </h2>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </header>

        {/* Content area */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto custom-scrollbar">
          {renderContent()}
        </div>

        {/* Footer - sticky to bottom */}
        <footer className="mt-auto px-4 py-3 text-center text-xs text-muted-foreground border-t border-border/20 bg-background/30">
          Sistem Informasi Siswa &copy; {new Date().getFullYear()}
        </footer>
      </main>

      {/* Modals */}
      {renderStudentModal()}
      {renderCvModal()}
      {renderImportModal()}
      {renderDeleteConfirm()}
    </div>
  );
}

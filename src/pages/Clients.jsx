import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Building2, Home, Landmark, GraduationCap, Phone, Mail, MapPin, UserCheck, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { toast } from 'sonner';
import ClientForm from '../components/client/ClientForm';
import { getClients, getClientDisplayName } from '@/lib/ClientService';

const CLIENT_TYPE_OPTS = [
  { value: 'Privato', label: 'Privato', icon: UserCheck, color: '#1147FF' },
  { value: 'Azienda', label: 'Azienda', icon: Building2, color: '#10B981' },
  { value: 'Condominio', label: 'Condominio', icon: Home, color: '#F59E0B' },
  { value: 'Pubblica Amministrazione', label: 'Pubblica Amministrazione', icon: Landmark, color: '#8B5CF6' },
  { value: 'Professionista', label: 'Professionista', icon: GraduationCap, color: '#06B6D4' },
  { value: 'Altro', label: 'Altro', icon: Users, color: '#6B7280' },
];

const STATUS_OPTS = ['Lead', 'Prospect', 'Cliente Attivo', 'Cliente Inattivo', 'Ex Cliente', 'Partner'];
const SOURCE_OPTS = ['Passaparola', 'Sito Web', 'Social', 'Google', 'Campagna Pubblicitaria', 'Referral', 'PA / Gara', 'Altro'];

export default function Clients() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const { activeTenant } = globalContext;
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(true);
  
  const [form, setForm] = useState({
    client_type: 'Privato',
    status: 'Lead',
    source: '',
    email: '',
    phone: '',
    privacy_accepted: false,
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      if (!activeTenant?.id) {
        toast.error('Tenant non selezionato');
        return;
      }
      const data = await getClients(activeTenant.id);
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
      toast.error('Errore nel caricamento clienti');
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      c.name?.toLowerCase().includes(q) || 
      c.surname?.toLowerCase().includes(q) || 
      c.company_name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q) ||
      c.condominium_name?.toLowerCase().includes(q) ||
      c.entity_name?.toLowerCase().includes(q);
    const matchType = !typeFilter || c.client_type === typeFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: clients.length,
    privato: clients.filter(c => c.client_type === 'Privato').length,
    azienda: clients.filter(c => c.client_type === 'Azienda').length,
    condominio: clients.filter(c => c.client_type === 'Condominio').length,
    pa: clients.filter(c => c.client_type === 'Pubblica Amministrazione').length,
    professionista: clients.filter(c => c.client_type === 'Professionista').length,
    lead: clients.filter(c => c.status === 'Lead').length,
    attivo: clients.filter(c => c.status === 'Cliente Attivo').length,
  };

  const save = async (e) => {
    e.preventDefault();
    
    if (!activeTenant?.id) {
      toast.error('Tenant non selezionato');
      return;
    }

    try {
      const clientData = {
        ...form,
        company_id: activeTenant.id,
      };
      
      await base44.entities.Client.create(clientData);
      toast.success('Cliente creato con successo');
      setShowForm(false);
      setForm({
        client_type: 'Privato',
        status: 'Lead',
        source: '',
        email: '',
        phone: '',
        privacy_accepted: false,
      });
      await loadClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Errore nella creazione cliente: ' + error.message);
    }
  };

  const getClientIcon = (type) => {
    const opt = CLIENT_TYPE_OPTS.find(o => o.value === type);
    return opt?.icon || Users;
  };

  const getClientColor = (type) => {
    const opt = CLIENT_TYPE_OPTS.find(o => o.value === type);
    return opt?.color || '#6B7280';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} clienti registrati</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          <Plus className="w-4 h-4" /> Nuovo Cliente
        </button>
      </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 flex-shrink-0" style={{ color: '#1147FF' }} />
              <span className="text-xs text-gray-500 font-medium">Totale</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#1147FF' }} />
              <span className="text-xs text-gray-500 font-medium">Privati</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.privato}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} />
              <span className="text-xs text-gray-500 font-medium">Aziende</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.azienda}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4 flex-shrink-0" style={{ color: '#F59E0B' }} />
              <span className="text-xs text-gray-500 font-medium">Condomini</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.condominio}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-4 h-4 flex-shrink-0" style={{ color: '#8B5CF6' }} />
              <span className="text-xs text-gray-500 font-medium">PA</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pa}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 flex-shrink-0" style={{ color: '#06B6D4' }} />
              <span className="text-xs text-gray-500 font-medium">Professionisti</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.proprietario}</p>
          </div>
        </div>
      )}

      {/* Filters */}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Cerca cliente..." 
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" 
          />
        </div>
        <select 
          value={typeFilter} 
          onChange={e => setTypeFilter(e.target.value)} 
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
        >
          <option value="">Tutti i tipi</option>
          {CLIENT_TYPE_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
        >
          <option value="">Tutti gli stati</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            {clients.length === 0 ? (
              <>
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Nessun cliente registrato</h3>
                <p className="text-sm text-gray-500 mb-4">Crea il primo cliente per iniziare a gestire progetti, immobili e preventivi.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm text-white rounded-lg font-medium"
                  style={{ backgroundColor: '#1147FF' }}
                >
                  Crea primo cliente
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Nessun cliente trovato</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => {
              const Icon = getClientIcon(c.client_type);
              const color = getClientColor(c.client_type);
              const displayName = c.client_type === 'Privato' 
                ? `${c.name} ${c.surname}` 
                : c.client_type === 'Condominio'
                ? c.condominium_name
                : c.client_type === 'Pubblica Amministrazione'
                ? c.entity_name
                : c.company_name || c.studio_name || 'N/D';

              return (
                <div 
                  key={c.id} 
                  onClick={() => navigate(`/clients/${c.id}`)} 
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm truncate">{displayName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color: color }}>
                        {c.client_type}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                      {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>}
                      {c.source && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{c.source}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <ClientForm 
          form={form}
          setForm={setForm}
          onSave={save}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
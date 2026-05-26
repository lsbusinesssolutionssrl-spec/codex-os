import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Edit2, Save, X, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const TABS = ['Proprietà', 'Preventivi', 'Progetti', 'Ticket', 'Documenti'];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [properties, setProperties] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState('Proprietà');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const load = async () => {
      const c = await base44.entities.Client.filter({ id });
      if (c[0]) { setClient(c[0]); setForm(c[0]); }
      const [props, ests, projs, tkts, docs] = await Promise.all([
        base44.entities.Property.filter({ client_id: id }),
        base44.entities.Estimate.filter({ client_id: id }),
        base44.entities.Project.filter({ client_id: id }),
        base44.entities.SupportTicket.filter({ client_id: id }),
        base44.entities.Document.filter({ client_id: id }),
      ]);
      setProperties(props); setEstimates(ests); setProjects(projs); setTickets(tkts); setDocuments(docs);
    };
    load();
  }, [id]);

  const save = async () => {
    const updated = await base44.entities.Client.update(id, form);
    setClient(updated); setEditing(false);
  };

  const deleteRecord = async () => {
    await base44.entities.Client.delete(id);
    navigate('/clients');
  };

  if (!client) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  if (confirmDelete) return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-4">
      <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
      <h2 className="font-bold text-gray-900">Elimina cliente?</h2>
      <p className="text-sm text-gray-500">Questa azione è irreversibile.</p>
      <div className="flex gap-2">
        <button onClick={deleteRecord} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg font-medium hover:bg-red-600">Elimina</button>
        <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
      </div>
    </div>
  );

  const tabContent = {
    'Proprietà': properties,
    'Preventivi': estimates,
    'Progetti': projects,
    'Ticket': tickets,
    'Documenti': documents,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{client.name} {client.company_name && `· ${client.company_name}`}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            {client.type && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{client.type}</span>}
            {client.source && <span className="text-xs text-gray-400">{client.source}</span>}
          </div>
        </div>
        {!editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Edit2 className="w-3.5 h-3.5" /> Modifica
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
              <Save className="w-3.5 h-3.5" /> Salva
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {editing ? (
          <>
            {[['name', 'Nome'], ['company_name', 'Cognome/Azienda'], ['phone', 'Telefono'], ['email', 'Email'], ['address', 'Indirizzo']].map(([k, label]) => (
              <div key={k} className={k === 'address' || k === 'notes' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </>
        ) : (
          <>
            {client.phone && <div className="flex items-center gap-2 text-sm text-gray-700"><Phone className="w-4 h-4 text-gray-400" />{client.phone}</div>}
            {client.email && <div className="flex items-center gap-2 text-sm text-gray-700"><Mail className="w-4 h-4 text-gray-400" />{client.email}</div>}
            {client.address && <div className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2"><MapPin className="w-4 h-4 text-gray-400" />{client.address}</div>}
            {client.notes && <div className="sm:col-span-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{client.notes}</div>}
          </>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t} ({tabContent[t]?.length || 0})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {(tabContent[tab] || []).length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Nessun record trovato</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(tabContent[tab] || []).map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <span className="text-sm text-gray-800 font-medium">{item.title || item.property_name || item.name || item.id}</span>
                <div className="flex items-center gap-2">
                  {item.status && <StatusBadge status={item.status} />}
                  {item.priority && <StatusBadge status={item.priority} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { X } from 'lucide-react';
import { SectionTitle, Input, Select, Checkbox } from './FormFields';
import { UserCheck, Building2, Home, Landmark, GraduationCap } from 'lucide-react';

const STATUS_OPTS = ['Lead', 'Prospect', 'Cliente Attivo', 'Cliente Inattivo', 'Ex Cliente', 'Partner'];
const SOURCE_OPTS = ['Passaparola', 'Sito Web', 'Social', 'Google', 'Campagna Pubblicitaria', 'Referral', 'PA / Gara', 'Altro'];
const PAYMENT_METHOD_OPTS = ['Bonifico', 'Contanti', 'Carta di Credito', 'PayPal', 'Altro'];
const DOCUMENT_TYPE_OPTS = ['Carta d\'Identità', 'Patente', 'Passaporto', 'Altro'];

export default function ClientForm({ form, setForm, onSave, onClose }) {
  const clientType = form.client_type;

  const renderFields = () => {
    switch (clientType) {
      case 'Privato':
        return (
          <>
            <SectionTitle icon={UserCheck} title="Dati Personali" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <Input label="Cognome *" value={form.surname} onChange={v => setForm(f => ({ ...f, surname: v }))} required />
              <Input label="Codice Fiscale *" value={form.fiscal_code} onChange={v => setForm(f => ({ ...f, fiscal_code: v.toUpperCase() }))} required minLength={6} maxLength={16} />
              <Input label="Data di Nascita" type="date" value={form.birth_date} onChange={v => setForm(f => ({ ...f, birth_date: v }))} />
              <Input label="Luogo di Nascita" value={form.birth_place} onChange={v => setForm(f => ({ ...f, birth_place: v }))} />
              <Input label="Tipo Documento" type="select" value={form.document_type} onChange={v => setForm(f => ({ ...f, document_type: v }))} options={DOCUMENT_TYPE_OPTS} />
              <Input label="Numero Documento" value={form.document_number} onChange={v => setForm(f => ({ ...f, document_number: v }))} />
              <Input label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" required />
              <Input label="Telefono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            </div>

            <SectionTitle icon={Home} title="Residenza" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Indirizzo" value={form.street} onChange={v => setForm(f => ({ ...f, street: v }))} className="col-span-2" />
              <Input label="CAP" value={form.zip} onChange={v => setForm(f => ({ ...f, zip: v }))} />
              <Input label="Comune" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Provincia" value={form.province} onChange={v => setForm(f => ({ ...f, province: v }))} />
              <Input label="Regione" value={form.region} onChange={v => setForm(f => ({ ...f, region: v }))} />
              <Input label="Paese" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} defaultValue="Italia" />
            </div>

            <SectionTitle icon={UserCheck} title="Preferenze" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Fonte" value={form.source} onChange={v => setForm(f => ({ ...f, source: v }))} options={SOURCE_OPTS} />
              <Select label="Stato" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTS} required />
              <Checkbox label="Privacy/GDPR accettata" checked={form.privacy_accepted} onChange={v => setForm(f => ({ ...f, privacy_accepted: v }))} />
            </div>
          </>
        );

      case 'Azienda':
        return (
          <>
            <SectionTitle icon={Building2} title="Dati Aziendali" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ragione Sociale *" value={form.company_name} onChange={v => setForm(f => ({ ...f, company_name: v }))} required className="col-span-2" />
              <Input label="Nome Commerciale" value={form.trade_name} onChange={v => setForm(f => ({ ...f, trade_name: v }))} />
              <Input label="Partita IVA *" value={form.vat_number} onChange={v => setForm(f => ({ ...f, vat_number: v }))} required pattern="[0-9]{11}" />
              <Input label="Codice Fiscale" value={form.fiscal_code} onChange={v => setForm(f => ({ ...f, fiscal_code: v.toUpperCase() }))} />
              <Input label="Codice SDI *" value={form.sdi_code} onChange={v => setForm(f => ({ ...f, sdi_code: v.toUpperCase() }))} required />
              <Input label="PEC *" value={form.pec} onChange={v => setForm(f => ({ ...f, pec: v }))} type="email" required />
              <Input label="Email Ordinaria" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Input label="Telefono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input label="Sito Web" value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} />
            </div>

            <SectionTitle icon={Home} title="Sede Legale" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Indirizzo" value={form.street} onChange={v => setForm(f => ({ ...f, street: v }))} className="col-span-2" />
              <Input label="CAP" value={form.zip} onChange={v => setForm(f => ({ ...f, zip: v }))} />
              <Input label="Comune" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Provincia" value={form.province} onChange={v => setForm(f => ({ ...f, province: v }))} />
              <Input label="Regione" value={form.region} onChange={v => setForm(f => ({ ...f, region: v }))} />
            </div>

            <SectionTitle icon={UserCheck} title="Referente" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome Referente" value={form.contact_name} onChange={v => setForm(f => ({ ...f, contact_name: v }))} />
              <Input label="Cognome Referente" value={form.contact_surname} onChange={v => setForm(f => ({ ...f, contact_surname: v }))} />
              <Input label="Ruolo" value={form.contact_role} onChange={v => setForm(f => ({ ...f, contact_role: v }))} />
              <Input label="Email Referente" value={form.contact_email} onChange={v => setForm(f => ({ ...f, contact_email: v }))} type="email" />
              <Input label="Telefono Referente" value={form.contact_phone} onChange={v => setForm(f => ({ ...f, contact_phone: v }))} />
            </div>

            <SectionTitle icon={Building2} title="Fatturazione" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Modalità Pagamento" value={form.payment_method} onChange={v => setForm(f => ({ ...f, payment_method: v }))} options={PAYMENT_METHOD_OPTS} />
              <Input label="IBAN" value={form.iban} onChange={v => setForm(f => ({ ...f, iban: v }))} />
              <Input label="Note Amministrative" value={form.administrative_notes} onChange={v => setForm(f => ({ ...f, administrative_notes: v }))} className="col-span-2" />
            </div>
          </>
        );

      case 'Condominio':
        return (
          <>
            <SectionTitle icon={Home} title="Dati Condominio" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome Condominio *" value={form.condominium_name} onChange={v => setForm(f => ({ ...f, condominium_name: v }))} required className="col-span-2" />
              <Input label="Codice Fiscale Condominio *" value={form.condominium_fiscal_code} onChange={v => setForm(f => ({ ...f, condominium_fiscal_code: v.toUpperCase() }))} required />
              <Input label="Indirizzo *" value={form.street} onChange={v => setForm(f => ({ ...f, street: v }))} required className="col-span-2" />
              <Input label="CAP" value={form.zip} onChange={v => setForm(f => ({ ...f, zip: v }))} />
              <Input label="Comune" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Provincia" value={form.province} onChange={v => setForm(f => ({ ...f, province: v }))} />
            </div>

            <SectionTitle icon={UserCheck} title="Amministratore" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Studio Amministratore" value={form.administrator_studio} onChange={v => setForm(f => ({ ...f, administrator_studio: v }))} />
              <Input label="Nome Amministratore" value={form.administrator_name} onChange={v => setForm(f => ({ ...f, administrator_name: v }))} />
              <Input label="Cognome Amministratore" value={form.administrator_surname} onChange={v => setForm(f => ({ ...f, administrator_surname: v }))} />
              <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Input label="PEC" value={form.pec} onChange={v => setForm(f => ({ ...f, pec: v }))} type="email" />
              <Input label="Telefono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input label="Codice Fiscale / P.IVA" value={form.fiscal_code} onChange={v => setForm(f => ({ ...f, fiscal_code: v.toUpperCase() }))} />
            </div>

            <SectionTitle icon={Building2} title="Fatturazione" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="PEC Condominio" value={form.administrative_notes} onChange={v => setForm(f => ({ ...f, administrative_notes: v }))} type="email" />
              <Input label="Codice SDI" value={form.sdi_code} onChange={v => setForm(f => ({ ...f, sdi_code: v.toUpperCase() }))} />
            </div>
          </>
        );

      case 'Pubblica Amministrazione':
        return (
          <>
            <SectionTitle icon={Landmark} title="Ente" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Denominazione Ente *" value={form.entity_name} onChange={v => setForm(f => ({ ...f, entity_name: v }))} required className="col-span-2" />
              <Input label="Codice Fiscale Ente *" value={form.fiscal_code} onChange={v => setForm(f => ({ ...f, fiscal_code: v.toUpperCase() }))} required />
              <Input label="Partita IVA" value={form.vat_number} onChange={v => setForm(f => ({ ...f, vat_number: v }))} />
              <Input label="Codice IPA *" value={form.ipa_code} onChange={v => setForm(f => ({ ...f, ipa_code: v.toUpperCase() }))} required />
              <Input label="Codice Univoco Ufficio *" value={form.office_code} onChange={v => setForm(f => ({ ...f, office_code: v.toUpperCase() }))} required />
              <Input label="PEC *" value={form.pec} onChange={v => setForm(f => ({ ...f, pec: v }))} type="email" required />
              <Input label="Email Istituzionale" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Input label="Telefono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            </div>

            <SectionTitle icon={Home} title="Sede" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Indirizzo" value={form.street} onChange={v => setForm(f => ({ ...f, street: v }))} className="col-span-2" />
              <Input label="CAP" value={form.zip} onChange={v => setForm(f => ({ ...f, zip: v }))} />
              <Input label="Comune" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Provincia" value={form.province} onChange={v => setForm(f => ({ ...f, province: v }))} />
              <Input label="Regione" value={form.region} onChange={v => setForm(f => ({ ...f, region: v }))} />
            </div>

            <SectionTitle icon={UserCheck} title="Referente" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome Referente" value={form.contact_name} onChange={v => setForm(f => ({ ...f, contact_name: v }))} />
              <Input label="Cognome Referente" value={form.contact_surname} onChange={v => setForm(f => ({ ...f, contact_surname: v }))} />
              <Input label="Ufficio" value={form.contact_office} onChange={v => setForm(f => ({ ...f, contact_office: v }))} />
              <Input label="Ruolo" value={form.contact_role} onChange={v => setForm(f => ({ ...f, contact_role: v }))} />
              <Input label="Email" value={form.contact_email} onChange={v => setForm(f => ({ ...f, contact_email: v }))} type="email" />
              <Input label="Telefono" value={form.contact_phone} onChange={v => setForm(f => ({ ...f, contact_phone: v }))} />
            </div>

            <SectionTitle icon={Building2} title="Dati Amministrativi" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="CIG" value={form.cig} onChange={v => setForm(f => ({ ...f, cig: v.toUpperCase() }))} />
              <Input label="CUP" value={form.cup} onChange={v => setForm(f => ({ ...f, cup: v.toUpperCase() }))} />
              <Input label="Determina / Riferimento" value={form.administrative_reference} onChange={v => setForm(f => ({ ...f, administrative_reference: v }))} className="col-span-2" />
            </div>
          </>
        );

      case 'Professionista':
        return (
          <>
            <SectionTitle icon={GraduationCap} title="Dati Professionista" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Input label="Cognome" value={form.surname} onChange={v => setForm(f => ({ ...f, surname: v }))} />
              <Input label="Studio / Denominazione" value={form.studio_name} onChange={v => setForm(f => ({ ...f, studio_name: v }))} />
              <Input label="Partita IVA" value={form.vat_number} onChange={v => setForm(f => ({ ...f, vat_number: v }))} />
              <Input label="Codice Fiscale" value={form.fiscal_code} onChange={v => setForm(f => ({ ...f, fiscal_code: v.toUpperCase() }))} />
              <Input label="PEC" value={form.pec} onChange={v => setForm(f => ({ ...f, pec: v }))} type="email" />
              <Input label="SDI" value={form.sdi_code} onChange={v => setForm(f => ({ ...f, sdi_code: v.toUpperCase() }))} />
              <Input label="Ordine / Albo" value={form.professional_register} onChange={v => setForm(f => ({ ...f, professional_register: v }))} />
              <Input label="Numero Iscrizione" value={form.register_number} onChange={v => setForm(f => ({ ...f, register_number: v }))} />
              <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Input label="Telefono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            </div>

            <SectionTitle icon={Home} title="Indirizzo Studio" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Indirizzo" value={form.street} onChange={v => setForm(f => ({ ...f, street: v }))} className="col-span-2" />
              <Input label="CAP" value={form.zip} onChange={v => setForm(f => ({ ...f, zip: v }))} />
              <Input label="Comune" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Provincia" value={form.province} onChange={v => setForm(f => ({ ...f, province: v }))} />
            </div>
          </>
        );

      default:
        return (
          <>
            <SectionTitle icon={UserCheck} title="Dati Generali" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome / Denominazione" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Input label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" required />
              <Input label="Telefono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nuovo Cliente</h2>
            <p className="text-xs text-gray-500 mt-0.5">Inserisci i dati del cliente</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Tipo Cliente */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-600 mb-2">Tipo Cliente *</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { value: 'Privato', icon: UserCheck, color: '#1147FF' },
                { value: 'Azienda', icon: Building2, color: '#10B981' },
                { value: 'Condominio', icon: Home, color: '#F59E0B' },
                { value: 'Pubblica Amministrazione', icon: Landmark, color: '#8B5CF6' },
                { value: 'Professionista', icon: GraduationCap, color: '#06B6D4' },
                { value: 'Altro', icon: UserCheck, color: '#6B7280' },
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = form.client_type === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, client_type: opt.value }))}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" style={{ color: opt.color }} />
                    <span className="text-xs font-medium text-gray-700">{opt.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stato e Fonte */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Select label="Stato Cliente *" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTS} required />
            <Select label="Fonte" value={form.source} onChange={v => setForm(f => ({ ...f, source: v }))} options={SOURCE_OPTS} />
          </div>

          {/* Dynamic Fields */}
          {renderFields()}

          {/* Note */}
          <div className="mt-6">
            <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              placeholder="Note aggiuntive..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2 text-sm text-white rounded-lg font-medium"
            style={{ backgroundColor: '#1147FF' }}
          >
            Salva Cliente
          </button>
        </div>
      </div>
    </div>
  );
}
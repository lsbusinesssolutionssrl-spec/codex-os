import { useState, useEffect } from 'react';
import { Settings, X, Save, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AlertSettings({ onClose }) {
  const [settings, setSettings] = useState({
    criticalMarginThreshold: 25,
    warningMarginThreshold: 30,
    emailAlertsEnabled: true,
    pushAlertsEnabled: true,
    alertFrequency: 'immediate', // immediate, hourly, daily
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Carica settings salvati (potenzialmente da entità o localStorage)
    const saved = localStorage.getItem('executiveAlertSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    localStorage.setItem('executiveAlertSettings', JSON.stringify(settings));
    
    // Qui si potrebbe salvare su un'entità dedicata se necessario
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success('Impostazioni salvate', {
      description: 'Le soglie di alert sono state aggiornate',
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Configurazione Alert</h2>
              <p className="text-xs text-gray-500">Soglie e notifiche margini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Soglia Margine Critico */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Soglia Margine Critico (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.criticalMarginThreshold}
                onChange={e => setSettings(s => ({ ...s, criticalMarginThreshold: parseInt(e.target.value) || 0 }))}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="50"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Progetti sotto questa soglia generano alert immediati
            </p>
          </div>

          {/* Soglia Margine Attenzione */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Soglia Margine Attenzione (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.warningMarginThreshold}
                onChange={e => setSettings(s => ({ ...s, warningMarginThreshold: parseInt(e.target.value) || 0 }))}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="50"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Progetti tra questa soglia e quella critica mostrano warning
            </p>
          </div>

          {/* Toggle Email Alerts */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Email Alert</p>
                <p className="text-xs text-gray-500">Invio report giornaliero</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, emailAlertsEnabled: !s.emailAlertsEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.emailAlertsEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.emailAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Toggle Push Alerts */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Push Notification</p>
                <p className="text-xs text-gray-500">Notifiche in-app in tempo reale</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, pushAlertsEnabled: !s.pushAlertsEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.pushAlertsEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.pushAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Frequenza Alert */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Frequenza Alert
            </label>
            <select
              value={settings.alertFrequency}
              onChange={e => setSettings(s => ({ ...s, alertFrequency: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white"
            >
              <option value="immediate">Immediato (real-time)</option>
              <option value="hourly">Ogni ora</option>
              <option value="daily">Giornaliero (8:00 AM)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-semibold disabled:opacity-40"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
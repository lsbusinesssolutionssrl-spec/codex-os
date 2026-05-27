import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Calendar, Clock, Check, ArrowLeft, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RequestDemo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    phone: '',
    role: '',
    employees: '',
    current_software: '',
    challenges: '',
    preferred_date: '',
    preferred_time: '',
    message: '',
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create support ticket for demo request
      await base44.entities.SupportTicket.create({
        title: `Demo Request: ${form.company_name}`,
        issue_type: 'Sales',
        priority: 'High',
        status: 'Open',
        description: `
Company: ${form.company_name}
Email: ${form.email}
Phone: ${form.phone}
Role: ${form.role}
Employees: ${form.employees}
Current Software: ${form.current_software}
Challenges: ${form.challenges}
Preferred Date: ${form.preferred_date}
Preferred Time: ${form.preferred_time}
Message: ${form.message}
        `.trim(),
      });
      
      setSubmitted(true);
      toast.success('Demo request submitted! We\'ll contact you within 24 hours.');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in Codex OS. Our sales team will contact you at {form.email} within 24 hours to schedule your demo.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: '#1147FF' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-600 mb-6 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Demo</h1>
          <p className="text-gray-600">See how Codex OS can transform your business</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => update('company_name', e.target.value)}
                placeholder="Your company name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+39 02 1234567"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Role *</label>
              <input
                type="text"
                value={form.role}
                onChange={e => update('role', e.target.value)}
                placeholder="CEO, Operations Manager, etc."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
              <select
                value={form.employees}
                onChange={e => update('employees', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="">Select range</option>
                <option value="1-5">1-5 employees</option>
                <option value="6-20">6-20 employees</option>
                <option value="21-50">21-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="200+">200+ employees</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Software</label>
              <input
                type="text"
                value={form.current_software}
                onChange={e => update('current_software', e.target.value)}
                placeholder="What are you using now?"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Biggest Challenges</label>
            <textarea
              value={form.challenges}
              onChange={e => update('challenges', e.target.value)}
              placeholder="What are your main operational challenges?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
              <input
                type="date"
                value={form.preferred_date}
                onChange={e => update('preferred_date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
              <select
                value={form.preferred_time}
                onChange={e => update('preferred_time', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="">Select time</option>
                <option value="9:00-11:00">9:00 - 11:00</option>
                <option value="11:00-13:00">11:00 - 13:00</option>
                <option value="14:00-16:00">14:00 - 16:00</option>
                <option value="16:00-18:00">16:00 - 18:00</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Message</label>
            <textarea
              value={form.message}
              onChange={e => update('message', e.target.value)}
              placeholder="Any specific requirements or questions?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !form.company_name || !form.email || !form.role}
            className="w-full flex items-center justify-center gap-2 py-4 text-base font-semibold text-white rounded-lg disabled:opacity-40"
            style={{ backgroundColor: '#1147FF' }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Request Demo
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By submitting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
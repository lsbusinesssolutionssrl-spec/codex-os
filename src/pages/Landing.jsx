import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, Building2, Home, Shield, TrendingUp, ClipboardList, BarChart3, Check, ArrowRight, Play, Users, DollarSign, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FEATURES = [
  { icon: ClipboardList, title: 'Estimates', desc: 'AI-powered estimates with 95% accuracy', color: '#3B82F6' },
  { icon: Building2, title: 'Projects', desc: 'Complete project lifecycle management', color: '#10B981' },
  { icon: Home, title: 'Home Passport', desc: 'Property lifecycle intelligence', color: '#F59E0B' },
  { icon: BarChart3, title: 'Financial Control', desc: 'Real-time profitability tracking', color: '#8B5CF6' },
  { icon: Shield, title: 'Guardian', desc: 'Predictive maintenance subscriptions', color: '#EF4444' },
  { icon: Brain, title: 'AI Copilot', desc: 'Operational intelligence & automation', color: '#1147FF' },
  { icon: Zap, title: 'Workflow Automation', desc: 'No-code business process automation', color: '#06B6D4' },
  { icon: TrendingUp, title: 'Predictive Intelligence', desc: 'AI-driven property insights', color: '#EC4899' },
];

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '€49',
    period: '/mese',
    desc: 'Per piccole imprese',
    features: ['Fino a 3 utenti', 'Fino a 20 progetti', 'Estimates base', 'Home Passport', 'Supporto email'],
    limitations: ['No AI Copilot', 'No Financial Control', 'No Workflow Automation'],
    color: '#6B7280',
    popular: false,
  },
  {
    name: 'Professional',
    price: '€149',
    period: '/mese',
    desc: 'Per imprese in crescita',
    features: ['Fino a 15 utenti', 'Fino a 250 progetti', 'AI Estimator', 'Financial Control', 'Guardian', 'Workflow Automation', 'Supporto prioritario'],
    limitations: [],
    color: '#1147FF',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Per grandi organizzazioni',
    features: ['Utenti illimitati', 'Progetti illimitati', 'AI Copilot', 'Predictive Intelligence', 'White Label', 'API Access', 'Supporto 24/7', 'SLA garantito'],
    limitations: [],
    color: '#0B2341',
    popular: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsLoggedIn);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const handleDemo = () => {
    navigate('/request-demo');
  };

  const handleTrial = () => {
    navigate('/tenant-onboarding');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Codex OS</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/features')} className="text-sm text-gray-600 hover:text-gray-900">Features</button>
            <button onClick={() => navigate('/pricing')} className="text-sm text-gray-600 hover:text-gray-900">Pricing</button>
            <button onClick={handleDemo} className="text-sm text-gray-600 hover:text-gray-900">Request Demo</button>
            {isLoggedIn ? (
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                Dashboard
              </button>
            ) : (
              <button onClick={handleLogin} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Operating System for Construction & Maintenance
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            The OS for Modern<br />
            <span style={{ color: '#1147FF' }}>Property Companies</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Codex OS unifies estimates, projects, financial control, and AI intelligence into one powerful platform. 
            Transform your renovation, construction, and maintenance business.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleTrial}
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: '#1147FF' }}
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDemo}
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">14-day free trial · No credit card required · Setup in 5 minutes</p>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Scale</h2>
            <p className="text-lg text-gray-600">Eight powerful modules working together as one system</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: feature.color + '15' }}>
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that fits your business</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.popular ? 'border-blue-500 shadow-xl' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-white rounded-full" style={{ backgroundColor: '#1147FF' }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      {limitation}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleTrial}
                  className={`w-full py-3 text-sm font-semibold rounded-lg transition-colors ${
                    plan.popular 
                      ? 'text-white' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={plan.popular ? { backgroundColor: '#1147FF' } : {}}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Join leading construction and maintenance companies using Codex OS to scale operations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleTrial}
              className="px-8 py-4 text-base font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition-all"
            >
              Start 14-Day Free Trial
            </button>
            <button 
              onClick={handleDemo}
              className="px-8 py-4 text-base font-semibold text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Codex OS</span>
          </div>
          <p className="text-sm text-gray-500">© 2026 Codex OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
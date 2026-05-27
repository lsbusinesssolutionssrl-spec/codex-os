import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Search, Star, TrendingUp, Zap, Shield, Users, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';
import { toast } from 'sonner';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';

const MARKETPLACE_CATEGORIES = [
  { id: 'all', label: 'All', icon: Store },
  { id: 'AI', label: 'AI', icon: Zap },
  { id: 'Accounting', label: 'Accounting', icon: TrendingUp },
  { id: 'Smart Home', label: 'Smart Home', icon: Users },
  { id: 'Maintenance', label: 'Maintenance', icon: Package },
  { id: 'Real Estate', label: 'Real Estate', icon: Users },
  { id: 'Construction', label: 'Construction', icon: Package },
  { id: 'Energy', label: 'Energy', icon: Zap },
  { id: 'IoT', label: 'IoT', icon: Zap },
];

const SOLUTION_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'extension', label: 'Extensions' },
  { id: 'integration', label: 'Integrations' },
  { id: 'partner', label: 'Partner Modules' },
  { id: 'vertical', label: 'Vertical Solutions' },
];

const FEATURED_SOLUTIONS = [
  {
    id: 'sol_1',
    name: 'AI Estimator',
    slug: 'ai-estimator',
    type: 'extension',
    category: 'AI',
    description: 'AI-powered cost estimation with 95% accuracy',
    provider: { name: 'Codex OS', type: 'official' },
    pricing: { monthly: 0, yearly: 0 },
    features: ['Instant estimates', 'Material optimization', 'Labor calculation'],
    ratings: { average: 4.9, count: 234 },
    stats: { total_installs: 1850 },
    is_featured: true,
    is_new: false
  },
  {
    id: 'sol_2',
    name: 'Advanced Accounting Pro',
    slug: 'advanced-accounting-pro',
    type: 'extension',
    category: 'Accounting',
    description: 'Multi-currency accounting with automated tax filing',
    provider: { name: 'Codex OS', type: 'official' },
    pricing: { monthly: 29.99, yearly: 299.99 },
    features: ['50+ currencies', 'VAT automation', 'Financial reports'],
    ratings: { average: 4.8, count: 156 },
    stats: { total_installs: 1250 },
    is_featured: true,
    is_new: false
  },
  {
    id: 'sol_3',
    name: 'Smart Home Control',
    slug: 'smart-home-control',
    type: 'extension',
    category: 'Smart Home',
    description: 'Complete home automation with voice control',
    provider: { name: 'Codex OS', type: 'official' },
    pricing: { monthly: 9.99, yearly: 99.99, trial_days: 14 },
    features: ['Device integration', 'Automation rules', 'Energy monitoring'],
    ratings: { average: 4.7, count: 189 },
    stats: { total_installs: 980 },
    is_featured: true,
    is_new: false
  },
  {
    id: 'sol_4',
    name: 'Real Estate CRM',
    slug: 'real-estate-crm',
    type: 'vertical',
    category: 'Real Estate',
    description: 'Complete CRM for real estate professionals',
    provider: { name: 'Codex OS', type: 'official' },
    pricing: { monthly: 29.99, yearly: 299.99 },
    features: ['Property listings', 'Deal pipeline', 'Commission tracking'],
    ratings: { average: 4.8, count: 142 },
    stats: { total_installs: 760 },
    is_featured: true,
    is_new: false
  },
  {
    id: 'sol_5',
    name: 'IoT Monitoring',
    slug: 'iot-monitoring',
    type: 'extension',
    category: 'IoT',
    description: 'Industrial IoT monitoring with predictive maintenance',
    provider: { name: 'Codex OS', type: 'official' },
    pricing: { monthly: 19.99, yearly: 199.99 },
    features: ['Real-time sensors', 'ML predictions', 'Alert system'],
    ratings: { average: 4.6, count: 98 },
    stats: { total_installs: 540 },
    is_featured: false,
    is_new: true
  },
  {
    id: 'sol_6',
    name: 'Construction Analytics',
    slug: 'construction-analytics',
    type: 'vertical',
    category: 'Construction',
    description: 'Project costing and resource optimization for construction',
    provider: { name: 'Codex OS', type: 'official' },
    pricing: { monthly: 24.99, yearly: 249.99 },
    features: ['Cost tracking', 'Margin analysis', 'Resource planning'],
    ratings: { average: 4.7, count: 87 },
    stats: { total_installs: 420 },
    is_featured: false,
    is_new: true
  }
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [installedSolutions, setInstalledSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    hasRole(['admin', 'company_admin']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      const data = await base44.entities.Extension.list();
      setInstalledSolutions(data);
      setLoading(false);
    };
    load();
  }, [isAuthorized]);

  const handleInstall = async (solution) => {
    toast.info(`Installing ${solution.name}...`);
    // TODO: Implement installation flow
    // await base44.functions.invoke('installMarketplaceSolution', { solution_slug: solution.slug });
  };

  const handleTrial = async (solution) => {
    toast.info(`Starting ${solution.pricing.trial_days}-day trial of ${solution.name}...`);
    // TODO: Implement trial flow
  };

  const handleViewDetails = (solution) => {
    // TODO: Navigate to solution details page
    toast.info(`Viewing details for ${solution.name}`);
  };

  const filteredSolutions = FEATURED_SOLUTIONS.filter(solution => {
    const matchesCategory = selectedCategory === 'all' || solution.category === selectedCategory;
    const matchesType = selectedType === 'all' || solution.type === selectedType;
    const matchesSearch = solution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         solution.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesType && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'featured') return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    if (sortBy === 'rating') return b.ratings.average - a.ratings.average;
    if (sortBy === 'installs') return b.stats.total_installs - a.stats.total_installs;
    if (sortBy === 'newest') return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
    if (sortBy === 'price_low') return (a.pricing.monthly || 0) - (b.pricing.monthly || 0);
    if (sortBy === 'price_high') return (b.pricing.monthly || 0) - (a.pricing.monthly || 0);
    return 0;
  });

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">Extensions, integrations, and partner solutions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/extensions')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Package className="w-3.5 h-3.5" /> My Solutions
          </button>
          <button onClick={() => navigate('/integrations')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <TrendingUp className="w-3.5 h-3.5" /> Integrations
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Available Solutions" value={FEATURED_SOLUTIONS.length} icon={Store} color="#1147FF" />
        <StatCard label="Installed" value={installedSolutions.length} icon={Package} color="#10B981" />
        <StatCard label="Categories" value={MARKETPLACE_CATEGORIES.length - 1} icon={TrendingUp} color="#F59E0B" />
        <StatCard label="Partners" value={3} icon={Shield} color="#8B5CF6" />
      </div>

      {/* Featured Carousel */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          <h2 className="text-lg font-bold">Featured Solutions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURED_SOLUTIONS.filter(s => s.is_featured).slice(0, 3).map((solution, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">
                  {solution.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{solution.name}</h3>
                  <p className="text-xs text-white/70">{solution.provider.name}</p>
                </div>
              </div>
              <p className="text-sm text-white/80 line-clamp-2 mb-3">{solution.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {solution.pricing.monthly > 0 ? `€${solution.pricing.monthly}/mo` : 'Free'}
                </span>
                <button className="text-xs px-3 py-1.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Search & Sort */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search solutions..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="featured">Featured</option>
            <option value="rating">Top Rated</option>
            <option value="installs">Most Installed</option>
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {MARKETPLACE_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Solution Types */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {SOLUTION_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${
                selectedType === type.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSolutions.map((solution, idx) => (
          <MarketplaceCard
            key={idx}
            solution={solution}
            onInstall={handleInstall}
            onTrial={handleTrial}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {filteredSolutions.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No solutions found</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
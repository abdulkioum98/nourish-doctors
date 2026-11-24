import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { loadCachedFirst, isOnline } from '../../lib/offline';
import { 
  Lock, LogOut, Plus, Edit3, Trash2, Save, X, Loader2, 
  Wheat, FlaskConical, BookOpen, RefreshCw, ArrowLeft, Dna, Table2, KeyRound
} from 'lucide-react';

interface AdminPageProps {
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Generic table editor: the standards, vaccination and commercial-feed
// tables all have the same shape (a list + an add/edit form + delete),
// so they share one editor driven by this config instead of six copies
// of the same form/table code. The four original tabs (Nourish Feeds,
// Other Ingredients, DM Ratio, Breeds) keep their hand-written forms.
// Column names come from the pages that read these tables, so the form
// fields match exactly what the calculators and standard pages display.
// Sonali has no own standard/feed table (both are "Coming soon..." stubs)
// and Sonali Vaccination reads broiler_vaccinations, so editing the
// broiler tables covers Sonali too.
// ---------------------------------------------------------------------------
type GenericFieldType = 'text' | 'number' | 'select';

interface GenericField {
  key: string;
  label: string;
  type: GenericFieldType;
  required?: boolean;
  step?: string;
  options?: string[];
  // 'layerBreeds' fills a datalist with the breeds already in the table,
  // so a typo cannot silently create a breed nobody can select.
  datalist?: 'layerBreeds';
}

interface GenericTableDef {
  key: string;
  label: string;
  table: string;
  cacheKey: string;
  orderBy: { column: string; ascending: boolean };
  fields: GenericField[];
}

const GENERIC_TABLES: GenericTableDef[] = [
  {
    key: 'broiler_std',
    label: 'Broiler Std.',
    table: 'broiler_standards',
    cacheKey: 'broiler_standards:all',
    orderBy: { column: 'day', ascending: true },
    fields: [
      { key: 'day', label: 'Day', type: 'number', required: true, step: '1' },
      { key: 'body_weight', label: 'Body Weight (g)', type: 'number' },
      { key: 'feed_intake', label: 'Feed Intake (g)', type: 'number' },
      { key: 'fcr', label: 'FCR', type: 'number', step: '0.001' },
    ],
  },
  {
    key: 'layer_std',
    label: 'Layer Std.',
    table: 'layer_standards',
    cacheKey: 'layer_standards:all',
    orderBy: { column: 'age_weeks', ascending: true },
    fields: [
      { key: 'age_weeks', label: 'Age (weeks)', type: 'number', required: true, step: '1' },
      { key: 'breed', label: 'Breed', type: 'text', required: true, datalist: 'layerBreeds' },
      { key: 'daily_feed_intake', label: 'Daily Feed (g)', type: 'number' },
      { key: 'cumulative_feed', label: 'Cumulative Feed (g)', type: 'number' },
      { key: 'body_weight_min', label: 'Body Weight Min (g)', type: 'number' },
      { key: 'body_weight_max', label: 'Body Weight Max (g)', type: 'number' },
      { key: 'egg_production_pct', label: 'Egg Production (%)', type: 'number' },
      { key: 'egg_weight', label: 'Egg Weight (g)', type: 'number' },
    ],
  },
  {
    key: 'broiler_vacc',
    label: 'Broiler Vacc.',
    table: 'broiler_vaccinations',
    cacheKey: 'broiler_vaccinations:all',
    orderBy: { column: 'id', ascending: true },
    fields: [
      { key: 'age', label: 'Age', type: 'text', required: true },
      { key: 'vaccine_name', label: 'Vaccine Name', type: 'text', required: true },
      { key: 'strain', label: 'Strain', type: 'text' },
      { key: 'route', label: 'Route', type: 'text' },
    ],
  },
  {
    key: 'layer_vacc',
    label: 'Layer Vacc.',
    table: 'layer_vaccinations',
    cacheKey: 'layer_vaccinations:all',
    orderBy: { column: 'id', ascending: true },
    fields: [
      { key: 'age', label: 'Age', type: 'text', required: true },
      { key: 'disease_name', label: 'Disease Name', type: 'text', required: true },
      { key: 'vaccine_name', label: 'Vaccine Name', type: 'text' },
      { key: 'vaccine_type', label: 'Vaccine Type', type: 'select', options: ['', 'Live', 'Killed'] },
      { key: 'route', label: 'Route', type: 'text' },
    ],
  },
  {
    key: 'broiler_feeds',
    label: 'Broiler Feeds',
    table: 'broiler_feeds',
    cacheKey: 'broiler_feeds:all',
    orderBy: { column: 'id', ascending: true },
    fields: [
      { key: 'feed_name', label: 'Feed Name', type: 'text', required: true },
      { key: 'moisture_max_pct', label: 'Moisture Max (%)', type: 'number' },
      { key: 'protein_min_pct', label: 'Protein Min (%)', type: 'number' },
      { key: 'fiber_max_pct', label: 'Fiber Max (%)', type: 'number' },
      { key: 'calcium_min_pct', label: 'Calcium Min (%)', type: 'number' },
      { key: 'phosphorus_min_pct', label: 'Phosphorus Min (%)', type: 'number' },
      { key: 'methionine_min_pct', label: 'Methionine Min (%)', type: 'number' },
      { key: 'lysine_min_pct', label: 'Lysine Min (%)', type: 'number' },
      { key: 'metabolisable_energy_kcal_kg', label: 'Energy (kcal/kg)', type: 'number' },
      { key: 'feed_form', label: 'Feed Form', type: 'text' },
      { key: 'bird_age_or_stage', label: 'Bird Age / Stage', type: 'text' },
      { key: 'price', label: 'Price (TK)', type: 'number' },
    ],
  },
  {
    key: 'layer_feeds',
    label: 'Layer Feeds',
    table: 'layer_feeds',
    cacheKey: 'layer_feeds:all',
    orderBy: { column: 'id', ascending: true },
    fields: [
      { key: 'feed_name', label: 'Feed Name', type: 'text', required: true },
      { key: 'moisture_max_pct', label: 'Moisture Max (%)', type: 'number' },
      { key: 'protein_min_pct', label: 'Protein Min (%)', type: 'number' },
      { key: 'fiber_max_pct', label: 'Fiber Max (%)', type: 'number' },
      { key: 'calcium_min_pct', label: 'Calcium Min (%)', type: 'number' },
      { key: 'avail_phosphorus_min_pct', label: 'Avail. Phosphorus Min (%)', type: 'number' },
      { key: 'methionine_min_pct', label: 'Methionine Min (%)', type: 'number' },
      { key: 'lysine_min_pct', label: 'Lysine Min (%)', type: 'number' },
      { key: 'metabolisable_energy_kcal_kg', label: 'Energy (kcal/kg)', type: 'number' },
      { key: 'feed_form', label: 'Feed Form', type: 'text' },
      { key: 'bird_age_or_stage', label: 'Bird Age / Stage', type: 'text' },
      { key: 'price', label: 'Price (TK)', type: 'number' },
    ],
  },
];

const GENERIC_TAB_KEYS = new Set(GENERIC_TABLES.map((t) => t.key));

export default function AdminPage({ onBack }: AdminPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Active Tab State — the four original tabs plus the six generic ones
  const [activeTab, setActiveTab] = useState<string>('nourish');

  // Form Visibility State
  const [showForm, setShowForm] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data States
  const [nourishFeeds, setNourishFeeds] = useState<any[]>([]);
  const [otherIngredients, setOtherIngredients] = useState<any[]>([]);
  const [dmReferences, setDmReferences] = useState<any[]>([]);
  const [breeds, setBreeds] = useState<any[]>([]);

  // Editing ID Tracker
  const [editId, setEditId] = useState<string | number | null>(null);

  // Form Fields - Common & Specific
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [dm, setDm] = useState('');
  const [cp, setCp] = useState('');
  const [me, setMe] = useState('');
  const [category, setCategory] = useState<'dairy' | 'fattening'>('dairy');
  const [feedType, setFeedType] = useState<'concentrate' | 'fodder'>('concentrate');

  // Form Fields - DM Reference
  const [stageName, setStageName] = useState('');
  const [targetGroup, setTargetGroup] = useState<'dairy' | 'heifer' | 'fattening'>('dairy');
  const [concentrateRatio, setConcentrateRatio] = useState('');
  const [fodderRatio, setFodderRatio] = useState('');

  // Form Fields - Breeds
  const [breedName, setBreedName] = useState('');
  const [breedCategory, setBreedCategory] = useState<'dairy' | 'fattening'>('dairy');

  // Generic table editor state (standards, vaccinations, commercial feeds)
  const [genericRows, setGenericRows] = useState<Record<string, any[]>>({});
  const [genericForm, setGenericForm] = useState<Record<string, string>>({});
  const [genericEditId, setGenericEditId] = useState<string | number | null>(null);
  const [genericShowForm, setGenericShowForm] = useState(false);

  // Change Password state — the username is remembered at login so the
  // password can be changed from inside the panel, no SQL needed.
  const [adminUsername, setAdminUsername] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin_logged_in');
    if (adminStatus === 'true') {
      setIsLoggedIn(true);
      setAdminUsername(localStorage.getItem('admin_username') || '');
      fetchAllData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthenticating(true);

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password.trim());

      if (error) {
        setLoginError('Database Connection Error!');
      } else if (!data || data.length === 0) {
        setLoginError('Invalid Username or Password!');
      } else {
        localStorage.setItem('is_admin_logged_in', 'true');
        localStorage.setItem('admin_username', username.trim());
        setAdminUsername(username.trim());
        setIsLoggedIn(true);
        fetchAllData();
      }
    } catch (err) {
      setLoginError('Login failed. Try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('is_admin_logged_in');
    localStorage.removeItem('admin_username');
    setAdminUsername('');
    setIsLoggedIn(false);
  };

  const fetchAllData = async () => {
    setLoading(true);
    // loadCachedFirst calls onDone as soon as cached rows render, so the
    // spinner stops instantly on cache hits; the awaited promises only
    // finish after the background network refresh.
    let doneCount = 0;
    const totalTables = 4 + GENERIC_TABLES.length;
    const markDone = () => {
      doneCount += 1;
      if (doneCount === totalTables) setLoading(false);
    };
    await Promise.all([
      fetchNourishFeeds(markDone),
      fetchOtherIngredients(markDone),
      fetchDmReferences(markDone),
      fetchBreeds(markDone),
      ...GENERIC_TABLES.map((def) => fetchGenericTable(def, markDone)),
    ]);
    setLoading(false);
  };

  const fetchNourishFeeds = async (onDone?: () => void) => {
    await loadCachedFirst<any[]>(
      'nourish_feeds:all',
      async () => {
        const { data, error } = await supabase.from('nourish_feeds').select('*').order('created_at', { ascending: true });
        if (error) {
          console.error('Error fetching nourish feeds:', error);
          return [];
        }
        return data || [];
      },
      (rows) => setNourishFeeds(rows),
      onDone,
    );
  };

  const fetchOtherIngredients = async (onDone?: () => void) => {
    await loadCachedFirst<any[]>(
      'other_ingredients:all',
      async () => {
        const { data, error } = await supabase.from('other_ingredients').select('*').order('created_at', { ascending: true });
        if (error) {
          console.error('Error fetching other ingredients:', error);
          return [];
        }
        return data || [];
      },
      (rows) => setOtherIngredients(rows),
      onDone,
    );
  };

  const fetchDmReferences = async (onDone?: () => void) => {
    await loadCachedFirst<any[]>(
      'dm_references:all',
      async () => {
        const { data, error } = await supabase.from('dm_references').select('*').order('target_group', { ascending: true });
        if (error) {
          console.error('Error fetching DM references:', error);
          return [];
        }
        return data || [];
      },
      (rows) => setDmReferences(rows),
      onDone,
    );
  };

  const fetchBreeds = async (onDone?: () => void) => {
    await loadCachedFirst<any[]>(
      'breeds:all',
      async () => {
        const { data, error } = await supabase.from('breeds').select('*').order('name', { ascending: true });
        if (error) {
          console.error('Error fetching breeds:', error);
          return [];
        }
        return data || [];
      },
      (rows) => setBreeds(rows),
      onDone,
    );
  };

  // Generic table fetch / submit, shared by the six new tabs.
  const fetchGenericTable = async (def: GenericTableDef, onDone?: () => void) => {
    await loadCachedFirst<any[]>(
      def.cacheKey,
      async () => {
        const { data, error } = await supabase
          .from(def.table)
          .select('*')
          .order(def.orderBy.column, { ascending: def.orderBy.ascending });
        if (error) {
          console.error(`Error fetching ${def.table}:`, error);
          return [];
        }
        return data || [];
      },
      (rows) => setGenericRows((prev) => ({ ...prev, [def.key]: rows })),
      onDone,
    );
  };

  const resetGenericForm = () => {
    setGenericEditId(null);
    setGenericShowForm(false);
    setGenericForm({});
  };

  const handleGenericSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    const def = GENERIC_TABLES.find((t) => t.key === activeTab);
    if (!def) return;
    setSubmitting(true);
    const payload: Record<string, unknown> = {};
    for (const f of def.fields) {
      const raw = (genericForm[f.key] ?? '').trim();
      if (f.type === 'number') {
        const n = parseFloat(raw);
        payload[f.key] = Number.isNaN(n) ? null : n;
      } else {
        payload[f.key] = raw === '' ? null : raw;
      }
    }
    if (genericEditId) {
      const { error } = await supabase.from(def.table).update(payload).eq('id', genericEditId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from(def.table).insert([payload]);
      if (error) alert(error.message);
    }
    resetGenericForm();
    fetchGenericTable(def);
    setSubmitting(false);
  };

  const startGenericEdit = (def: GenericTableDef, row: any) => {
    const values: Record<string, string> = {};
    for (const f of def.fields) {
      const v = row[f.key];
      values[f.key] = v === null || v === undefined ? '' : String(v);
    }
    setGenericForm(values);
    setGenericEditId(row.id);
    setGenericShowForm(true);
  };

  // Change the logged-in admin's own password (no SQL needed).
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (!adminUsername) {
      setPasswordMsg('Please log out and log in again, then change the password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    if (!isOnline()) {
      setPasswordMsg('You are offline. Changing the password needs internet.');
      return;
    }
    setChangingPassword(true);
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', adminUsername)
      .eq('password', currentPassword.trim());
    if (error || !data || data.length === 0) {
      setPasswordMsg('Current password is incorrect.');
      setChangingPassword(false);
      return;
    }
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password: newPassword.trim() })
      .eq('username', adminUsername);
    setChangingPassword(false);
    if (updateError) {
      setPasswordMsg('Failed to change password: ' + updateError.message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg('Password changed successfully.');
  };

  const resetForm = () => {
    setEditId(null);
    setShowForm(false);
    setItemName('');
    setPrice('');
    setDm('');
    setCp('');
    setMe('');
    setCategory('dairy');
    setFeedType('concentrate');
    setStageName('');
    setTargetGroup('dairy');
    setConcentrateRatio('');
    setFodderRatio('');
    setBreedName('');
    setBreedCategory('dairy');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    resetForm();
    resetGenericForm();
  };

  const handleDelete = async (table: string, id: string | number) => {
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) fetchAllData();
    else alert('Failed to delete item: ' + error.message);
  };

  // Submit Handler for Nourish Feeds
  const handleNourishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: itemName,
      category: category,
      price: parseFloat(price) || 0,
      dm: parseFloat(dm) || 0,
      cp: parseFloat(cp) || 0,
      me: parseFloat(me) || 0
    };

    if (editId) {
      await supabase.from('nourish_feeds').update(payload).eq('id', editId);
    } else {
      await supabase.from('nourish_feeds').insert([payload]);
    }
    resetForm();
    fetchNourishFeeds();
    setSubmitting(false);
  };

  // Submit Handler for Other Ingredients
  const handleOtherIngredientsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: itemName,
      price: parseFloat(price) || 0,    
      dm: parseFloat(dm) || 0,           
      cp: parseFloat(cp) || 0,           
      me: parseFloat(me) || 0,          
      feed_type: feedType,
    };

    if (editId) {
      await supabase.from('other_ingredients').update(payload).eq('id', editId);
    } else {
      await supabase.from('other_ingredients').insert([payload]);
    }
    resetForm();
    fetchOtherIngredients();
    setSubmitting(false);
  };

  // Submit Handler for DM References
  const handleDmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    setSubmitting(true);
    const payload = {
      stage_key: stageName.toLowerCase().replace(/\s+/g, '_'),
      stage_name: stageName,
      target_group: targetGroup,
      concentrate_ratio: parseFloat(concentrateRatio),
      fodder_ratio: parseFloat(fodderRatio)
    };

    if (editId) {
      await supabase.from('dm_references').update(payload).eq('id', editId);
    } else {
      await supabase.from('dm_references').insert([payload]);
    }
    resetForm();
    fetchDmReferences();
    setSubmitting(false);
  };

  // Submit Handler for Breeds
  const handleBreedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: breedName,
      category: breedCategory
    };

    if (editId) {
      const { error } = await supabase.from('breeds').update(payload).eq('id', editId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('breeds').insert([payload]);
      if (error) alert(error.message);
    }
    resetForm();
    fetchBreeds();
    setSubmitting(false);
  };

  // The generic table definition for the active tab, if it is a generic tab.
  const activeGenericDef = GENERIC_TABLES.find((t) => t.key === activeTab);
  // Whether the add/edit form is open for the active tab (either kind).
  const formOpen = activeGenericDef ? genericShowForm : showForm;
  // Breeds already in the Layer Standards table, for the breed datalist.
  const layerBreeds = Array.from(
    new Set((genericRows['layer_std'] || []).map((r) => r.breed).filter(Boolean)),
  ) as string[];

  if (!isLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 w-full max-w-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <Lock size={22} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Admin Login</h2>
            <p className="text-xs text-slate-500">Sign in to manage feed database</p>
          </div>

          {loginError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="Enter admin username"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="Enter admin password"
              />
            </div>
            <button
              type="submit"
              disabled={authenticating}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center space-x-1"
            >
              {authenticating ? <Loader2 className="animate-spin" size={16} /> : <span>Login to Dashboard</span>}
            </button>
          </form>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center space-x-1"
            >
              <ArrowLeft size={13} />
              <span>Back to Main Menu</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[85vh] p-3 sm:p-4 rounded-2xl border border-slate-200 space-y-4 text-xs">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-none">Admin Control Panel</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage Database Tables Centrally</p>
        </div>
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium transition"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={fetchAllData}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => {
              setShowPasswordForm((v) => !v);
              setPasswordMsg('');
            }}
            className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
            title="Change admin password"
          >
            <KeyRound size={14} />
            <span>Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-medium transition"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Change Password — the logged-in admin's own password, no SQL needed */}
      {showPasswordForm && (
        <form onSubmit={handleChangePassword} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
          <div className="font-bold text-emerald-800">Change Admin Password</div>
          {passwordMsg && (
            <div className={`p-2.5 rounded-lg text-center font-medium ${
              passwordMsg === 'Password changed successfully.'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {passwordMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500">Current Password</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border p-1.5 rounded-lg" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500">New Password (min 6 characters)</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-1.5 rounded-lg" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Confirm New Password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border p-1.5 rounded-lg" />
            </div>
          </div>
          <button type="submit" disabled={changingPassword} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
            {changingPassword ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{changingPassword ? 'Changing...' : 'Change Password'}</span>
          </button>
        </form>
      )}

      {/* Navigation Tabs — one scrollable row for all 10 tables */}
      <div className="flex gap-1.5 p-1 bg-slate-200/80 rounded-xl overflow-x-auto">
        {[
          { key: 'nourish', label: 'Nourish Feeds', icon: <Wheat size={13} /> },
          { key: 'other', label: 'Other Feed', icon: <FlaskConical size={13} /> },
          { key: 'dm', label: 'DM Ratio', icon: <BookOpen size={13} /> },
          { key: 'breeds', label: 'Breeds', icon: <Dna size={13} /> },
          ...GENERIC_TABLES.map((t) => ({ key: t.key, label: t.label, icon: <Table2 size={13} /> })),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1 transition shrink-0 whitespace-nowrap ${
              activeTab === tab.key ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 flex justify-center items-center text-emerald-800 space-x-2 bg-white rounded-xl">
          <Loader2 className="animate-spin" size={18} />
          <span className="font-medium">Loading database entries...</span>
        </div>
      ) : (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-700 text-xs">
              {activeTab === 'nourish' && 'Nourish Feeds Table'}
              {activeTab === 'other' && 'Other Ingredients Table'}
              {activeTab === 'dm' && 'DM Reference Entries'}
              {activeTab === 'breeds' && 'Cattle Breeds Table'}
              {activeGenericDef && `${activeGenericDef.label} Table`}
            </span>
            <button
              onClick={() => {
                if (activeGenericDef) {
                  if (genericShowForm) resetGenericForm();
                  else setGenericShowForm(true);
                } else if (showForm) resetForm();
                else setShowForm(true);
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold transition shadow-2xs ${
                formOpen 
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                  : 'bg-emerald-800 text-white hover:bg-emerald-900'
              }`}
            >
              {formOpen ? <X size={14} /> : <Plus size={14} />}
              <span>{formOpen ? 'Cancel' : 'Add New Item'}</span>
            </button>
          </div>

          {/* TAB 1: NOURISH FEEDS */}
          {activeTab === 'nourish' && (
            <div className="space-y-4">
              {showForm && (
                <form onSubmit={handleNourishSubmit} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 font-bold text-emerald-800">
                    <span>{editId ? 'Edit Nourish Feed' : 'Add New Nourish Feed'}</span>
                    <button type="button" onClick={resetForm}><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500">Name</label>
                      <input type="text" required placeholder="Feed Name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full border p-1.5 rounded-lg bg-white">
                        <option value="dairy">Dairy</option>
                        <option value="fattening">Fattening</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Price (TK)</label>
                      <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">DM (%)</label>
                      <input type="number" step="0.01" required value={dm} onChange={(e) => setDm(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">CP (%)</label>
                      <input type="number" step="0.01" required value={cp} onChange={(e) => setCp(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-slate-500">ME Energy</label>
                      <input type="number" step="0.01" required value={me} onChange={(e) => setMe(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : editId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{editId ? 'Update Nourish Feed' : 'Save Nourish Feed'}</span>
                  </button>
                </form>
              )}

              <div className="bg-white rounded-xl border overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-center">Price</th>
                      <th className="p-2.5 text-center">DM %</th>
                      <th className="p-2.5 text-center">CP %</th>
                      <th className="p-2.5 text-center">ME</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {nourishFeeds.map((feed) => (
                      <tr key={feed.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold">{feed.name}</td>
                        <td className="p-2.5 text-[10px] text-slate-500 capitalize">{feed.category}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">৳{feed.price ?? 0}</td>
                        <td className="p-2.5 text-center">{feed.dm ?? 0}%</td>
                        <td className="p-2.5 text-center">{feed.cp ?? 0}%</td>
                        <td className="p-2.5 text-center">{feed.me ?? 0}</td>
                        <td className="p-2.5 text-center space-x-1">
                          <button onClick={() => { 
                            setEditId(feed.id); 
                            setItemName(feed.name || ''); 
                            setCategory(feed.category || 'dairy');
                            setPrice(feed.price ?? ''); 
                            setDm(feed.dm ?? ''); 
                            setCp(feed.cp ?? ''); 
                            setMe(feed.me ?? ''); 
                            setShowForm(true); 
                          }} className="p-1 text-slate-500 hover:text-emerald-700"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete('nourish_feeds', feed.id)} className="p-1 text-slate-500 hover:text-rose-700"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: OTHER INGREDIENTS */}
          {activeTab === 'other' && (
            <div className="space-y-4">
              {showForm && (
                <form onSubmit={handleOtherIngredientsSubmit} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 font-bold text-emerald-800">
                    <span>{editId ? 'Edit Other Ingredient' : 'Add New Other Ingredient'}</span>
                    <button type="button" onClick={resetForm}><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500">Name</label>
                      <input type="text" required placeholder="Ingredient Name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Feed Type</label>
                      <select value={feedType} onChange={(e) => setFeedType(e.target.value as any)} className="w-full border p-1.5 rounded-lg bg-white">
                        <option value="concentrate">Concentrate</option>
                        <option value="fodder">Fodder</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Price (TK)</label>
                      <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">DM (%)</label>
                      <input type="number" step="0.01" required value={dm} onChange={(e) => setDm(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">CP (%)</label>
                      <input type="number" step="0.01" required value={cp} onChange={(e) => setCp(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-slate-500">ME Energy</label>
                      <input type="number" step="0.01" required value={me} onChange={(e) => setMe(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : editId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{editId ? 'Update Ingredient' : 'Save Ingredient'}</span>
                  </button>
                </form>
              )}

              <div className="bg-white rounded-xl border overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5 text-center">Feed Type</th>
                      <th className="p-2.5 text-center">Price</th>
                      <th className="p-2.5 text-center">DM %</th>
                      <th className="p-2.5 text-center">CP %</th>
                      <th className="p-2.5 text-center">ME</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {otherIngredients.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold">{item.name}</td>
                        <td className="p-2.5 text-center capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.feed_type === 'fodder' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {item.feed_type || 'concentrate'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">৳{item.price_per_kg ?? item.price ?? 0}</td>
                        <td className="p-2.5 text-center">{item.dm_percent ?? item.dm ?? 0}%</td>
                        <td className="p-2.5 text-center">{item.cp_percent ?? item.cp ?? 0}%</td>
                        <td className="p-2.5 text-center">{item.me_energy ?? item.me ?? 0}</td>
                        <td className="p-2.5 text-center space-x-1">
                          <button onClick={() => { 
                            setEditId(item.id); 
                            setItemName(item.name || ''); 
                            setPrice(item.price_per_kg ?? item.price ?? ''); 
                            setDm(item.dm_percent ?? item.dm ?? ''); 
                            setCp(item.cp_percent ?? item.cp ?? ''); 
                            setMe(item.me_energy ?? item.me ?? ''); 
                            setFeedType(item.feed_type || 'concentrate');
                            setShowForm(true); 
                          }} className="p-1 text-slate-500 hover:text-emerald-700"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete('other_ingredients', item.id)} className="p-1 text-slate-500 hover:text-rose-700"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DM RATIO */}
          {activeTab === 'dm' && (
            <div className="space-y-4">
              {showForm && (
                <form onSubmit={handleDmSubmit} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 font-bold text-emerald-800">
                    <span>{editId ? 'Edit DM Reference' : 'Add New DM Reference'}</span>
                    <button type="button" onClick={resetForm}><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Stage Name</label>
                      <input type="text" required placeholder="e.g. Early Lactation" value={stageName} onChange={(e) => setStageName(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Target Group</label>
                      <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value as any)} className="w-full border p-1.5 rounded-lg bg-white">
                        <option value="dairy">Dairy</option>
                        <option value="heifer">Heifer</option>
                        <option value="fattening">Fattening</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Concentrate Ratio</label>
                      <input type="number" step="0.1" required value={concentrateRatio} onChange={(e) => setConcentrateRatio(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Fodder Ratio</label>
                      <input type="number" step="0.1" required value={fodderRatio} onChange={(e) => setFodderRatio(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : editId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{editId ? 'Update DM Reference' : 'Save DM Reference'}</span>
                  </button>
                </form>
              )}

              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5">Group</th>
                      <th className="p-2.5 text-center">Ratio (C:F)</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {dmReferences.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold">{ref.stage_name}</td>
                        <td className="p-2.5 text-[10px] text-slate-500 capitalize">{ref.target_group}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-800">{ref.concentrate_ratio} : {ref.fodder_ratio}</td>
                        <td className="p-2.5 text-center space-x-1">
                          <button onClick={() => { setEditId(ref.id); setStageName(ref.stage_name); setTargetGroup(ref.target_group); setConcentrateRatio(ref.concentrate_ratio); setFodderRatio(ref.fodder_ratio); setShowForm(true); }} className="p-1 text-slate-500 hover:text-emerald-700"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete('dm_references', ref.id)} className="p-1 text-slate-500 hover:text-rose-700"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BREEDS */}
          {activeTab === 'breeds' && (
            <div className="space-y-4">
              {showForm && (
                <form onSubmit={handleBreedSubmit} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 font-bold text-emerald-800">
                    <span>{editId ? 'Edit Cattle Breed' : 'Add New Cattle Breed'}</span>
                    <button type="button" onClick={resetForm}><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Breed Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Holstein Friesian" 
                        value={breedName} 
                        onChange={(e) => setBreedName(e.target.value)} 
                        className="w-full border p-1.5 rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Category</label>
                      <select 
                        value={breedCategory} 
                        onChange={(e) => setBreedCategory(e.target.value as any)} 
                        className="w-full border p-1.5 rounded-lg bg-white"
                      >
                        <option value="dairy">Dairy</option>
                        <option value="fattening">Fattening</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : editId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{editId ? 'Update Breed' : 'Save Breed'}</span>
                  </button>
                </form>
              )}

              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Breed Name</th>
                      <th className="p-2.5 text-center">Category</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {breeds.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400 font-medium">
                          No breeds found.
                        </td>
                      </tr>
                    ) : (
                      breeds.map((breed) => (
                        <tr key={breed.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold">{breed.name}</td>
                          <td className="p-2.5 text-center capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${breed.category === 'dairy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {breed.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-center space-x-1">
                            <button onClick={() => { 
                              setEditId(breed.id); 
                              setBreedName(breed.name || ''); 
                              setBreedCategory(breed.category || 'dairy');
                              setShowForm(true); 
                            }} className="p-1 text-slate-500 hover:text-emerald-700"><Edit3 size={14} /></button>
                            <button onClick={() => handleDelete('breeds', breed.id)} className="p-1 text-slate-500 hover:text-rose-700"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GENERIC TABS: standards, vaccinations, commercial feeds */}
          {activeGenericDef && (
            <div className="space-y-4">
              {genericShowForm && (
                <form onSubmit={handleGenericSubmit} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 font-bold text-emerald-800">
                    <span>{genericEditId ? `Edit ${activeGenericDef.label}` : `Add New ${activeGenericDef.label}`}</span>
                    <button type="button" onClick={resetGenericForm}><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeGenericDef.fields.map((f) => (
                      <div key={f.key}>
                        <label className="text-[10px] text-slate-500">{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={genericForm[f.key] ?? ''}
                            onChange={(e) => setGenericForm((p) => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full border p-1.5 rounded-lg bg-white"
                          >
                            {f.options?.map((o) => (
                              <option key={o} value={o}>{o === '' ? '-' : o}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <input
                              type={f.type === 'number' ? 'number' : 'text'}
                              step={f.type === 'number' ? (f.step || 'any') : undefined}
                              required={f.required}
                              list={f.datalist === 'layerBreeds' ? 'dl-layer-breeds' : undefined}
                              placeholder={f.label}
                              value={genericForm[f.key] ?? ''}
                              onChange={(e) => setGenericForm((p) => ({ ...p, [f.key]: e.target.value }))}
                              className="w-full border p-1.5 rounded-lg"
                            />
                            {f.datalist === 'layerBreeds' && (
                              <datalist id="dl-layer-breeds">
                                {layerBreeds.map((b) => (
                                  <option key={b} value={b} />
                                ))}
                              </datalist>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : genericEditId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{genericEditId ? `Update ${activeGenericDef.label}` : `Save ${activeGenericDef.label}`}</span>
                  </button>
                </form>
              )}

              <div className="bg-white rounded-xl border overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      {activeGenericDef.fields.map((f) => (
                        <th key={f.key} className="p-2.5 whitespace-nowrap">{f.label}</th>
                      ))}
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {(genericRows[activeGenericDef.key] || []).length === 0 ? (
                      <tr>
                        <td colSpan={activeGenericDef.fields.length + 1} className="p-4 text-center text-slate-400 font-medium">
                          No entries found.
                        </td>
                      </tr>
                    ) : (
                      (genericRows[activeGenericDef.key] || []).map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          {activeGenericDef.fields.map((f, i) => (
                            <td key={f.key} className={`p-2.5 whitespace-nowrap ${i === 0 ? 'font-bold' : 'text-center'}`}>
                              {row[f.key] === null || row[f.key] === undefined || row[f.key] === '' ? '-' : String(row[f.key])}
                            </td>
                          ))}
                          <td className="p-2.5 text-center space-x-1 whitespace-nowrap">
                            <button onClick={() => startGenericEdit(activeGenericDef, row)} className="p-1 text-slate-500 hover:text-emerald-700"><Edit3 size={14} /></button>
                            <button onClick={() => handleDelete(activeGenericDef.table, row.id)} className="p-1 text-slate-500 hover:text-rose-700"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
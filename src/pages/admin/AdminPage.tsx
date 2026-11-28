import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { loadCachedFirst, isOnline } from '../../lib/offline';
import { resizeImageFile, hasFeedImage } from '../../lib/feedImage';
import { fetchNotices, sendNotice, deleteNotice, type Notice } from '../../lib/notices';
import { 
  Lock, LogOut, Plus, Edit3, Trash2, Save, X, Loader2, 
  Wheat, FlaskConical, BookOpen, RefreshCw, ArrowLeft, Dna, Table2, KeyRound, ImagePlus, Bell
} from 'lucide-react';

interface AdminPageProps {
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Generic table editor: the standards, vaccination and commercial-feed
// tables all have the same shape (a list + an add/edit form + delete),
// so they share one editor driven by this config instead of six copies
// of the same form/table code. The four original tabs (Cattle Feed,
// Other Ingredients, DM Ratio, Breeds) keep their hand-written forms.
// Column names come from the pages that read these tables, so the form
// fields match exactly what the calculators and standard pages display.
// Sonali has no own standard/feed table (both are "Coming soon..." stubs)
// and Sonali Vaccination reads broiler_vaccinations, so editing the
// broiler tables covers Sonali too.
// ---------------------------------------------------------------------------
type GenericFieldType = 'text' | 'number' | 'select' | 'image';

interface GenericField {
  key: string;
  label: string;
  type: GenericFieldType;
  required?: boolean;
  step?: string;
  // Plain strings render as-is; { value, label } pairs store the value
  // but show the label (e.g. coating 'oil' shows as "Oil Coated").
  options?: Array<string | { value: string; label: string }>;
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
    orderBy: { column: 'sort_order', ascending: true },
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
      { key: 'bag_size_kg', label: 'Bag Size (kg)', type: 'number' },
      { key: 'bag_image_url', label: 'Bag Photo', type: 'image' },
      { key: 'sample_image_url', label: 'Sample Photo', type: 'image' },
    ],
  },
  {
    key: 'layer_feeds',
    label: 'Layer Feeds',
    table: 'layer_feeds',
    cacheKey: 'layer_feeds:all',
    orderBy: { column: 'sort_order', ascending: true },
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
      { key: 'bag_size_kg', label: 'Bag Size (kg)', type: 'number' },
      { key: 'bag_image_url', label: 'Bag Photo', type: 'image' },
      { key: 'sample_image_url', label: 'Sample Photo', type: 'image' },
    ],
  },
  {
    key: 'floating_fish_feeds',
    label: 'Floating Fish Feeds',
    table: 'floating_fish_feeds',
    cacheKey: 'floating_fish_feeds:all',
    orderBy: { column: 'sort_order', ascending: true },
    fields: [
      { key: 'feed_name', label: 'Feed Name', type: 'text', required: true },
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: [
        { value: 'Common', label: 'Common' },
        { value: 'Pangas', label: 'Pangas' },
        { value: 'Tilapia', label: 'Tilapia' },
        { value: 'Koi', label: 'Koi' },
        { value: 'Carp', label: 'Carp' },
        { value: 'Catfish', label: 'Catfish' },
      ] },
      { key: 'coating', label: 'Coating', type: 'select', options: [
        { value: 'oil', label: 'Oil Coated' },
        { value: 'non', label: 'Non Coated' },
        { value: 'semi', label: 'Semi Coated' },
        { value: 'catfish', label: 'Catfish' },
      ] },
      { key: 'moisture_max_pct', label: 'Moisture Max (%)', type: 'number' },
      { key: 'protein_min_pct', label: 'Protein Min (%)', type: 'number' },
      { key: 'fat_min_pct', label: 'Fat Min (%)', type: 'number' },
      { key: 'fiber_max_pct', label: 'Fiber Max (%)', type: 'number' },
      { key: 'feed_size', label: 'Feed Size', type: 'text' },
      { key: 'bag_size_kg', label: 'Bag Size (kg)', type: 'number' },
      { key: 'price', label: 'Price (TK)', type: 'number' },
      { key: 'bag_image_url', label: 'Bag Photo', type: 'image' },
      { key: 'sample_image_url', label: 'Sample Photo', type: 'image' },
    ],
  },
  {
    key: 'sinking_fish_feeds',
    label: 'Sinking Fish Feeds',
    table: 'sinking_fish_feeds',
    cacheKey: 'sinking_fish_feeds:all',
    orderBy: { column: 'sort_order', ascending: true },
    fields: [
      { key: 'feed_name', label: 'Feed Name', type: 'text', required: true },
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: [
        { value: 'Common', label: 'Common' },
        { value: 'Pangas', label: 'Pangas' },
        { value: 'Tilapia', label: 'Tilapia' },
        { value: 'Catfish', label: 'Catfish' },
        { value: 'Carp', label: 'Carp' },
        { value: 'Golda', label: 'Golda' },
        { value: 'Bagda', label: 'Bagda' },
      ] },
      { key: 'moisture_max_pct', label: 'Moisture Max (%)', type: 'number' },
      { key: 'protein_min_pct', label: 'Protein Min (%)', type: 'number' },
      { key: 'fat_min_pct', label: 'Fat Min (%)', type: 'number' },
      { key: 'fiber_max_pct', label: 'Fiber Max (%)', type: 'number' },
      { key: 'feed_size', label: 'Feed Size', type: 'text' },
      { key: 'bag_size_kg', label: 'Bag Size (kg)', type: 'number' },
      { key: 'price', label: 'Price (TK)', type: 'number' },
      { key: 'bag_image_url', label: 'Bag Photo', type: 'image' },
      { key: 'sample_image_url', label: 'Sample Photo', type: 'image' },
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
  const [activeTab, setActiveTab] = useState<string>('cattle');

  // Form Visibility State
  const [showForm, setShowForm] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data States
  const [cattleFeeds, setCattleFeeds] = useState<any[]>([]);
  const [otherIngredients, setOtherIngredients] = useState<any[]>([]);
  const [dmReferences, setDmReferences] = useState<any[]>([]);
  const [breeds, setBreeds] = useState<any[]>([]);

  // Training Materials (PDF / PPTX library) — custom tab, not generic.
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matCategory, setMatCategory] = useState<'Poultry' | 'Cattle' | 'Fish'>('Poultry');
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matUploading, setMatUploading] = useState(false);
  const [matMsg, setMatMsg] = useState('');
  const [matError, setMatError] = useState('');
  // Editing a material — null when the edit modal is closed.
  const [editMat, setEditMat] = useState<any | null>(null);
  const [editMatTitle, setEditMatTitle] = useState('');
  const [editMatCategory, setEditMatCategory] = useState<'Poultry' | 'Cattle' | 'Fish'>('Poultry');
  const [editMatFile, setEditMatFile] = useState<File | null>(null);
  const [editMatSaving, setEditMatSaving] = useState(false);
  const [editMatError, setEditMatError] = useState('');

  // Notices (Admin Notice tab) — custom tab, not generic.
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeSending, setNoticeSending] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState('');

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
  // Cattle feed photos — two per item (bag + sample). Each is a small
  // resized JPEG data URL (see feedImage.ts), stored in the row's
  // bag_image_url / sample_image_url columns.
  const [cattleBagImage, setCattleBagImage] = useState('');
  const [cattleSampleImage, setCattleSampleImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  // Cattle feed nutrients (from the product table) — text, so ranges
  // like "65-70" fit. Stored without "%"; the page adds it on display.
  const [nutMoisture, setNutMoisture] = useState('');
  const [nutFiber, setNutFiber] = useState('');
  const [nutFat, setNutFat] = useState('');
  const [nutCalcium, setNutCalcium] = useState('');
  const [nutPhosphorus, setNutPhosphorus] = useState('');
  const [nutTdn, setNutTdn] = useState('');
  const [cattleBagSize, setCattleBagSize] = useState('');

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

  // Search text for the table on the active tab (cleared on tab change).
  const [searchTerm, setSearchTerm] = useState('');

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
      // Fetch by username only (case-insensitive), then compare the
      // password here. The old version compared both columns in the
      // query, so a stored username/password that differed only by case
      // or a stray space silently returned "no row" — and the real cause
      // (row missing vs password wrong) was hidden.
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .ilike('username', username.trim());

      if (error) {
        setLoginError(
          'Database Connection Error! Check that the admin_users table exists in the same Supabase project the app uses (the one in .env), and that admin-setup.sql was run there.',
        );
      } else if (!data || data.length === 0) {
        setLoginError(
          'Username not found. Run admin-setup.sql in Supabase (same project as the app) and try again.',
        );
      } else if ((data[0].password ?? '').trim() !== password.trim()) {
        setLoginError('Wrong password for this username.');
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
      fetchCattleFeeds(markDone),
      fetchOtherIngredients(markDone),
      fetchDmReferences(markDone),
      fetchBreeds(markDone),
      ...GENERIC_TABLES.map((def) => fetchGenericTable(def, markDone)),
    ]);
    setLoading(false);
  };

  const fetchCattleFeeds = async (onDone?: () => void) => {
    await loadCachedFirst<any[]>(
      'cattle_feeds:all',
      async () => {
        const { data, error } = await supabase.from('cattle_feeds').select('*').order('sort_order', { ascending: true });
        if (error) {
          console.error('Error fetching nourish feeds:', error);
          return [];
        }
        return data || [];
      },
      (rows) => setCattleFeeds(rows),
      onDone,
    );
  };

  const fetchOtherIngredients = async (onDone?: () => void) => {
    await loadCachedFirst<any[]>(
      'other_ingredients:all',
      async () => {
        const { data, error } = await supabase.from('other_ingredients').select('*').order('name', { ascending: true });
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
        const { data, error } = await supabase.from('dm_references').select('*').order('stage_name', { ascending: true });
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

  // Training Materials list (latest first). Fetched when the Materials
  // tab opens — the list is small and changes only when Admin uploads
  // or deletes, so it is not part of the initial fetchAllData.
  const fetchMaterials = async () => {
    setMaterialsLoading(true);
    const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } else {
      setMaterials(data || []);
    }
    setMaterialsLoading(false);
  };

  // --- Notices (Admin Notice tab) ---
  const fetchAdminNotices = async () => {
    setNoticesLoading(true);
    try {
      setNotices(await fetchNotices());
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      setNotices([]);
    } finally {
      setNoticesLoading(false);
    }
  };

  // Send a notice: the row lands in `notices`, every open app hears it
  // at once over Realtime (bell + local phone notification). The push
  // to closed apps goes through the send-notice-push Edge Function —
  // best-effort here, so a missing / failing function never blocks the
  // notice itself (it still shows in-app for everyone).
  const handleSendNotice = async () => {
    if (!isOnline()) {
      setNoticeMsg('You are offline. Sending a notice needs internet.');
      return;
    }
    const title = noticeTitle.trim();
    const message = noticeMessage.trim();
    if (!title || !message) {
      setNoticeMsg('Write a title and a message first.');
      return;
    }
    setNoticeSending(true);
    setNoticeMsg('');
    try {
      const inserted = await sendNotice(title, message, adminUsername || 'Admin');
      setNoticeTitle('');
      setNoticeMessage('');
      setNoticeMsg('Notice sent to all users.');
      setNotices((prev) => [inserted, ...prev]);
      try {
        await supabase.functions.invoke('send-notice-push', {
          body: { noticeId: inserted.id, title, message },
        });
      } catch (pushErr) {
        console.error('Notice push (closed apps) failed — in-app notice still sent:', pushErr);
      }
    } catch (err: any) {
      console.error('Failed to send notice:', err);
      setNoticeMsg('Failed to send notice: ' + (err?.message || 'unknown error'));
    } finally {
      setNoticeSending(false);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    if (!window.confirm('Delete this notice for all users?')) return;
    try {
      await deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert('Failed to delete notice: ' + (err?.message || 'unknown error'));
    }
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'materials') fetchMaterials();
    if (isLoggedIn && activeTab === 'notice') fetchAdminNotices();
  }, [activeTab]);

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

  // Pick a photo for a feed row: any size is accepted, it is resized to
  // a small JPEG (max 600px) before it is stored, so the saved value
  // stays ~40–90 KB and the page loads fast.
  const handleImageFile = async (
    file: File | undefined,
    setValue: (v: string) => void,
  ) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const small = await resizeImageFile(file);
      setValue(small);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not use that image.');
    } finally {
      setUploadingImage(false);
    }
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
      } else if (f.type === 'image') {
        // A resized JPEG data URL (or empty). Stored as-is, never parsed.
        payload[f.key] = raw === '' ? null : raw;
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

  const startGenericEdit = async (def: GenericTableDef, row: any) => {
    // Fetch the fresh row first, so photos already saved always show in
    // the form — the table may be rendering cached rows from before the
    // photos were uploaded. Falls back to the table row when offline or
    // the fetch fails.
    let fresh = row;
    if (isOnline()) {
      const { data } = await supabase.from(def.table).select('*').eq('id', row.id).single();
      if (data) fresh = data;
    }
    const values: Record<string, string> = {};
    for (const f of def.fields) {
      const v = fresh[f.key];
      values[f.key] = v === null || v === undefined ? '' : String(v);
    }
    setGenericForm(values);
    setGenericEditId(fresh.id);
    setGenericShowForm(true);
  };

  // Same fresh-fetch for the Cattle Feed (nourish) form.
  const startCattleFeedEdit = async (feed: any) => {
    let fresh = feed;
    if (isOnline()) {
      const { data } = await supabase.from('cattle_feeds').select('*').eq('id', feed.id).single();
      if (data) fresh = data;
    }
    setEditId(fresh.id);
    setItemName(fresh.name || '');
    setCategory(fresh.category || 'dairy');
    setPrice(fresh.price ?? '');
    setDm(fresh.dm ?? '');
    setCp(fresh.cp ?? '');
    setMe(fresh.me ?? '');
    setCattleBagImage(fresh.bag_image_url || '');
    setCattleSampleImage(fresh.sample_image_url || '');
    setNutMoisture(fresh.moisture_max_pct || '');
    setNutFiber(fresh.crude_fiber_pct || '');
    setNutFat(fresh.crude_fat_pct || '');
    setNutCalcium(fresh.calcium_pct || '');
    setNutPhosphorus(fresh.phosphorus_pct || '');
    setNutTdn(fresh.tdn_pct || '');
    setCattleBagSize(fresh.bag_size_kg ?? '');
    setShowForm(true);
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
    setCattleBagImage('');
    setCattleSampleImage('');
    setNutMoisture('');
    setNutFiber('');
    setNutFat('');
    setNutCalcium('');
    setNutPhosphorus('');
    setNutTdn('');
    setCattleBagSize('');
    setStageName('');
    setTargetGroup('dairy');
    setConcentrateRatio('');
    setFodderRatio('');
    setBreedName('');
    setBreedCategory('dairy');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm('');
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

  // --- Training Materials upload / delete (custom tab) ---
  const sanitiseFileName = (name: string) =>
    name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '');

  const formatMatFileSize = (bytes: number | null | undefined): string => {
    if (bytes == null || Number.isNaN(bytes) || bytes < 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const matCategoryBadge = (category: string): string => {
    const c = (category || '').toLowerCase();
    if (c === 'poultry') return 'bg-amber-100 text-amber-800';
    if (c === 'cattle') return 'bg-emerald-100 text-emerald-800';
    if (c === 'fish') return 'bg-cyan-100 text-cyan-800';
    return 'bg-slate-100 text-slate-700';
  };

  const handleMaterialUpload = async () => {
    setMatMsg('');
    setMatError('');
    if (!isOnline()) {
      setMatError('You are offline. Admin changes need internet.');
      return;
    }
    if (matTitle.trim() === '') {
      setMatError('Please enter a title for the material.');
      return;
    }
    if (!matFile) {
      setMatError('Please choose a file to upload.');
      return;
    }
    const ext = (matFile.name.split('.').pop() || '').toLowerCase();
    if (!ext) {
      setMatError('The file needs an extension (e.g. .pdf, .mp3).');
      return;
    }
    setMatUploading(true);
    const safeName = sanitiseFileName(matFile.name) || `material.${ext}`;
    const storagePath = `${matCategory}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('materials').upload(storagePath, matFile);
    if (uploadError) {
      setMatError('Upload failed: ' + uploadError.message);
      setMatUploading(false);
      return;
    }
    const { error: insertError } = await supabase.from('materials').insert([{
      title: matTitle.trim(),
      category: matCategory,
      file_name: matFile.name,
      file_path: storagePath,
      file_type: ext,
      file_size: matFile.size,
    }]);
    setMatUploading(false);
    if (insertError) {
      setMatError('File uploaded, but saving the record failed: ' + insertError.message);
      return;
    }
    setMatTitle('');
    setMatFile(null);
    setMatMsg('Uploaded successfully.');
    fetchMaterials();
  };

  const handleMaterialDelete = async (item: any) => {
    if (!isOnline()) {
      alert('You are offline. Admin changes need internet.');
      return;
    }
    if (!window.confirm(`Delete "${item.title}"? The file will be removed from storage.`)) return;
    const { error: storageError } = await supabase.storage.from('materials').remove([item.file_path]);
    if (storageError) {
      alert('Failed to delete the file: ' + storageError.message);
      return;
    }
    const { error } = await supabase.from('materials').delete().eq('id', item.id);
    if (error) alert('Failed to delete item: ' + error.message);
    else fetchMaterials();
  };

  // Open the edit modal for a material (title + category prefilled,
  // file left empty — choosing a file replaces the stored one).
  const openMaterialEdit = (item: any) => {
    setEditMat(item);
    setEditMatTitle(item.title || '');
    setEditMatCategory((item.category || 'Poultry') as 'Poultry' | 'Cattle' | 'Fish');
    setEditMatFile(null);
    setEditMatError('');
  };

  // Save the edit. If a new file was chosen, upload it first, update the
  // row with the new file details, then remove the old file from storage.
  // If no new file, only the title and category change.
  const handleMaterialEditSave = async () => {
    if (!editMat) return;
    setEditMatError('');
    if (!isOnline()) {
      setEditMatError('You are offline. Admin changes need internet.');
      return;
    }
    if (editMatTitle.trim() === '') {
      setEditMatError('Please enter a title for the material.');
      return;
    }
    setEditMatSaving(true);
    const updates: any = {
      title: editMatTitle.trim(),
      category: editMatCategory,
    };
    let newStoragePath: string | null = null;
    if (editMatFile) {
      const ext = (editMatFile.name.split('.').pop() || '').toLowerCase();
      if (!ext) {
        setEditMatError('The file needs an extension (e.g. .pdf, .mp3).');
        setEditMatSaving(false);
        return;
      }
      const safeName = sanitiseFileName(editMatFile.name) || `material.${ext}`;
      newStoragePath = `${editMatCategory}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('materials').upload(newStoragePath, editMatFile);
      if (uploadError) {
        setEditMatError('Upload failed: ' + uploadError.message);
        setEditMatSaving(false);
        return;
      }
      updates.file_name = editMatFile.name;
      updates.file_path = newStoragePath;
      updates.file_type = ext;
      updates.file_size = editMatFile.size;
    }
    const { error: updateError } = await supabase.from('materials').update(updates).eq('id', editMat.id);
    setEditMatSaving(false);
    if (updateError) {
      setEditMatError('Failed to save changes: ' + updateError.message);
      return;
    }
    // The new file is live — remove the old one from storage.
    if (newStoragePath && editMat.file_path && editMat.file_path !== newStoragePath) {
      await supabase.storage.from('materials').remove([editMat.file_path]);
    }
    setEditMat(null);
    setEditMatFile(null);
    fetchMaterials();
  };

  // Submit Handler for Cattle Feed
  const handleCattleFeedSubmit = async (e: React.FormEvent) => {
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
      bag_size_kg: cattleBagSize.trim() === '' || Number.isNaN(parseFloat(cattleBagSize)) ? null : parseFloat(cattleBagSize),
      dm: parseFloat(dm) || 0,
      cp: parseFloat(cp) || 0,
      me: parseFloat(me) || 0,
      bag_image_url: cattleBagImage === '' ? null : cattleBagImage,
      sample_image_url: cattleSampleImage === '' ? null : cattleSampleImage,
      moisture_max_pct: nutMoisture.trim() === '' ? null : nutMoisture.trim(),
      crude_fiber_pct: nutFiber.trim() === '' ? null : nutFiber.trim(),
      crude_fat_pct: nutFat.trim() === '' ? null : nutFat.trim(),
      calcium_pct: nutCalcium.trim() === '' ? null : nutCalcium.trim(),
      phosphorus_pct: nutPhosphorus.trim() === '' ? null : nutPhosphorus.trim(),
      tdn_pct: nutTdn.trim() === '' ? null : nutTdn.trim(),
    };

    if (editId) {
      const { error } = await supabase.from('cattle_feeds').update(payload).eq('id', editId);
      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }
    } else {
      const { error } = await supabase.from('cattle_feeds').insert([payload]);
      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }
    }
    resetForm();
    fetchCattleFeeds();
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

  // Alphabetical sort (client-side) so even a stale offline cache renders
  // in name order. Returns a new array; never mutates the source rows.
  const sortByName = (rows: any[], key: string) =>
    [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')));

  // Screenshot-sequence sort (client-side) so even a stale offline cache
  // renders in sort_order. Rows with no sort_order go last, then by name.
  const sortByOrder = (rows: any[], key: string) =>
    [...rows].sort((a, b) => {
      const ao = a.sort_order, bo = b.sort_order;
      if (ao == null && bo == null) return String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
      if (ao == null) return 1;
      if (bo == null) return -1;
      if (ao !== bo) return ao - bo;
      return String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
    });

  // The four generic feed tabs are the only generic tabs sorted by
  // sort_order (the screenshot sequence); standards / vaccinations keep
  // their day / age order from the fetch.
  const isFeedGenericTab = (key: string) =>
    key === 'broiler_feeds' || key === 'layer_feeds' ||
    key === 'floating_fish_feeds' || key === 'sinking_fish_feeds';

  // Does a row match the search box (case-insensitive substring)?
  const matchesSearch = (value: unknown) =>
    searchTerm.trim() === '' ||
    String(value ?? '').toLowerCase().includes(searchTerm.trim().toLowerCase());

  // Sorted + searched rows for every tab (the active one renders below).
  // Feed tables follow the screenshot sequence (sort_order); the other
  // tables stay alphabetical by name.
  const cattleRows = sortByOrder(cattleFeeds, 'name').filter((f) => matchesSearch(f.name));
  const otherRows = sortByName(otherIngredients, 'name').filter((i) => matchesSearch(i.name));
  const dmRows = sortByName(dmReferences, 'stage_name').filter((r) => matchesSearch(r.stage_name));
  const breedRows = sortByName(breeds, 'name').filter((b) => matchesSearch(b.name));
  const genericRowsSorted = activeGenericDef
    ? (isFeedGenericTab(activeGenericDef.key)
        ? sortByOrder(genericRows[activeGenericDef.key] || [], 'feed_name')
        : (genericRows[activeGenericDef.key] || []))
    : [];
  const genericRowsVisible = activeGenericDef
    ? genericRowsSorted.filter((row) => matchesSearch(row[activeGenericDef.fields[0].key]))
    : [];

  // Item count for the toolbar ("8 items" / "3 of 8 items" when searching).
  const activeTotalCount = activeGenericDef
    ? (genericRows[activeGenericDef.key] || []).length
    : activeTab === 'cattle' ? cattleFeeds.length
    : activeTab === 'other' ? otherIngredients.length
    : activeTab === 'dm' ? dmReferences.length
    : activeTab === 'materials' ? materials.length
    : activeTab === 'notice' ? notices.length
    : breeds.length;
  const activeVisibleCount = activeGenericDef
    ? genericRowsVisible.length
    : activeTab === 'cattle' ? cattleRows.length
    : activeTab === 'other' ? otherRows.length
    : activeTab === 'dm' ? dmRows.length
    : activeTab === 'materials' ? materials.length
    : activeTab === 'notice' ? notices.length
    : breedRows.length;
  const countLabel = searchTerm.trim() === ''
    ? `${activeTotalCount} items`
    : `${activeVisibleCount} of ${activeTotalCount} items`;

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

      {/* Navigation Tabs — one scrollable row for all 10 tables.
          The five feed tabs sit together first: Cattle, Broiler, Layer, Floating Fish, Sinking Fish. */}
      <div className="flex gap-1.5 p-1 bg-slate-200/80 rounded-xl overflow-x-auto">
        {[
          { key: 'cattle', label: 'Cattle Feed', icon: <Wheat size={13} /> },
          { key: 'broiler_feeds', label: 'Broiler Feeds', icon: <Table2 size={13} /> },
          { key: 'layer_feeds', label: 'Layer Feeds', icon: <Table2 size={13} /> },
          { key: 'floating_fish_feeds', label: 'Floating Fish Feeds', icon: <Table2 size={13} /> },
          { key: 'sinking_fish_feeds', label: 'Sinking Fish Feeds', icon: <Table2 size={13} /> },
          { key: 'other', label: 'Other Feed', icon: <FlaskConical size={13} /> },
          { key: 'dm', label: 'DM Ratio', icon: <BookOpen size={13} /> },
          { key: 'breeds', label: 'Breeds', icon: <Dna size={13} /> },
          ...GENERIC_TABLES.filter((t) => t.key !== 'broiler_feeds' && t.key !== 'layer_feeds' && t.key !== 'floating_fish_feeds' && t.key !== 'sinking_fish_feeds').map((t) => ({ key: t.key, label: t.label, icon: <Table2 size={13} /> })),
          { key: 'materials', label: 'Materials', icon: <BookOpen size={13} /> },
          { key: 'notice', label: 'Notice', icon: <Bell size={13} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1 transition shrink-0 whitespace-nowrap ${
              activeTab === tab.key ? 'bg-emerald-800 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
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
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 text-xs">
              {activeTab === 'cattle' && 'Cattle Feed Table'}
              {activeTab === 'other' && 'Other Ingredients Table'}
              {activeTab === 'dm' && 'DM Reference Entries'}
              {activeTab === 'breeds' && 'Cattle Breeds Table'}
              {activeTab === 'materials' && 'Training Materials'}
              {activeTab === 'notice' && 'Notices'}
              {activeGenericDef && `${activeGenericDef.label} Table`}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{countLabel}</span>
            <span className="flex-1" />
            {/* The Materials and Notice tabs have their own cards, so the
                generic search box and Add New button are hidden there. */}
            {activeTab !== 'materials' && activeTab !== 'notice' && (
              <>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs w-40 sm:w-52 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
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
              </>
            )}
          </div>

          {/* TAB 1: NOURISH FEEDS */}
          {activeTab === 'cattle' && (
            <div className="space-y-4">
              {showForm && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={resetForm}
                >
                  <div
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                <form onSubmit={handleCattleFeedSubmit} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 font-bold text-emerald-800">
                    <span>{editId ? 'Edit Cattle Feed' : 'Add New Cattle Feed'}</span>
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
                    <div>
                      <label className="text-[10px] text-slate-500">Bag Size (kg)</label>
                      <input type="number" step="0.01" placeholder="e.g. 25" value={cattleBagSize} onChange={(e) => setCattleBagSize(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    {/* Nutrients (from the product table) — number or a
                        range like "65-70", without the % sign. */}
                    <div>
                      <label className="text-[10px] text-slate-500">Moisture Max (%)</label>
                      <input type="text" placeholder="e.g. 12" value={nutMoisture} onChange={(e) => setNutMoisture(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Crude Fiber (%)</label>
                      <input type="text" placeholder="e.g. 10" value={nutFiber} onChange={(e) => setNutFiber(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Crude Fat (%)</label>
                      <input type="text" placeholder="e.g. 4" value={nutFat} onChange={(e) => setNutFat(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Calcium Min (%)</label>
                      <input type="text" placeholder="e.g. 1.25" value={nutCalcium} onChange={(e) => setNutCalcium(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Phosphorus Min (%)</label>
                      <input type="text" placeholder="e.g. 0.45" value={nutPhosphorus} onChange={(e) => setNutPhosphorus(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">TDN (%)</label>
                      <input type="text" placeholder="e.g. 62" value={nutTdn} onChange={(e) => setNutTdn(e.target.value)} className="w-full border p-1.5 rounded-lg" />
                    </div>
                    {/* Two photos per item: bag + sample. Any size is
                        accepted — each is resized small before saving. */}
                    <div>
                      <label className="text-[10px] text-slate-500">Bag Photo</label>
                      <div className="flex items-center gap-2">
                        {hasFeedImage(cattleBagImage) ? (
                          <img src={cattleBagImage} alt="Bag" className="w-12 h-12 rounded-lg object-cover border" />
                        ) : (
                          <span className="w-12 h-12 rounded-lg border bg-slate-50 flex items-center justify-center text-slate-300">
                            <ImagePlus size={18} />
                          </span>
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <label className="text-[11px] font-bold text-emerald-800 cursor-pointer hover:underline">
                            {uploadingImage ? 'Resizing...' : hasFeedImage(cattleBagImage) ? 'Change photo' : 'Choose photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingImage}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                handleImageFile(file, setCattleBagImage);
                              }}
                            />
                          </label>
                          {hasFeedImage(cattleBagImage) && (
                            <button type="button" onClick={() => setCattleBagImage('')} className="text-[11px] text-rose-600 hover:underline text-left">Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Sample Photo</label>
                      <div className="flex items-center gap-2">
                        {hasFeedImage(cattleSampleImage) ? (
                          <img src={cattleSampleImage} alt="Sample" className="w-12 h-12 rounded-lg object-cover border" />
                        ) : (
                          <span className="w-12 h-12 rounded-lg border bg-slate-50 flex items-center justify-center text-slate-300">
                            <ImagePlus size={18} />
                          </span>
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <label className="text-[11px] font-bold text-emerald-800 cursor-pointer hover:underline">
                            {uploadingImage ? 'Resizing...' : hasFeedImage(cattleSampleImage) ? 'Change photo' : 'Choose photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingImage}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                handleImageFile(file, setCattleSampleImage);
                              }}
                            />
                          </label>
                          {hasFeedImage(cattleSampleImage) && (
                            <button type="button" onClick={() => setCattleSampleImage('')} className="text-[11px] text-rose-600 hover:underline text-left">Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-end">
                      <span className="text-[10px] text-slate-400 leading-tight">Any size — saved small (max 600px), so the page loads fast.</span>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting || uploadingImage} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : editId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{uploadingImage ? 'Resizing photo...' : editId ? 'Update Cattle Feed' : 'Save Cattle Feed'}</span>
                  </button>
                </form>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border overflow-auto max-h-[70vh]">
                <table className="w-full text-left [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-center">Price</th>
                      <th className="p-2.5 text-center">Bag (kg)</th>
                      <th className="p-2.5 text-center">DM %</th>
                      <th className="p-2.5 text-center">CP %</th>
                      <th className="p-2.5 text-center">ME</th>
                      <th className="p-2.5 text-center">Moist. %</th>
                      <th className="p-2.5 text-center">Fiber %</th>
                      <th className="p-2.5 text-center">Fat %</th>
                      <th className="p-2.5 text-center">Ca %</th>
                      <th className="p-2.5 text-center">P %</th>
                      <th className="p-2.5 text-center">TDN %</th>
                      <th className="p-2.5 text-center">Photos</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {cattleRows.length === 0 && (
                      <tr>
                        <td colSpan={15} className="p-4 text-center text-slate-400 font-medium">
                          No items found.
                        </td>
                      </tr>
                    )}
                    {cattleRows.map((feed, idx) => (
                      <tr key={feed.id} className={idx % 2 === 0 ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-100'}>
                        <td className="p-2.5 font-bold">{feed.name}</td>
                        <td className="p-2.5 text-[10px] text-slate-500 capitalize">{feed.category}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">৳{feed.price ?? 0}</td>
                        <td className="p-2.5 text-center">{feed.bag_size_kg ?? '-'}</td>
                        <td className="p-2.5 text-center">{feed.dm ?? 0}%</td>
                        <td className="p-2.5 text-center">{feed.cp ?? 0}%</td>
                        <td className="p-2.5 text-center">{feed.me ?? 0}</td>
                        <td className="p-2.5 text-center">{feed.moisture_max_pct ? `${feed.moisture_max_pct}%` : '-'}</td>
                        <td className="p-2.5 text-center">{feed.crude_fiber_pct ? `${feed.crude_fiber_pct}%` : '-'}</td>
                        <td className="p-2.5 text-center">{feed.crude_fat_pct ? `${feed.crude_fat_pct}%` : '-'}</td>
                        <td className="p-2.5 text-center">{feed.calcium_pct ? `${feed.calcium_pct}%` : '-'}</td>
                        <td className="p-2.5 text-center">{feed.phosphorus_pct ? `${feed.phosphorus_pct}%` : '-'}</td>
                        <td className="p-2.5 text-center">{feed.tdn_pct ? `${feed.tdn_pct}%` : '-'}</td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex gap-1">
                            {hasFeedImage(feed.bag_image_url) ? (
                              <img src={feed.bag_image_url} alt="Bag" className="w-10 h-10 rounded-lg object-cover border inline-block" />
                            ) : (
                              <span className="w-10 h-10 rounded-lg border bg-slate-50 inline-flex items-center justify-center text-slate-300 text-[10px]">Bag</span>
                            )}
                            {hasFeedImage(feed.sample_image_url) ? (
                              <img src={feed.sample_image_url} alt="Sample" className="w-10 h-10 rounded-lg object-cover border inline-block" />
                            ) : (
                              <span className="w-10 h-10 rounded-lg border bg-slate-50 inline-flex items-center justify-center text-slate-300 text-[10px]">Sample</span>
                            )}
                          </span>
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap space-x-1.5">
                          <button onClick={() => startCattleFeedEdit(feed)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"><Edit3 size={12} /> Edit</button>
                          <button onClick={() => handleDelete('cattle_feeds', feed.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"><Trash2 size={12} /> Delete</button>
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
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={resetForm}
                >
                  <div
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border overflow-auto max-h-[70vh]">
                <table className="w-full text-left [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
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
                    {otherRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400 font-medium">
                          No ingredients found.
                        </td>
                      </tr>
                    )}
                    {otherRows.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-100'}>
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
                        <td className="p-2.5 text-center whitespace-nowrap space-x-1.5">
                          <button onClick={() => { 
                            setEditId(item.id); 
                            setItemName(item.name || ''); 
                            setPrice(item.price_per_kg ?? item.price ?? ''); 
                            setDm(item.dm_percent ?? item.dm ?? ''); 
                            setCp(item.cp_percent ?? item.cp ?? ''); 
                            setMe(item.me_energy ?? item.me ?? ''); 
                            setFeedType(item.feed_type || 'concentrate');
                            setShowForm(true); 
                          }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"><Edit3 size={12} /> Edit</button>
                          <button onClick={() => handleDelete('other_ingredients', item.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"><Trash2 size={12} /> Delete</button>
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
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={resetForm}
                >
                  <div
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border overflow-auto max-h-[70vh]">
                <table className="w-full text-left [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5">Group</th>
                      <th className="p-2.5 text-center">Ratio (C:F)</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {dmRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">
                          No entries found.
                        </td>
                      </tr>
                    )}
                    {dmRows.map((ref, idx) => (
                      <tr key={ref.id} className={idx % 2 === 0 ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-100'}>
                        <td className="p-2.5 font-bold">{ref.stage_name}</td>
                        <td className="p-2.5 text-[10px] text-slate-500 capitalize">{ref.target_group}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-800">{ref.concentrate_ratio} : {ref.fodder_ratio}</td>
                        <td className="p-2.5 text-center whitespace-nowrap space-x-1.5">
                          <button onClick={() => { setEditId(ref.id); setStageName(ref.stage_name); setTargetGroup(ref.target_group); setConcentrateRatio(ref.concentrate_ratio); setFodderRatio(ref.fodder_ratio); setShowForm(true); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"><Edit3 size={12} /> Edit</button>
                          <button onClick={() => handleDelete('dm_references', ref.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"><Trash2 size={12} /> Delete</button>
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
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={resetForm}
                >
                  <div
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border overflow-auto max-h-[70vh]">
                <table className="w-full text-left [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Breed Name</th>
                      <th className="p-2.5 text-center">Category</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {breedRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400 font-medium">
                          No breeds found.
                        </td>
                      </tr>
                    ) : (
                      breedRows.map((breed, idx) => (
                        <tr key={breed.id} className={idx % 2 === 0 ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-100'}>
                          <td className="p-2.5 font-bold">{breed.name}</td>
                          <td className="p-2.5 text-center capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${breed.category === 'dairy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {breed.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap space-x-1.5">
                            <button onClick={() => { 
                              setEditId(breed.id); 
                              setBreedName(breed.name || ''); 
                              setBreedCategory(breed.category || 'dairy');
                              setShowForm(true); 
                            }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"><Edit3 size={12} /> Edit</button>
                            <button onClick={() => handleDelete('breeds', breed.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"><Trash2 size={12} /> Delete</button>
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
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={resetGenericForm}
                >
                  <div
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                <form onSubmit={handleGenericSubmit} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 font-bold text-emerald-800">
                    <span>{genericEditId ? `Edit ${activeGenericDef.label}` : `Add New ${activeGenericDef.label}`}</span>
                    <button type="button" onClick={resetGenericForm}><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeGenericDef.fields.map((f) => (
                      <div key={f.key}>
                        <label className="text-[10px] text-slate-500">{f.label}</label>
                        {f.type === 'image' ? (
                          <div className="flex items-center gap-2">
                            {hasFeedImage(genericForm[f.key]) ? (
                              <img
                                src={genericForm[f.key]}
                                alt={f.label}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                            ) : (
                              <span className="w-12 h-12 rounded-lg border bg-slate-50 flex items-center justify-center text-slate-300">
                                <ImagePlus size={18} />
                              </span>
                            )}
                            <div className="flex flex-col gap-1 min-w-0">
                              <label className="text-[11px] font-bold text-emerald-800 cursor-pointer hover:underline">
                                {uploadingImage ? 'Resizing...' : hasFeedImage(genericForm[f.key]) ? 'Change photo' : 'Choose photo'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingImage}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    handleImageFile(file, (v) =>
                                      setGenericForm((p) => ({ ...p, [f.key]: v })),
                                    );
                                  }}
                                />
                              </label>
                              {hasFeedImage(genericForm[f.key]) && (
                                <button
                                  type="button"
                                  onClick={() => setGenericForm((p) => ({ ...p, [f.key]: '' }))}
                                  className="text-[11px] text-rose-600 hover:underline text-left"
                                >
                                  Remove
                                </button>
                              )}
                              <span className="text-[10px] text-slate-400 leading-tight">Any size — saved small (max 600px).</span>
                            </div>
                          </div>
                        ) : f.type === 'select' ? (
                          <select
                            value={genericForm[f.key] ?? ''}
                            onChange={(e) => setGenericForm((p) => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full border p-1.5 rounded-lg bg-white"
                          >
                            {f.options?.map((o) => {
                              if (typeof o === 'string') {
                                return <option key={o} value={o}>{o === '' ? '-' : o}</option>;
                              }
                              return <option key={o.value} value={o.value}>{o.label}</option>;
                            })}
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
                  <button type="submit" disabled={submitting || uploadingImage} className="w-full bg-emerald-800 text-white py-2 rounded-lg font-bold flex justify-center items-center space-x-1">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : genericEditId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{uploadingImage ? 'Resizing photo...' : genericEditId ? `Update ${activeGenericDef.label}` : `Save ${activeGenericDef.label}`}</span>
                  </button>
                </form>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border overflow-auto max-h-[70vh]">
                <table className="w-full text-left [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
                  <thead className="bg-slate-100 font-bold border-b text-[11px] uppercase text-slate-600">
                    <tr>
                      {activeGenericDef.fields.map((f) => (
                        <th key={f.key} className="p-2.5 whitespace-nowrap">{f.label}</th>
                      ))}
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {genericRowsVisible.length === 0 ? (
                      <tr>
                        <td colSpan={activeGenericDef.fields.length + 1} className="p-4 text-center text-slate-400 font-medium">
                          No entries found.
                        </td>
                      </tr>
                    ) : (
                      genericRowsVisible.map((row, idx) => (
                        <tr key={row.id} className={idx % 2 === 0 ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-100'}>
                          {activeGenericDef.fields.map((f, i) => (
                            <td key={f.key} className={`p-2.5 whitespace-nowrap ${i === 0 ? 'font-bold' : 'text-center'}`}>
                              {f.type === 'image' ? (
                                hasFeedImage(row[f.key]) ? (
                                  <img src={row[f.key]} alt={f.label} className="w-10 h-10 rounded-lg object-cover border inline-block" />
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )
                              ) : row[f.key] === null || row[f.key] === undefined || row[f.key] === '' ? (
                                '-'
                              ) : (
                                String(row[f.key])
                              )}
                            </td>
                          ))}
                          <td className="p-2.5 text-center whitespace-nowrap space-x-1.5">
                            <button onClick={() => startGenericEdit(activeGenericDef, row)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"><Edit3 size={12} /> Edit</button>
                            <button onClick={() => handleDelete(activeGenericDef.table, row.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"><Trash2 size={12} /> Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MATERIALS TAB: upload + list (custom — not the generic editor) */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              {/* Upload card */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                <div className="font-bold text-emerald-800 border-b pb-2">Upload Training Material</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-500">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Broiler Feeding Guide"
                      value={matTitle}
                      onChange={(e) => setMatTitle(e.target.value)}
                      className="w-full border p-1.5 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Category</label>
                    <select
                      value={matCategory}
                      onChange={(e) => setMatCategory(e.target.value as 'Poultry' | 'Cattle' | 'Fish')}
                      className="w-full border p-1.5 rounded-lg bg-white"
                    >
                      <option value="Poultry">Poultry</option>
                      <option value="Cattle">Cattle</option>
                      <option value="Fish">Fish</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">File (PDF, PPTX, DOCX, audio, video, any file)</label>
                  <label className="flex items-center gap-2 border rounded-lg p-2 cursor-pointer hover:bg-slate-50">
                    <span className="shrink-0 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1.5 rounded-lg">Choose file</span>
                    <span className="text-xs text-slate-600 truncate">
                      {matFile ? `${matFile.name} (${formatMatFileSize(matFile.size)})` : 'No file chosen'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        setMatFile(e.target.files?.[0] || null);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {matError && <p className="text-xs font-semibold text-rose-600">{matError}</p>}
                {matMsg && <p className="text-xs font-semibold text-emerald-700">{matMsg}</p>}
                <button
                  onClick={handleMaterialUpload}
                  disabled={matUploading}
                  className="flex items-center gap-1.5 bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-900 transition disabled:opacity-60"
                >
                  {matUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>{matUploading ? 'Uploading...' : 'Upload Material'}</span>
                </button>
              </div>

              {/* Existing materials */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2.5 border-b font-bold text-slate-700 text-xs">
                  Uploaded Materials ({materials.length})
                </div>
                {materialsLoading ? (
                  <div className="p-6 flex justify-center items-center text-emerald-800 space-x-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span className="text-xs font-medium">Loading materials...</span>
                  </div>
                ) : materials.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">No materials uploaded yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {materials.map((m) => (
                      <li key={m.id} className="p-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-snug break-words">{m.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${matCategoryBadge(m.category)}`}>
                              {m.category}
                            </span>
                            <span className="text-slate-500 break-all">{m.file_name}</span>
                            <span className="text-slate-400">{formatMatFileSize(m.file_size)}</span>
                            <span className="text-slate-400">
                              {m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col gap-1.5">
                          <button
                            onClick={() => openMaterialEdit(m)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleMaterialDelete(m)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Edit Material modal — title + category, and optionally replace the file */}
          {editMat && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => { if (!editMatSaving) setEditMat(null); }}
            >
              <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">Edit Material</span>
                  <button
                    onClick={() => { if (!editMatSaving) setEditMat(null); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Title</label>
                  <input
                    type="text"
                    value={editMatTitle}
                    onChange={(e) => setEditMatTitle(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs"
                    placeholder="Material title"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Category</label>
                  <select
                    value={editMatCategory}
                    onChange={(e) => setEditMatCategory(e.target.value as 'Poultry' | 'Cattle' | 'Fish')}
                    className="w-full border rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Poultry">Poultry</option>
                    <option value="Cattle">Cattle</option>
                    <option value="Fish">Fish</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Replace file (optional — leave empty to keep the current file)</label>
                  <label className="flex items-center gap-2 border rounded-lg p-2 cursor-pointer hover:bg-slate-50">
                    <span className="shrink-0 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1.5 rounded-lg">Choose file</span>
                    <span className="text-xs text-slate-600 truncate">
                      {editMatFile ? `${editMatFile.name} (${formatMatFileSize(editMatFile.size)})` : `Current file: ${editMat.file_name}`}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        setEditMatFile(e.target.files?.[0] || null);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {editMatError && <p className="text-xs font-semibold text-rose-600">{editMatError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleMaterialEditSave}
                    disabled={editMatSaving}
                    className="flex items-center gap-1.5 bg-emerald-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-emerald-900 transition disabled:opacity-60"
                  >
                    {editMatSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>{editMatSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={() => { if (!editMatSaving) setEditMat(null); }}
                    disabled={editMatSaving}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTICE TAB: send a notice to all users */}
          {activeTab === 'notice' && (
            <div className="space-y-4">
              {/* Compose card */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-sm">
                <div className="font-bold text-emerald-800 border-b pb-2">Send Notice</div>
                <div>
                  <label className="text-[10px] text-slate-500">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. New feed price from tomorrow"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full border p-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Write the notice here..."
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    className="w-full border p-1.5 rounded-lg resize-y"
                  />
                </div>
                {noticeMsg && (
                  <p className={`text-xs font-semibold ${noticeMsg.startsWith('Notice sent') ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {noticeMsg}
                  </p>
                )}
                <div>
                  <button
                    onClick={handleSendNotice}
                    disabled={noticeSending}
                    className="flex items-center gap-1.5 bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-900 transition disabled:opacity-60"
                  >
                    {noticeSending ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                    <span>{noticeSending ? 'Sending...' : 'Send to All Users'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  The notice appears at once in every user's app (bell icon on the home page) and as a phone notification. Users whose app is closed get it through Firebase push once the push setup is done.
                </p>
              </div>

              {/* Sent notices */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                <div className="font-bold text-slate-700 border-b pb-2">Sent Notices</div>
                {noticesLoading ? (
                  <div className="p-6 text-center text-slate-400 font-medium animate-pulse">Loading notices...</div>
                ) : notices.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-medium">No notices sent yet.</div>
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="border border-slate-200 rounded-lg p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-800 text-sm leading-snug min-w-0">{n.title}</div>
                        <button
                          onClick={() => handleDeleteNotice(n.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition shrink-0"
                          title="Delete this notice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{n.message}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                        {n.created_by ? ` • ${n.created_by}` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
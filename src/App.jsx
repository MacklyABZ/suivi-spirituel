import React, { useEffect, useMemo, useRef, useState } from 'react';
import localforage from 'localforage';
import { toPng } from 'html-to-image';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Flame,
  Heart,
  Image as ImageIcon,
  Library,
  Lock,
  Plus,
  Save,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  Users
} from 'lucide-react';

const bibleBooks = [
  'Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome', 'Josué', 'Juges', 'Ruth', '1 Samuel', '2 Samuel', '1 Rois', '2 Rois',
  '1 Chroniques', '2 Chroniques', 'Esdras', 'Néhémie', 'Esther', 'Job', 'Psaumes', 'Proverbes', 'Ecclésiaste', 'Cantique des cantiques',
  'Ésaïe', 'Jérémie', 'Lamentations', 'Ézéchiel', 'Daniel', 'Osée', 'Joël', 'Amos', 'Abdias', 'Jonas', 'Michée', 'Nahum', 'Habacuc',
  'Sophonie', 'Aggée', 'Zacharie', 'Malachie', 'Matthieu', 'Marc', 'Luc', 'Jean', 'Actes', 'Romains', '1 Corinthiens', '2 Corinthiens',
  'Galates', 'Éphésiens', 'Philippiens', 'Colossiens', '1 Thessaloniciens', '2 Thessaloniciens', '1 Timothée', '2 Timothée', 'Tite',
  'Philémon', 'Hébreux', 'Jacques', '1 Pierre', '2 Pierre', '1 Jean', '2 Jean', '3 Jean', 'Jude', 'Apocalypse'
];

const db = localforage.createInstance({
  name: 'suivi-spirituel-pwa',
  storeName: 'spiritual_tracker'
});

const defaultGoals = {
  prayerHoursPerWeek: 7,
  bibleChaptersPerWeek: 20,
  literaturePagesPerWeek: 50,
  evangelisationPerWeek: 3,
  fastingDaysPerMonth: 4
};

const defaultBackgrounds = [
  { id: 'aurore', label: 'Aurore', css: 'linear-gradient(135deg, #312e81 0%, #4f46e5 35%, #7c3aed 100%)' },
  { id: 'grace', label: 'Grâce', css: 'linear-gradient(135deg, #065f46 0%, #10b981 45%, #a7f3d0 100%)' },
  { id: 'or', label: 'Victoire', css: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #facc15 100%)' }
];

const defaultEncouragement = 'Sois fidèle dans les petites choses 🙏🏼🙇🏽‍♀️❤️';

const emptyEntry = () => ({
  id: crypto.randomUUID(),
  profileId: '',
  date: todayISO(),
  meditation: false,
  prayerAlone: false,
  prayerDurationHours: '',
  bibleReadings: [{ book: '', start: '', end: '' }],
  fasting: false,
  fastingDays: '',
  prayerGroup: false,
  confession: false,
  retreat: false,
  bibleStudyJC: false,
  evangelisationCount: '',
  evangelisationNote: '',
  notes: defaultEncouragement,
  literatureReadings: [{ title: '', startPage: '', endPage: '' }],
  reportBackgroundId: 'aurore',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

function todayISO() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function formatDateFR(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rangeCount(start, end) {
  const s = numberValue(start);
  const e = numberValue(end);
  if (!s || !e || e < s) return 0;
  return e - s + 1;
}

function weekStart(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}

function monthKey(dateStr) {
  return dateStr?.slice(0, 7) || '';
}

function parseMaybeCount(text) {
  if (!text) return 0;
  const first = String(text).match(/\d+/);
  return first ? Number(first[0]) : 0;
}

function computeBibleTotal(entry) {
  return (entry.bibleReadings || []).reduce((sum, item) => sum + rangeCount(item.start, item.end), 0);
}

function computeLiteratureTotal(entry) {
  return (entry.literatureReadings || []).reduce((sum, item) => sum + rangeCount(item.startPage, item.endPage), 0);
}

function computePrayerHours(entry) {
  return numberValue(entry.prayerDurationHours);
}

function reportText(entry, profileName) {
  const bibleLines = (entry.bibleReadings || [])
    .filter((item) => item.book || item.start || item.end)
    .map((item) => {
      const count = rangeCount(item.start, item.end);
      const chapters = item.start && item.end ? `${item.start} à ${item.end}` : '';
      return `${item.book}${chapters ? ` ${chapters}` : ''}${count ? ` (${count} chap)` : ''}`;
    });

  const literatureLines = (entry.literatureReadings || [])
    .filter((item) => item.title || item.startPage || item.endPage)
    .map((item) => {
      const count = rangeCount(item.startPage, item.endPage);
      const pages = item.startPage && item.endPage ? `Pg ${item.startPage} à ${item.endPage}` : '';
      return `- ${item.title}${pages ? ` (${pages}` : ''}${count ? ` = ${count} pages)` : pages ? ')' : ''}`;
    });

  return [
    `CR de ${profileName} du ${formatDateFR(entry.date)}`,
    '',
    `📝 Méditation : ${entry.meditation ? 'oui' : 'non'}`,
    `🙏🏾 Prière seule : ${entry.prayerAlone ? 'oui' : 'non'}${entry.prayerDurationHours ? ` (${entry.prayerDurationHours} h)` : ''}`,
    `📖 Lecture biblique : ${computeBibleTotal(entry)} chap`,
    bibleLines.length ? bibleLines.join('\n') : 'Aucune lecture biblique saisie',
    '',
    `📚 Littérature chrétienne : ${computeLiteratureTotal(entry)} pages`,
    literatureLines.length ? literatureLines.join('\n') : '- Aucune lecture saisie',
    '',
    `PG : ${entry.prayerGroup ? 'oui' : 'non'}`,
    `Jeûne : ${entry.fasting ? 'oui' : 'non'}${entry.fastingDays ? ` (${entry.fastingDays} jour(s))` : ''}`,
    `Confession of Sin : ${entry.confession ? 'oui' : 'non'}`,
    `Retraite personnelle : ${entry.retreat ? 'oui' : 'non'}`,
    `Étude biblique avec JC : ${entry.bibleStudyJC ? 'oui' : 'non'}`,
    `Évangélisation : ${entry.evangelisationCount || 0}${entry.evangelisationNote ? ` (${entry.evangelisationNote})` : ''}`,
    '',
    entry.notes || defaultEncouragement
  ].join('\n');
}

function aggregate(entries) {
  return entries.reduce(
    (acc, entry) => {
      acc.prayerHours += computePrayerHours(entry);
      acc.bibleChapters += computeBibleTotal(entry);
      acc.literaturePages += computeLiteratureTotal(entry);
      acc.fastingDays += numberValue(entry.fastingDays);
      acc.evangelisation += parseMaybeCount(entry.evangelisationCount);
      acc.days += 1;
      if (entry.meditation) acc.meditationDays += 1;
      if (entry.prayerGroup) acc.pgDays += 1;
      if (entry.confession) acc.confessionDays += 1;
      return acc;
    },
    { prayerHours: 0, bibleChapters: 0, literaturePages: 0, fastingDays: 0, evangelisation: 0, days: 0, meditationDays: 0, pgDays: 0, confessionDays: 0 }
  );
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function App() {
  const reportRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('home');
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState('');
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState(defaultGoals);
  const [form, setForm] = useState(emptyEntry());
  const [status, setStatus] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [locked, setLocked] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [reportImageUrl, setReportImageUrl] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePin, setNewProfilePin] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('week');

  useEffect(() => {
    (async () => {
      const [savedProfiles, savedEntries, savedGoals, savedActiveId] = await Promise.all([
        db.getItem('profiles'),
        db.getItem('entries'),
        db.getItem('goals'),
        db.getItem('activeProfileId')
      ]);

      const profilesData = Array.isArray(savedProfiles) && savedProfiles.length
        ? savedProfiles
        : [{ id: crypto.randomUUID(), name: 'Jacques A.', pin: '', role: 'member', createdAt: new Date().toISOString() }];

      const activeId = savedActiveId || profilesData[0].id;
      setProfiles(profilesData);
      setEntries(Array.isArray(savedEntries) ? savedEntries : []);
      setGoals(savedGoals || defaultGoals);
      setActiveProfileId(activeId);
      const profile = profilesData.find((item) => item.id === activeId) || profilesData[0];
      const fresh = { ...emptyEntry(), profileId: profile.id };
      setForm(fresh);
      setLocked(Boolean(profile?.pin));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    db.setItem('profiles', profiles);
  }, [profiles, ready]);

  useEffect(() => {
    if (!ready) return;
    db.setItem('entries', entries);
  }, [entries, ready]);

  useEffect(() => {
    if (!ready) return;
    db.setItem('goals', goals);
  }, [goals, ready]);

  useEffect(() => {
    if (!ready) return;
    db.setItem('activeProfileId', activeProfileId);
  }, [activeProfileId, ready]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const activeProfile = useMemo(() => profiles.find((item) => item.id === activeProfileId) || profiles[0], [profiles, activeProfileId]);

  const profileEntries = useMemo(
    () => entries.filter((item) => item.profileId === activeProfileId).sort((a, b) => b.date.localeCompare(a.date)),
    [entries, activeProfileId]
  );

  const currentReportText = useMemo(() => reportText(form, activeProfile?.name || 'Utilisateur'), [form, activeProfile]);
  const currentBackground = useMemo(
    () => defaultBackgrounds.find((bg) => bg.id === form.reportBackgroundId) || defaultBackgrounds[0],
    [form.reportBackgroundId]
  );

  const filteredEntries = useMemo(() => {
    if (!profileEntries.length) return [];
    const today = todayISO();
    if (filterPeriod === 'all') return profileEntries;
    if (filterPeriod === 'month') return profileEntries.filter((item) => monthKey(item.date) === monthKey(today));
    const currentWeek = weekStart(today).toISOString().slice(0, 10);
    return profileEntries.filter((item) => weekStart(item.date).toISOString().slice(0, 10) === currentWeek);
  }, [profileEntries, filterPeriod]);

  const stats = useMemo(() => aggregate(filteredEntries), [filteredEntries]);
  const overallStats = useMemo(() => aggregate(profileEntries), [profileEntries]);
  const supervisorRows = useMemo(() => {
    return profiles.map((profile) => {
      const personEntries = entries.filter((item) => item.profileId === profile.id);
      return { profile, stats: aggregate(personEntries), lastDate: personEntries.sort((a, b) => b.date.localeCompare(a.date))[0]?.date || '-' };
    });
  }, [profiles, entries]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  }

  function updateArrayItem(key, index, patch) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
      updatedAt: new Date().toISOString()
    }));
  }

  function addArrayItem(key, template) {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], template], updatedAt: new Date().toISOString() }));
  }

  function removeArrayItem(key, index) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].length === 1 ? prev[key] : prev[key].filter((_, i) => i !== index),
      updatedAt: new Date().toISOString()
    }));
  }

  function resetForm() {
    setForm({ ...emptyEntry(), profileId: activeProfileId });
    setReportImageUrl('');
  }

  function saveEntry() {
    const payload = { ...form, profileId: activeProfileId, updatedAt: new Date().toISOString() };
    setEntries((prev) => {
      const exists = prev.some((item) => item.id === payload.id);
      return exists ? prev.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...prev];
    });
    setStatus('Journée enregistrée localement.');
    setTab('report');
  }

  function editEntry(entry) {
    setForm({ ...entry });
    setTab('journal');
    setStatus(`Entrée du ${formatDateFR(entry.date)} ouverte.`);
    setReportImageUrl('');
  }

  function deleteEntry(id) {
    setEntries((prev) => prev.filter((item) => item.id !== id));
    if (form.id === id) resetForm();
    setStatus('Entrée supprimée.');
  }

  async function createReportImage() {
    if (!reportRef.current) return;
    const dataUrl = await toPng(reportRef.current, { cacheBust: true, pixelRatio: 2 });
    setReportImageUrl(dataUrl);
    const blob = await (await fetch(dataUrl)).blob();
    downloadBlob(`rapport-${activeProfile?.name || 'profil'}-${form.date}.png`, blob);
    setStatus('Image du rapport générée.');
  }

  async function shareReport() {
    const text = currentReportText;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Compte rendu spirituel', text });
        setStatus('Rapport partagé.');
        return;
      } catch {
        // ignore cancellation
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function copyReport() {
    await navigator.clipboard.writeText(currentReportText);
    setStatus('Compte rendu copié.');
  }

  async function installApp() {
    if (!installPrompt) {
      setStatus('Installation disponible depuis le menu du navigateur si le bouton système n’apparaît pas.');
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  function exportJson() {
    downloadBlob('suivi-spirituel-backup.json', new Blob([JSON.stringify({ profiles, entries, goals }, null, 2)], { type: 'application/json' }));
  }

  function exportCsv() {
    const rows = [
      ['Profil', 'Date', 'Meditation', 'PriereHeures', 'Chapitres', 'Pages', 'JeuneJours', 'Evangelisation', 'PG', 'Confession', 'Retraite', 'EtudeJC']
    ];
    entries.forEach((entry) => {
      const profileName = profiles.find((p) => p.id === entry.profileId)?.name || 'Inconnu';
      rows.push([
        profileName,
        entry.date,
        entry.meditation ? 'oui' : 'non',
        computePrayerHours(entry),
        computeBibleTotal(entry),
        computeLiteratureTotal(entry),
        numberValue(entry.fastingDays),
        parseMaybeCount(entry.evangelisationCount),
        entry.prayerGroup ? 'oui' : 'non',
        entry.confession ? 'oui' : 'non',
        entry.retreat ? 'oui' : 'non',
        entry.bibleStudyJC ? 'oui' : 'non'
      ]);
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    downloadBlob('suivi-spirituel.csv', new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.profiles)) setProfiles(parsed.profiles);
        if (Array.isArray(parsed.entries)) setEntries(parsed.entries);
        if (parsed.goals) setGoals(parsed.goals);
        setStatus('Sauvegarde importée.');
      } catch {
        setStatus('Fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
  }

  function addProfile() {
    if (!newProfileName.trim()) return;
    const profile = {
      id: crypto.randomUUID(),
      name: newProfileName.trim(),
      pin: newProfilePin.trim(),
      role: profiles.length === 0 ? 'supervisor' : 'member',
      createdAt: new Date().toISOString()
    };
    setProfiles((prev) => [...prev, profile]);
    setActiveProfileId(profile.id);
    setLocked(Boolean(profile.pin));
    setNewProfileName('');
    setNewProfilePin('');
    setForm({ ...emptyEntry(), profileId: profile.id });
    setStatus('Profil ajouté.');
  }

  function switchProfile(profileId) {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return;
    setActiveProfileId(profileId);
    setLocked(Boolean(profile.pin));
    setPinInput('');
    setForm({ ...emptyEntry(), profileId });
    setTab('home');
    setStatus(`Profil actif : ${profile.name}`);
  }

  function unlockProfile() {
    if ((activeProfile?.pin || '') === pinInput) {
      setLocked(false);
      setStatus('Profil déverrouillé.');
      setPinInput('');
    } else {
      setStatus('Code PIN incorrect.');
    }
  }

  function updateGoal(key, value) {
    setGoals((prev) => ({ ...prev, [key]: value }));
  }

  if (!ready) {
    return <div className="loading-screen">Chargement de l’application…</div>;
  }

  if (locked) {
    return (
      <div className="app-shell auth-shell">
        <div className="card auth-card">
          <Lock className="hero-icon" />
          <h1>{activeProfile?.name}</h1>
          <p>Ce profil est protégé. Entre le code PIN pour accéder au suivi spirituel.</p>
          <input className="input" type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Code PIN" />
          <button className="btn primary" onClick={unlockProfile}>Déverrouiller</button>
          <button className="btn secondary" onClick={() => setLocked(false)}>Continuer sans verrou</button>
          {status ? <div className="status">{status}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">PWA installable</div>
          <h1>Suivi Spirituel</h1>
          <p>{activeProfile?.name || 'Utilisateur'} · compagnon quotidien de croissance</p>
        </div>
        <button className="icon-btn" onClick={installApp} title="Installer l’application">
          <Smartphone size={18} />
        </button>
      </header>

      <section className="hero-grid">
        <div className="hero-card gradient-card">
          <div className="hero-content">
            <Sparkles className="hero-icon" />
            <h2>Écran d’accueil spirituel</h2>
            <p>Journal quotidien, tableau de bord, objectifs, export, partage et supervision locale.</p>
            <div className="hero-actions">
              <button className="btn light" onClick={() => setTab('journal')}>Nouvelle saisie</button>
              <button className="btn secondary" onClick={() => setTab('dashboard')}>Voir les statistiques</button>
            </div>
          </div>
        </div>

        <div className="hero-card compact-card">
          <div className="metric"><span>{profileEntries.length}</span><small>journées</small></div>
          <div className="metric"><span>{overallStats.bibleChapters}</span><small>chapitres</small></div>
          <div className="metric"><span>{overallStats.prayerHours.toFixed(1)}</span><small>heures de prière</small></div>
          <div className="metric"><span>{overallStats.evangelisation}</span><small>actions d’évangélisation</small></div>
        </div>
      </section>

      <nav className="bottom-nav">
        {[
          ['home', Heart, 'Accueil'],
          ['journal', BookOpen, 'Journal'],
          ['report', ImageIcon, 'Rapport'],
          ['dashboard', BarChart3, 'Stats'],
          ['library', Library, 'Bibliothèque'],
          ['settings', Shield, 'Réglages']
        ].map(([id, Icon, label]) => (
          <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'home' && (
          <div className="stack">
            <Card title="Aujourd’hui" icon={<CalendarDays size={18} />}>
              <div className="grid two">
                <LabelValue label="Date" value={formatDateFR(form.date)} />
                <LabelValue label="Fond du rapport" value={currentBackground.label} />
                <LabelValue label="Méditation" value={form.meditation ? 'Oui' : 'Non'} />
                <LabelValue label="Prière" value={form.prayerDurationHours ? `${form.prayerDurationHours} h` : '0 h'} />
                <LabelValue label="Bible" value={`${computeBibleTotal(form)} chap`} />
                <LabelValue label="Littérature" value={`${computeLiteratureTotal(form)} pages`} />
              </div>
            </Card>

            <Card title="Raccourcis" icon={<ChevronRight size={18} />}>
              <div className="quick-actions">
                <button className="btn primary" onClick={saveEntry}><Save size={16} /> Enregistrer</button>
                <button className="btn secondary" onClick={copyReport}><Copy size={16} /> Copier le CR</button>
                <button className="btn secondary" onClick={shareReport}><Share2 size={16} /> Partager</button>
                <button className="btn secondary" onClick={createReportImage}><ImageIcon size={16} /> Image</button>
              </div>
            </Card>

            <Card title="Historique récent" icon={<Users size={18} />}>
              <div className="history-list">
                {profileEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div>
                      <strong>{formatDateFR(entry.date)}</strong>
                      <div className="muted">{computeBibleTotal(entry)} chap · {computeLiteratureTotal(entry)} pages · {computePrayerHours(entry)} h</div>
                    </div>
                    <div className="row gap-sm">
                      <button className="mini-btn" onClick={() => editEntry(entry)}>Ouvrir</button>
                      <button className="mini-btn danger" onClick={() => deleteEntry(entry.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {!profileEntries.length ? <div className="empty">Aucune journée enregistrée.</div> : null}
              </div>
            </Card>
          </div>
        )}

        {tab === 'journal' && (
          <div className="stack">
            <Card title="Informations du jour" icon={<User size={18} />}>
              <div className="grid two">
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} />
                </div>
                <div>
                  <label className="label">Fond du rapport image</label>
                  <select className="input" value={form.reportBackgroundId} onChange={(e) => updateField('reportBackgroundId', e.target.value)}>
                    {defaultBackgrounds.map((bg) => <option key={bg.id} value={bg.id}>{bg.label}</option>)}
                  </select>
                </div>
              </div>
            </Card>

            <Card title="Vie de piété" icon={<Heart size={18} />}>
              <div className="grid two">
                <Toggle label="Méditation" checked={form.meditation} onChange={(v) => updateField('meditation', v)} />
                <Toggle label="Prière seule" checked={form.prayerAlone} onChange={(v) => updateField('prayerAlone', v)} />
                <div>
                  <label className="label">Durée de prière (heures)</label>
                  <input className="input" type="number" min="0" step="0.25" value={form.prayerDurationHours} onChange={(e) => updateField('prayerDurationHours', e.target.value)} />
                </div>
                <Toggle label="PG" checked={form.prayerGroup} onChange={(v) => updateField('prayerGroup', v)} />
                <Toggle label="Confession of Sin" checked={form.confession} onChange={(v) => updateField('confession', v)} />
                <Toggle label="Retraite personnelle" checked={form.retreat} onChange={(v) => updateField('retreat', v)} />
                <Toggle label="Étude biblique avec JC" checked={form.bibleStudyJC} onChange={(v) => updateField('bibleStudyJC', v)} />
              </div>
            </Card>

            <Card title="Lecture de la Bible" icon={<BookOpen size={18} />}>
              <div className="stack-sm">
                {form.bibleReadings.map((item, index) => (
                  <div className="row-card" key={index}>
                    <select className="input" value={item.book} onChange={(e) => updateArrayItem('bibleReadings', index, { book: e.target.value })}>
                      <option value="">Choisir un livre</option>
                      {bibleBooks.map((book) => <option key={book} value={book}>{book}</option>)}
                    </select>
                    <div className="grid two">
                      <input className="input" type="number" min="1" placeholder="Chap. début" value={item.start} onChange={(e) => updateArrayItem('bibleReadings', index, { start: e.target.value })} />
                      <input className="input" type="number" min="1" placeholder="Chap. fin" value={item.end} onChange={(e) => updateArrayItem('bibleReadings', index, { end: e.target.value })} />
                    </div>
                    <div className="row between">
                      <span className="muted">Total: {rangeCount(item.start, item.end)} chapitre(s)</span>
                      <button className="mini-btn danger" onClick={() => removeArrayItem('bibleReadings', index)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <div className="row between">
                  <strong>Total du jour: {computeBibleTotal(form)} chap</strong>
                  <button className="btn secondary" onClick={() => addArrayItem('bibleReadings', { book: '', start: '', end: '' })}><Plus size={16} /> Ajouter</button>
                </div>
              </div>
            </Card>

            <Card title="Jeûne et mission" icon={<Flame size={18} />}>
              <div className="grid two">
                <Toggle label="Jeûne" checked={form.fasting} onChange={(v) => updateField('fasting', v)} />
                <div>
                  <label className="label">Nombre de jours</label>
                  <input className="input" type="number" min="0" step="1" value={form.fastingDays} onChange={(e) => updateField('fastingDays', e.target.value)} />
                </div>
                <div>
                  <label className="label">Évangélisation (ex: 2 ou 2/10)</label>
                  <input className="input" value={form.evangelisationCount} onChange={(e) => updateField('evangelisationCount', e.target.value)} />
                </div>
                <div>
                  <label className="label">Précision</label>
                  <input className="input" value={form.evangelisationNote} onChange={(e) => updateField('evangelisationNote', e.target.value)} placeholder="sortie, contacts, maison à maison…" />
                </div>
              </div>
            </Card>

            <Card title="Littérature chrétienne" icon={<Library size={18} />}>
              <div className="stack-sm">
                {form.literatureReadings.map((item, index) => (
                  <div className="row-card" key={index}>
                    <input className="input" placeholder="Titre du livre" value={item.title} onChange={(e) => updateArrayItem('literatureReadings', index, { title: e.target.value })} />
                    <div className="grid two">
                      <input className="input" type="number" min="1" placeholder="Page début" value={item.startPage} onChange={(e) => updateArrayItem('literatureReadings', index, { startPage: e.target.value })} />
                      <input className="input" type="number" min="1" placeholder="Page fin" value={item.endPage} onChange={(e) => updateArrayItem('literatureReadings', index, { endPage: e.target.value })} />
                    </div>
                    <div className="row between">
                      <span className="muted">Total: {rangeCount(item.startPage, item.endPage)} page(s)</span>
                      <button className="mini-btn danger" onClick={() => removeArrayItem('literatureReadings', index)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <div className="row between">
                  <strong>Total du jour: {computeLiteratureTotal(form)} pages</strong>
                  <button className="btn secondary" onClick={() => addArrayItem('literatureReadings', { title: '', startPage: '', endPage: '' })}><Plus size={16} /> Ajouter</button>
                </div>
              </div>
            </Card>

            <Card title="Notes finales" icon={<CheckCircle2 size={18} />}>
              <textarea className="textarea" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
              <div className="quick-actions">
                <button className="btn primary" onClick={saveEntry}><Save size={16} /> Enregistrer</button>
                <button className="btn secondary" onClick={resetForm}>Nouvelle journée</button>
              </div>
            </Card>
          </div>
        )}

        {tab === 'report' && (
          <div className="stack">
            <Card title="Rapport généré" icon={<ImageIcon size={18} />}>
              <div ref={reportRef} className="report-image" style={{ background: currentBackground.css }}>
                <div className="report-overlay" />
                <div className="report-content">
                  <div className="report-kicker">Compte rendu spirituel</div>
                  <h3>{activeProfile?.name} · {formatDateFR(form.date)}</h3>
                  <pre>{currentReportText}</pre>
                </div>
              </div>
              <div className="quick-actions">
                <button className="btn primary" onClick={copyReport}><Copy size={16} /> Copier</button>
                <button className="btn secondary" onClick={shareReport}><Share2 size={16} /> Partager</button>
                <button className="btn secondary" onClick={createReportImage}><Download size={16} /> PNG</button>
              </div>
              {reportImageUrl ? <img className="preview-image" src={reportImageUrl} alt="Aperçu du rapport" /> : null}
            </Card>
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="stack">
            <Card title="Tableau de bord personnel" icon={<BarChart3 size={18} />}>
              <div className="segmented">
                {[
                  ['week', 'Semaine'],
                  ['month', 'Mois'],
                  ['all', 'Tout']
                ].map(([id, label]) => (
                  <button key={id} className={`segment ${filterPeriod === id ? 'active' : ''}`} onClick={() => setFilterPeriod(id)}>{label}</button>
                ))}
              </div>
              <div className="grid two">
                <StatCard label="Heures de prière" value={stats.prayerHours.toFixed(1)} goal={goals.prayerHoursPerWeek} unit="h" />
                <StatCard label="Chapitres bibliques" value={stats.bibleChapters} goal={goals.bibleChaptersPerWeek} unit="chap" />
                <StatCard label="Pages lues" value={stats.literaturePages} goal={goals.literaturePagesPerWeek} unit="pages" />
                <StatCard label="Évangélisation" value={stats.evangelisation} goal={goals.evangelisationPerWeek} unit="actions" />
                <StatCard label="Jours de jeûne" value={stats.fastingDays} goal={goals.fastingDaysPerMonth} unit="jours" />
                <StatCard label="Jours de méditation" value={stats.meditationDays} goal={7} unit="jours" />
              </div>
            </Card>

            <Card title="Historique du profil" icon={<CalendarDays size={18} />}>
              <div className="history-list">
                {profileEntries.map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div>
                      <strong>{formatDateFR(entry.date)}</strong>
                      <div className="muted">{computePrayerHours(entry)} h · {computeBibleTotal(entry)} chap · {computeLiteratureTotal(entry)} pages</div>
                    </div>
                    <div className="row gap-sm">
                      <button className="mini-btn" onClick={() => editEntry(entry)}>Modifier</button>
                      <button className="mini-btn danger" onClick={() => deleteEntry(entry.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Vue responsable locale" icon={<Users size={18} />}>
              <div className="history-list">
                {supervisorRows.map(({ profile, stats: rowStats, lastDate }) => (
                  <div key={profile.id} className="history-item">
                    <div>
                      <strong>{profile.name}</strong>
                      <div className="muted">Dernier rapport: {lastDate === '-' ? '-' : formatDateFR(lastDate)}</div>
                    </div>
                    <div className="muted small-right">{rowStats.prayerHours.toFixed(1)} h · {rowStats.bibleChapters} chap · {rowStats.evangelisation} évang.</div>
                  </div>
                ))}
              </div>
              <p className="footnote">Cette vue supervise les profils stockés sur ce téléphone. Une vraie synchronisation cloud demanderait un backend séparé.</p>
            </Card>
          </div>
        )}

        {tab === 'library' && (
          <div className="stack">
            <Card title="Bibliothèque de lecture" icon={<Library size={18} />}>
              <div className="history-list">
                {Array.from(new Set(entries.flatMap((entry) => entry.literatureReadings.map((item) => item.title).filter(Boolean)))).map((title) => {
                  const totalPages = entries.reduce((sum, entry) => sum + entry.literatureReadings.filter((item) => item.title === title).reduce((s, item) => s + rangeCount(item.startPage, item.endPage), 0), 0);
                  return (
                    <div key={title} className="history-item">
                      <div>
                        <strong>{title}</strong>
                        <div className="muted">Total parcouru: {totalPages} pages</div>
                      </div>
                    </div>
                  );
                })}
                {!entries.some((entry) => entry.literatureReadings.some((item) => item.title)) ? <div className="empty">Aucun livre encore listé.</div> : null}
              </div>
            </Card>

            <Card title="Sauvegarde et partage" icon={<Download size={18} />}>
              <div className="quick-actions">
                <button className="btn primary" onClick={exportJson}><Download size={16} /> Export JSON</button>
                <button className="btn secondary" onClick={exportCsv}><Download size={16} /> Export CSV</button>
                <label className="btn secondary upload-btn">
                  Import JSON
                  <input type="file" accept="application/json" onChange={importBackup} hidden />
                </label>
              </div>
            </Card>
          </div>
        )}

        {tab === 'settings' && (
          <div className="stack">
            <Card title="Objectifs" icon={<TargetIcon />}>
              <div className="grid two">
                <GoalInput label="Heures de prière / semaine" value={goals.prayerHoursPerWeek} onChange={(v) => updateGoal('prayerHoursPerWeek', v)} />
                <GoalInput label="Chapitres / semaine" value={goals.bibleChaptersPerWeek} onChange={(v) => updateGoal('bibleChaptersPerWeek', v)} />
                <GoalInput label="Pages / semaine" value={goals.literaturePagesPerWeek} onChange={(v) => updateGoal('literaturePagesPerWeek', v)} />
                <GoalInput label="Évangélisation / semaine" value={goals.evangelisationPerWeek} onChange={(v) => updateGoal('evangelisationPerWeek', v)} />
                <GoalInput label="Jeûne / mois" value={goals.fastingDaysPerMonth} onChange={(v) => updateGoal('fastingDaysPerMonth', v)} />
              </div>
            </Card>

            <Card title="Profils" icon={<Users size={18} />}>
              <div className="grid two">
                <input className="input" placeholder="Nom du profil" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
                <input className="input" placeholder="PIN optionnel" value={newProfilePin} onChange={(e) => setNewProfilePin(e.target.value)} />
              </div>
              <div className="quick-actions">
                <button className="btn primary" onClick={addProfile}><Plus size={16} /> Ajouter un profil</button>
              </div>
              <div className="history-list">
                {profiles.map((profile) => (
                  <div key={profile.id} className="history-item">
                    <div>
                      <strong>{profile.name}</strong>
                      <div className="muted">{profile.pin ? 'Profil protégé par PIN' : 'Sans PIN'}</div>
                    </div>
                    <button className="mini-btn" onClick={() => switchProfile(profile.id)}>Activer</button>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="PWA et installation" icon={<Smartphone size={18} />}>
              <ul className="plain-list">
                <li>Ajoute l’application à l’écran d’accueil depuis le navigateur.</li>
                <li>Le stockage est local et fonctionne hors ligne après installation.</li>
                <li>Le partage WhatsApp est intégré via le texte généré.</li>
                <li>L’export image PNG permet de diffuser le rapport visuellement.</li>
              </ul>
              <button className="btn secondary" onClick={installApp}><Smartphone size={16} /> Installer maintenant</button>
            </Card>
          </div>
        )}
      </main>

      {status ? <div className="status-toast">{status}</div> : null}
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">{icon}<span>{title}</span></div>
      </div>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button type="button" className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <span />
      </button>
    </label>
  );
}

function StatCard({ label, value, goal, unit }) {
  const percent = goal ? Math.min(100, Math.round((Number(value) / Number(goal)) * 100)) : 0;
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <strong>{value} {unit}</strong>
      </div>
      <div className="progress"><span style={{ width: `${percent}%` }} /></div>
      <small>{goal ? `Objectif: ${goal} ${unit}` : 'Sans objectif'}</small>
    </div>
  );
}

function GoalInput({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type="number" min="0" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function LabelValue({ label, value }) {
  return (
    <div className="label-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TargetIcon() {
  return <CheckCircle2 size={18} />;
}

export default App;

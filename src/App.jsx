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

const bibleBookChapters = {
  'Genèse': 50, 'Exode': 40, 'Lévitique': 27, 'Nombres': 36, 'Deutéronome': 34, 'Josué': 24, 'Juges': 21, 'Ruth': 4,
  '1 Samuel': 31, '2 Samuel': 24, '1 Rois': 22, '2 Rois': 25, '1 Chroniques': 29, '2 Chroniques': 36, 'Esdras': 10,
  'Néhémie': 13, 'Esther': 10, 'Job': 42, 'Psaumes': 150, 'Proverbes': 31, 'Ecclésiaste': 12, 'Cantique des cantiques': 8,
  'Ésaïe': 66, 'Jérémie': 52, 'Lamentations': 5, 'Ézéchiel': 48, 'Daniel': 12, 'Osée': 14, 'Joël': 3, 'Amos': 9,
  'Abdias': 1, 'Jonas': 4, 'Michée': 7, 'Nahum': 3, 'Habacuc': 3, 'Sophonie': 3, 'Aggée': 2, 'Zacharie': 14, 'Malachie': 4,
  'Matthieu': 28, 'Marc': 16, 'Luc': 24, 'Jean': 21, 'Actes': 28, 'Romains': 16, '1 Corinthiens': 16, '2 Corinthiens': 13,
  'Galates': 6, 'Éphésiens': 6, 'Philippiens': 4, 'Colossiens': 4, '1 Thessaloniciens': 5, '2 Thessaloniciens': 3,
  '1 Timothée': 6, '2 Timothée': 4, 'Tite': 3, 'Philémon': 1, 'Hébreux': 13, 'Jacques': 5, '1 Pierre': 5, '2 Pierre': 3,
  '1 Jean': 5, '2 Jean': 1, '3 Jean': 1, 'Jude': 1, 'Apocalypse': 22
};

const bibleBooks = Object.keys(bibleBookChapters);
const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

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
const defaultLibraryCatalog = ['De ses lèvres... co-ouvrier', 'Les femmes de la gloire'];

const emptyEntry = () => ({
  id: crypto.randomUUID(),
  profileId: '',
  date: todayISO(),
  meditation: false,
  prayerAlone: false,
  prayerDuration: '',
  bibleReadings: [{ book: '', start: '', end: '' }],
  fasting: false,
  fastingType: '',
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

function safePageRange(start, end) {
  const s = numberValue(start);
  const e = numberValue(end);
  if (!s || !e || e < s) return 0;
  return e - s + 1;
}

function clampChapter(book, chapter) {
  const n = numberValue(chapter);
  if (!n) return '';
  const max = bibleBookChapters[book] || 150;
  return String(Math.min(Math.max(n, 1), max));
}

function safeChapterRange(book, start, end) {
  const s = numberValue(start);
  const e = numberValue(end);
  const max = bibleBookChapters[book] || 0;
  if (!book || !s || !e || !max) return 0;
  if (s > max) return 0;
  const boundedEnd = Math.min(e, max);
  if (boundedEnd < s) return 0;
  return boundedEnd - s + 1;
}

function normalizeTimeInput(value) {
  const clean = String(value || '').replace(/[^\d:]/g, '').slice(0, 5);
  if (!clean) return '';
  if (clean.includes(':')) {
    const [hRaw, mRaw = ''] = clean.split(':');
    const hours = String(Math.min(Number(hRaw || 0), 23)).padStart(2, '0');
    const minutes = String(Math.min(Number(mRaw || 0), 59)).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (clean.length <= 2) return clean;
  return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
}

function timeToMinutes(value) {
  if (!value) return 0;
  if (/^\d+(\.\d+)?$/.test(String(value))) return Math.round(Number(value) * 60);
  const match = String(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return 0;
  return h * 60 + m;
}

function minutesToHHMM(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
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

function monthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-');
  return `${monthNames[Number(month) - 1]} ${year}`;
}

function parseMaybeCount(text) {
  if (!text) return 0;
  const first = String(text).match(/\d+/);
  return first ? Number(first[0]) : 0;
}

function computeBibleTotal(entry) {
  return (entry.bibleReadings || []).reduce((sum, item) => sum + safeChapterRange(item.book, item.start, item.end), 0);
}

function computeLiteratureTotal(entry) {
  return (entry.literatureReadings || []).reduce((sum, item) => sum + safePageRange(item.startPage, item.endPage), 0);
}

function computePrayerMinutes(entry) {
  return timeToMinutes(entry.prayerDuration || entry.prayerDurationHours || '');
}

function reportText(entry, profileName) {
  const bibleLines = (entry.bibleReadings || [])
    .filter((item) => item.book || item.start || item.end)
    .map((item) => {
      const count = safeChapterRange(item.book, item.start, item.end);
      const chapters = item.start && item.end ? `${item.start} à ${clampChapter(item.book, item.end)}` : '';
      return `${item.book}${chapters ? ` ${chapters}` : ''}${count ? ` (${count} chap)` : ''}`;
    });

  const literatureLines = (entry.literatureReadings || [])
    .filter((item) => item.title || item.startPage || item.endPage)
    .map((item) => {
      const count = safePageRange(item.startPage, item.endPage);
      const pages = item.startPage && item.endPage ? `Pg ${item.startPage} à ${item.endPage}` : '';
      return `- ${item.title}${pages ? ` (${pages}` : ''}${count ? ` = ${count} pages)` : pages ? ')' : ''}`;
    });

  const prayer = computePrayerMinutes(entry) ? ` (${minutesToHHMM(computePrayerMinutes(entry))})` : '';
  const fastingInfo = [entry.fasting ? 'oui' : 'non', entry.fastingType || '', entry.fastingDays ? `${entry.fastingDays} jour(s)` : '']
    .filter(Boolean)
    .join(' · ');

  return [
    `CR de ${profileName} du ${formatDateFR(entry.date)}`,
    '',
    `📝 Méditation : ${entry.meditation ? 'oui' : 'non'}`,
    `🙏🏾 Prière seule : ${entry.prayerAlone ? 'oui' : 'non'}${prayer}`,
    `📖 Lecture biblique : ${computeBibleTotal(entry)} chap`,
    bibleLines.length ? bibleLines.join('\n') : 'Aucune lecture biblique saisie',
    '',
    `📚 Littérature chrétienne : ${computeLiteratureTotal(entry)} pages`,
    literatureLines.length ? literatureLines.join('\n') : '- Aucune lecture saisie',
    '',
    `Prière en groupe : ${entry.prayerGroup ? 'oui' : 'non'}`,
    `Jeûne : ${fastingInfo || 'non'}`,
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
      acc.prayerMinutes += computePrayerMinutes(entry);
      acc.bibleChapters += computeBibleTotal(entry);
      acc.literaturePages += computeLiteratureTotal(entry);
      acc.fastingDays += numberValue(entry.fastingDays);
      acc.evangelisation += parseMaybeCount(entry.evangelisationCount);
      acc.days += 1;
      if (entry.meditation) acc.meditationDays += 1;
      if (entry.prayerGroup) acc.pgDays += 1;
      if (entry.confession) acc.confessionDays += 1;
      if (entry.fasting && entry.fastingType === 'Complet') acc.completeFastDays += numberValue(entry.fastingDays) || 1;
      if (entry.fasting && entry.fastingType === 'Partiel') acc.partialFastDays += numberValue(entry.fastingDays) || 1;
      return acc;
    },
    {
      prayerMinutes: 0,
      bibleChapters: 0,
      literaturePages: 0,
      fastingDays: 0,
      evangelisation: 0,
      days: 0,
      meditationDays: 0,
      pgDays: 0,
      confessionDays: 0,
      completeFastDays: 0,
      partialFastDays: 0
    }
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
  const [libraryCatalog, setLibraryCatalog] = useState(defaultLibraryCatalog);
  const [form, setForm] = useState(emptyEntry());
  const [status, setStatus] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [locked, setLocked] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [reportImageUrl, setReportImageUrl] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePin, setNewProfilePin] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [selectedMonthKey, setSelectedMonthKey] = useState(monthKey(todayISO()));
  const [newLibraryBook, setNewLibraryBook] = useState('');

  useEffect(() => {
    (async () => {
      const [savedProfiles, savedEntries, savedGoals, savedActiveId, savedCatalog] = await Promise.all([
        db.getItem('profiles'),
        db.getItem('entries'),
        db.getItem('goals'),
        db.getItem('activeProfileId'),
        db.getItem('libraryCatalog')
      ]);

      const profilesData = Array.isArray(savedProfiles) && savedProfiles.length
        ? savedProfiles
        : [{ id: crypto.randomUUID(), name: 'Jacques A', pin: '', role: 'member', createdAt: new Date().toISOString() }];

      const activeId = savedActiveId || profilesData[0].id;
      setProfiles(profilesData);
      setEntries(Array.isArray(savedEntries) ? savedEntries : []);
      setGoals(savedGoals || defaultGoals);
      setLibraryCatalog(Array.isArray(savedCatalog) && savedCatalog.length ? savedCatalog : defaultLibraryCatalog);
      setActiveProfileId(activeId);
      const profile = profilesData.find((item) => item.id === activeId) || profilesData[0];
      setForm({ ...emptyEntry(), profileId: profile.id });
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
    if (!ready) return;
    db.setItem('libraryCatalog', libraryCatalog);
  }, [libraryCatalog, ready]);

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

  const monthOptions = useMemo(() => {
    const keys = new Set([monthKey(todayISO())]);
    profileEntries.forEach((item) => keys.add(monthKey(item.date)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [profileEntries]);

  useEffect(() => {
    if (!monthOptions.includes(selectedMonthKey)) {
      setSelectedMonthKey(monthOptions[0] || monthKey(todayISO()));
    }
  }, [monthOptions, selectedMonthKey]);

  const currentReportText = useMemo(() => reportText(form, activeProfile?.name || 'Utilisateur'), [form, activeProfile]);
  const currentBackground = useMemo(
    () => defaultBackgrounds.find((bg) => bg.id === form.reportBackgroundId) || defaultBackgrounds[0],
    [form.reportBackgroundId]
  );

  const filteredEntries = useMemo(() => {
    if (!profileEntries.length) return [];
    const today = todayISO();
    if (filterPeriod === 'all') return profileEntries;
    if (filterPeriod === 'month') return profileEntries.filter((item) => monthKey(item.date) === selectedMonthKey);
    const currentWeek = weekStart(today).toISOString().slice(0, 10);
    return profileEntries.filter((item) => weekStart(item.date).toISOString().slice(0, 10) === currentWeek);
  }, [profileEntries, filterPeriod, selectedMonthKey]);

  const stats = useMemo(() => aggregate(filteredEntries), [filteredEntries]);
  const overallStats = useMemo(() => aggregate(profileEntries), [profileEntries]);
  const monthlyStats = useMemo(() => {
    return monthOptions.map((key) => ({
      key,
      label: monthLabel(key),
      stats: aggregate(profileEntries.filter((item) => monthKey(item.date) === key))
    }));
  }, [monthOptions, profileEntries]);

  const supervisorRows = useMemo(() => {
    return profiles.map((profile) => {
      const personEntries = entries.filter((item) => item.profileId === profile.id);
      return { profile, stats: aggregate(personEntries), lastDate: personEntries.sort((a, b) => b.date.localeCompare(a.date))[0]?.date || '-' };
    });
  }, [profiles, entries]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  }

  function updateBibleReading(index, patch) {
    setForm((prev) => ({
      ...prev,
      bibleReadings: prev.bibleReadings.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if (patch.book !== undefined) {
          next.start = clampChapter(next.book, next.start);
          next.end = clampChapter(next.book, next.end);
        }
        if (patch.start !== undefined) next.start = clampChapter(next.book, patch.start);
        if (patch.end !== undefined) next.end = clampChapter(next.book, patch.end);
        return next;
      }),
      updatedAt: new Date().toISOString()
    }));
  }

  function updateLiteratureReading(index, patch) {
    setForm((prev) => ({
      ...prev,
      literatureReadings: prev.literatureReadings.map((item, i) => (i === index ? { ...item, ...patch } : item)),
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
    setForm({
      ...emptyEntry(),
      ...entry,
      prayerDuration: entry.prayerDuration || (entry.prayerDurationHours ? minutesToHHMM(timeToMinutes(entry.prayerDurationHours)) : ''),
      fastingType: entry.fastingType || ''
    });
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
    downloadBlob(
      'suivi-spirituel-backup.json',
      new Blob([JSON.stringify({ profiles, entries, goals, libraryCatalog }, null, 2)], { type: 'application/json' })
    );
  }

  function exportCsv() {
    const rows = [
      ['Profil', 'Date', 'Meditation', 'Priere', 'Chapitres', 'Pages', 'JeuneJours', 'TypeJeune', 'Evangelisation', 'Prière en groupe', 'Confession', 'Retraite', 'EtudeJC']
    ];
    entries.forEach((entry) => {
      const profileName = profiles.find((p) => p.id === entry.profileId)?.name || 'Inconnu';
      rows.push([
        profileName,
        entry.date,
        entry.meditation ? 'oui' : 'non',
        minutesToHHMM(computePrayerMinutes(entry)),
        computeBibleTotal(entry),
        computeLiteratureTotal(entry),
        numberValue(entry.fastingDays),
        entry.fastingType || '',
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
        if (Array.isArray(parsed.libraryCatalog)) setLibraryCatalog(parsed.libraryCatalog);
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

  function addLibraryBook() {
    const value = newLibraryBook.trim();
    if (!value) return;
    if (libraryCatalog.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setStatus('Ce livre est déjà dans la bibliothèque.');
      return;
    }
    setLibraryCatalog((prev) => [...prev, value].sort((a, b) => a.localeCompare(b, 'fr')));
    setNewLibraryBook('');
    setStatus('Livre ajouté à la bibliothèque.');
  }

  function deleteLibraryBook(title) {
    setLibraryCatalog((prev) => prev.filter((item) => item !== title));
    setForm((prev) => ({
      ...prev,
      literatureReadings: prev.literatureReadings.map((item) => (item.title === title ? { ...item, title: '' } : item))
    }));
    setStatus('Livre retiré de la bibliothèque.');
  }

  if (!ready) return <div className="loading-screen">Chargement de l’application…</div>;

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
            <p>Journal quotidien, tableau de bord, bibliothèque mémorisée, export, partage et supervision locale.</p>
            <div className="hero-actions">
              <button className="btn light" onClick={() => setTab('journal')}>Nouvelle saisie</button>
              <button className="btn secondary" onClick={() => setTab('dashboard')}>Voir les statistiques</button>
            </div>
          </div>
        </div>

        <div className="hero-card compact-card">
          <div className="metric"><span>{profileEntries.length}</span><small>journées</small></div>
          <div className="metric"><span>{overallStats.bibleChapters}</span><small>chapitres</small></div>
          <div className="metric"><span>{minutesToHHMM(overallStats.prayerMinutes)}</span><small>prière</small></div>
          <div className="metric"><span>{overallStats.evangelisation}</span><small>évangélisation</small></div>
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
                <LabelValue label="Prière" value={computePrayerMinutes(form) ? minutesToHHMM(computePrayerMinutes(form)) : '00:00'} />
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
                      <div className="muted">{computeBibleTotal(entry)} chap · {computeLiteratureTotal(entry)} pages · {minutesToHHMM(computePrayerMinutes(entry))}</div>
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
                  <label className="label">Durée de prière (hh:mm)</label>
                  <input
                    className="input"
                    placeholder="Ex: 01:30"
                    value={form.prayerDuration}
                    onChange={(e) => updateField('prayerDuration', normalizeTimeInput(e.target.value))}
                  />
                  <div className="muted inline-note">Format attendu : hh:mm</div>
                </div>
                <Toggle label="Prière en groupe" checked={form.prayerGroup} onChange={(v) => updateField('prayerGroup', v)} />
                <Toggle label="Confession of Sin" checked={form.confession} onChange={(v) => updateField('confession', v)} />
                <Toggle label="Retraite personnelle" checked={form.retreat} onChange={(v) => updateField('retreat', v)} />
                <Toggle label="Étude biblique avec JC" checked={form.bibleStudyJC} onChange={(v) => updateField('bibleStudyJC', v)} />
              </div>
            </Card>

            <Card title="Lecture de la Bible" icon={<BookOpen size={18} />}>
              <div className="stack-sm">
                {form.bibleReadings.map((item, index) => {
                  const maxChapters = bibleBookChapters[item.book] || '';
                  return (
                    <div className="row-card" key={index}>
                      <select className="input" value={item.book} onChange={(e) => updateBibleReading(index, { book: e.target.value })}>
                        <option value="">Choisir un livre</option>
                        {bibleBooks.map((book) => <option key={book} value={book}>{book}</option>)}
                      </select>
                      <div className="grid two">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max={maxChapters || undefined}
                          placeholder="Chap. début"
                          value={item.start}
                          onChange={(e) => updateBibleReading(index, { start: e.target.value })}
                        />
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max={maxChapters || undefined}
                          placeholder="Chap. fin"
                          value={item.end}
                          onChange={(e) => updateBibleReading(index, { end: e.target.value })}
                        />
                      </div>
                      <div className="row between wrap-row">
                        <span className="muted">Total: {safeChapterRange(item.book, item.start, item.end)} chapitre(s)</span>
                        {item.book ? <span className="muted">Max pour {item.book} : {bibleBookChapters[item.book]} chap.</span> : null}
                        <button className="mini-btn danger" onClick={() => removeArrayItem('bibleReadings', index)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
                <div className="row between wrap-row">
                  <strong>Total du jour: {computeBibleTotal(form)} chap</strong>
                  <button className="btn secondary" onClick={() => addArrayItem('bibleReadings', { book: '', start: '', end: '' })}><Plus size={16} /> Ajouter</button>
                </div>
              </div>
            </Card>

            <Card title="Jeûne et mission" icon={<Flame size={18} />}>
              <div className="grid two">
                <Toggle label="Jeûne" checked={form.fasting} onChange={(v) => updateField('fasting', v)} />
                <div>
                  <label className="label">Type de jeûne</label>
                  <select className="input" value={form.fastingType} onChange={(e) => updateField('fastingType', e.target.value)}>
                    <option value="">Choisir</option>
                    <option value="Complet">Jeûne complet</option>
                    <option value="Partiel">Jeûne partiel</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nombre de jours</label>
                  <input className="input" type="number" min="0" step="1" value={form.fastingDays} onChange={(e) => updateField('fastingDays', e.target.value)} />
                </div>
                <div>
                  <label className="label">Évangélisation (ex: 2 ou 2/10)</label>
                  <input className="input" value={form.evangelisationCount} onChange={(e) => updateField('evangelisationCount', e.target.value)} />
                </div>
                <div className="grid-span-2">
                  <label className="label">Précision</label>
                  <input className="input" value={form.evangelisationNote} onChange={(e) => updateField('evangelisationNote', e.target.value)} placeholder="sortie, contacts, maison à maison…" />
                </div>
              </div>
            </Card>

            <Card title="Littérature chrétienne" icon={<Library size={18} />}>
              <div className="stack-sm">
                {form.literatureReadings.map((item, index) => (
                  <div className="row-card" key={index}>
                    <select className="input" value={item.title} onChange={(e) => updateLiteratureReading(index, { title: e.target.value })}>
                      <option value="">Choisir un livre de la bibliothèque</option>
                      {libraryCatalog.map((title) => <option key={title} value={title}>{title}</option>)}
                    </select>
                    <div className="grid two">
                      <input className="input" type="number" min="1" placeholder="Page début" value={item.startPage} onChange={(e) => updateLiteratureReading(index, { startPage: e.target.value })} />
                      <input className="input" type="number" min="1" placeholder="Page fin" value={item.endPage} onChange={(e) => updateLiteratureReading(index, { endPage: e.target.value })} />
                    </div>
                    <div className="row between wrap-row">
                      <span className="muted">Total: {safePageRange(item.startPage, item.endPage)} page(s)</span>
                      <button className="mini-btn danger" onClick={() => removeArrayItem('literatureReadings', index)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <div className="row between wrap-row">
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
              {filterPeriod === 'month' ? (
                <div className="month-selector">
                  <label className="label">Mois analysé</label>
                  <select className="input" value={selectedMonthKey} onChange={(e) => setSelectedMonthKey(e.target.value)}>
                    {monthOptions.map((key) => <option key={key} value={key}>{monthLabel(key)}</option>)}
                  </select>
                </div>
              ) : null}
              <div className="grid two">
                <StatCard label="Temps de prière" value={minutesToHHMM(stats.prayerMinutes)} goal={goals.prayerHoursPerWeek} unit="h" compareMinutes />
                <StatCard label="Chapitres bibliques" value={stats.bibleChapters} goal={goals.bibleChaptersPerWeek} unit="chap" />
                <StatCard label="Pages lues" value={stats.literaturePages} goal={goals.literaturePagesPerWeek} unit="pages" />
                <StatCard label="Évangélisation" value={stats.evangelisation} goal={goals.evangelisationPerWeek} unit="actions" />
                <StatCard label="Jours de jeûne" value={stats.fastingDays} goal={goals.fastingDaysPerMonth} unit="jours" />
                <StatCard label="Jours de méditation" value={stats.meditationDays} goal={7} unit="jours" />
              </div>
              <div className="grid two section-top">
                <LabelValue label="Jeûne complet" value={`${stats.completeFastDays} jour(s)`} />
                <LabelValue label="Jeûne partiel" value={`${stats.partialFastDays} jour(s)`} />
              </div>
            </Card>

            <Card title="Statistiques par mois" icon={<CalendarDays size={18} />}>
              <div className="history-list">
                {monthlyStats.map((row) => (
                  <div key={row.key} className="history-item">
                    <div>
                      <strong>{row.label}</strong>
                      <div className="muted">{minutesToHHMM(row.stats.prayerMinutes)} · {row.stats.bibleChapters} chap · {row.stats.literaturePages} pages</div>
                    </div>
                    <div className="muted small-right">Méditation {row.stats.meditationDays} j · Jeûne {row.stats.fastingDays} j</div>
                  </div>
                ))}
                {!monthlyStats.length ? <div className="empty">Aucune donnée mensuelle disponible.</div> : null}
              </div>
            </Card>

            <Card title="Historique du profil" icon={<CalendarDays size={18} />}>
              <div className="history-list">
                {profileEntries.map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div>
                      <strong>{formatDateFR(entry.date)}</strong>
                      <div className="muted">{minutesToHHMM(computePrayerMinutes(entry))} · {computeBibleTotal(entry)} chap · {computeLiteratureTotal(entry)} pages</div>
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
                    <div className="muted small-right">{minutesToHHMM(rowStats.prayerMinutes)} · {rowStats.bibleChapters} chap · {rowStats.evangelisation} évang.</div>
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
              <div className="grid two section-top">
                <input className="input" placeholder="Ajouter un livre à la bibliothèque" value={newLibraryBook} onChange={(e) => setNewLibraryBook(e.target.value)} />
                <button className="btn primary" onClick={addLibraryBook}><Plus size={16} /> Ajouter le livre</button>
              </div>
              <div className="history-list section-top">
                {libraryCatalog.map((title) => {
                  const totalPages = entries.reduce(
                    (sum, entry) => sum + entry.literatureReadings.filter((item) => item.title === title).reduce((s, item) => s + safePageRange(item.startPage, item.endPage), 0),
                    0
                  );
                  return (
                    <div key={title} className="history-item">
                      <div>
                        <strong>{title}</strong>
                        <div className="muted">Total parcouru: {totalPages} pages</div>
                      </div>
                      <button className="mini-btn danger" onClick={() => deleteLibraryBook(title)}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
                {!libraryCatalog.length ? <div className="empty">Aucun livre enregistré dans la bibliothèque.</div> : null}
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

function StatCard({ label, value, goal, unit, compareMinutes = false }) {
  const numericValue = compareMinutes ? timeToMinutes(String(value)) / 60 : Number(value);
  const targetValue = Number(goal);
  const percent = targetValue ? Math.min(100, Math.round((numericValue / targetValue) * 100)) : 0;
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

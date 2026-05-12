from pathlib import Path

APP_PATH = Path("src/App.jsx")
CLIENT_ID = "1056461915937-b3hovlcrt3b3kjf01cjjnuq89bpa0oll.apps.googleusercontent.com"

if not APP_PATH.exists():
    raise SystemExit("Erreur: src/App.jsx introuvable. Lance ce script à la racine du projet.")

text = APP_PATH.read_text(encoding="utf-8")

text = text.replace(
    "const GOOGLE_SCRIPT_ID = 'google-identity-services';\nconst DRIVE_FILE_NAME = 'suivi-spirituel-backup.json';",
    f"const GOOGLE_SCRIPT_ID = 'google-identity-services';\nconst GOOGLE_CLIENT_ID = '{CLIENT_ID}';\nconst DRIVE_FILE_NAME = 'suivi-spirituel-backup.json';"
)

text = text.replace(
    "const defaultCloudConfig = {\n  googleClientId: '',\n  autoBackupOnSave: false,",
    "const defaultCloudConfig = {\n  autoBackupOnSave: false,"
)

old_effect = """  useEffect(() => {
    if (!cloudConfig.googleClientId) return;
    if (window.google?.accounts?.oauth2) {
      setGoogleReady(true);
      return;
    }
    if (document.getElementById(GOOGLE_SCRIPT_ID)) return;
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => setStatus('Impossible de charger la connexion Google.');
    document.head.appendChild(script);
  }, [cloudConfig.googleClientId]);"""

new_effect = """  useEffect(() => {
    if (window.google?.accounts?.oauth2) {
      setGoogleReady(true);
      return;
    }
    if (document.getElementById(GOOGLE_SCRIPT_ID)) return;
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => setStatus('Impossible de charger la connexion Google.');
    document.head.appendChild(script);
  }, []);"""

text = text.replace(old_effect, new_effect)

text = text.replace(
    "if (!window.google?.accounts?.oauth2 || !cloudConfig.googleClientId) return null;",
    "if (!window.google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) return null;"
)
text = text.replace(
    "client_id: cloudConfig.googleClientId,",
    "client_id: GOOGLE_CLIENT_ID,"
)

old_connect = """  async function connectGoogle() {
    try {
      if (!cloudConfig.googleClientId) {
        setStatus('Ajoute d’abord ton Google Client ID dans les réglages cloud.');
        return;
      }
      await requestGoogleAccessToken('consent');
      setStatus('Compte Google connecté.');
    } catch (error) {
      setStatus(`Connexion Google impossible: ${error.message}`);
    }
  }"""

new_connect = """  async function connectGoogle() {
    try {
      if (!googleReady) {
        setStatus('Connexion Google pas encore prête. Recharge la page puis réessaie.');
        return;
      }
      await requestGoogleAccessToken('consent');
      setStatus('Compte Google connecté.');
    } catch (error) {
      setStatus(`Connexion Google impossible: ${error.message}`);
    }
  }"""

text = text.replace(old_connect, new_connect)

old_cloud_block = """            <Card title="Cloud Google Drive" icon={<Settings2 size={18} />}>
              <div className="stack-sm">
                <div>
                  <label className="label">Google Client ID OAuth</label>
                  <input className="input" value={cloudConfig.googleClientId} onChange={(e) => setCloudField('googleClientId', e.target.value.trim())} placeholder="Colle ici le Client ID Google" />
                  <div className="muted inline-note">À créer dans Google Cloud Console. Type recommandé: application Web, avec ton domaine Vercel autorisé.</div>
                </div>
                <Toggle label="Sauvegarder automatiquement après chaque enregistrement" checked={cloudConfig.autoBackupOnSave} onChange={(v) => setCloudField('autoBackupOnSave', v)} />
                <div className="grid two">
                  <LabelValue label="État Google" value={googleEmail || (googleToken ? 'Connecté' : googleReady ? 'Prêt à connecter' : 'Script non chargé')} />
                  <LabelValue label="Dernière sauvegarde Drive" value={formatDateTimeFR(cloudConfig.lastCloudBackupAt)} />
                </div>
                <div className="quick-actions">
                  {!googleToken ? (
                    <button className="btn primary" onClick={connectGoogle} disabled={!cloudConfig.googleClientId || !googleReady}><LogIn size={16} /> Se connecter avec Google</button>
                  ) : (
                    <button className="btn secondary" onClick={disconnectGoogle}><LogOut size={16} /> Déconnecter Google</button>
                  )}
                  <button className="btn secondary" onClick={uploadBackupToDrive} disabled={!cloudConfig.googleClientId || cloudBusy}><Upload size={16} /> Sauvegarder maintenant</button>
                  <button className="btn secondary" onClick={restoreBackupFromDrive} disabled={!cloudConfig.googleClientId || cloudBusy}><Download size={16} /> Restaurer depuis Drive</button>
                  <button className="btn secondary" onClick={connectGoogle} disabled={!cloudConfig.googleClientId || cloudBusy}><RefreshCcw size={16} /> Rafraîchir la session</button>
                </div>
                <ol className="plain-list numbered-list">
                  <li>Créer un projet Google Cloud.</li>
                  <li>Activer Google Drive API.</li>
                  <li>Créer un OAuth Client ID de type Web.</li>
                  <li>Ajouter ton domaine Vercel dans les origines JavaScript autorisées.</li>
                  <li>Coller le Client ID ici puis se connecter.</li>
                </ol>
              </div>
            </Card>"""

new_cloud_block = """            <Card title="Cloud Google Drive" icon={<Settings2 size={18} />}>
              <div className="stack-sm">
                <div className="info-box">
                  <strong>Connexion Google intégrée</strong>
                  <div className="muted inline-note">
                    Le Client ID OAuth est déjà configuré dans l’application. Chaque utilisateur doit simplement se connecter avec son propre compte Google.
                  </div>
                </div>
                <Toggle label="Sauvegarder automatiquement après chaque enregistrement" checked={cloudConfig.autoBackupOnSave} onChange={(v) => setCloudField('autoBackupOnSave', v)} />
                <div className="grid two">
                  <LabelValue label="État Google" value={googleEmail || (googleToken ? 'Connecté' : googleReady ? 'Prêt à connecter' : 'Script non chargé')} />
                  <LabelValue label="Dernière sauvegarde Drive" value={formatDateTimeFR(cloudConfig.lastCloudBackupAt)} />
                </div>
                <div className="quick-actions">
                  {!googleToken ? (
                    <button className="btn primary" onClick={connectGoogle} disabled={!googleReady}><LogIn size={16} /> Se connecter avec Google</button>
                  ) : (
                    <button className="btn secondary" onClick={disconnectGoogle}><LogOut size={16} /> Déconnecter Google</button>
                  )}
                  <button className="btn secondary" onClick={uploadBackupToDrive} disabled={cloudBusy}><Upload size={16} /> Sauvegarder maintenant</button>
                  <button className="btn secondary" onClick={restoreBackupFromDrive} disabled={cloudBusy}><Download size={16} /> Restaurer depuis Drive</button>
                  <button className="btn secondary" onClick={connectGoogle} disabled={cloudBusy || !googleReady}><RefreshCcw size={16} /> Rafraîchir la session</button>
                </div>
                <ol className="plain-list numbered-list">
                  <li>Cliquer sur “Se connecter avec Google”.</li>
                  <li>Autoriser l’accès demandé.</li>
                  <li>Cliquer sur “Sauvegarder maintenant”.</li>
                  <li>Activer l’auto-sauvegarde pour sécuriser chaque journée.</li>
                </ol>
              </div>
            </Card>"""

if old_cloud_block in text:
    text = text.replace(old_cloud_block, new_cloud_block)
else:
    print("Attention: bloc Cloud exact introuvable; les autres changements ont été appliqués.")

APP_PATH.write_text(text, encoding="utf-8")
print("OK: src/App.jsx a été mis à jour avec le Client ID Google intégré.")

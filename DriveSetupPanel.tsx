import React, { useState } from 'react';
import { useThanal } from './ThanalContext';
import { Copy, CheckCircle, FolderOpen, Link2, AlertCircle } from 'lucide-react';

const APPS_SCRIPT = `// THANAL photo drop box. Paste your Drive folder ID below.
const FOLDER_ID = 'PASTE_YOUR_FOLDER_ID_HERE';

function doGet() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    return out_({ ok: true, folder: folder.getName() });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const root = DriveApp.getFolderById(FOLDER_ID);
    const folder = sub_(sub_(root, d.volunteer), String(d.year));
    const blob = Utilities.newBlob(Utilities.base64Decode(d.data), d.mimeType || 'image/jpeg', d.fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return out_({ ok: true, id: file.getId(), url: file.getUrl() });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function sub_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;

export const DriveSetupPanel: React.FC = () => {
  const { driveSettings, saveDriveSettings, testDriveConnection } = useThanal();
  const [scriptUrl, setScriptUrl] = useState(driveSettings?.scriptUrl || '');
  const [folderUrl, setFolderUrl] = useState(driveSettings?.folderUrl || '');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMsg({ ok: false, text: 'Copy failed. Press and hold the code to select and copy it.' });
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setMsg(null);
    const r = await testDriveConnection(scriptUrl);
    setMsg({ ok: r.success, text: r.message });
    setBusy(false);
  };

  const handleSave = async () => {
    setBusy(true);
    setMsg(null);
    const r = await saveDriveSettings(scriptUrl, folderUrl);
    setMsg({ ok: r.success, text: r.message });
    setBusy(false);
  };

  const steps = [
    'In Google Drive, create a folder for your unit (for example “THANAL Unit 141”). Open it and copy the long ID at the end of the web address, after /folders/.',
    'Go to script.google.com and tap New project. Delete the sample code, paste the script below, and replace PASTE_YOUR_FOLDER_ID_HERE with your folder ID. Tap Save.',
    'Tap Deploy → New deployment → the gear icon → Web app. Set “Execute as” to Me and “Who has access” to Anyone. Tap Deploy and approve the permissions.',
    'Copy the Web app URL (it ends with /exec) and paste it below. Tap Test connection, then Save.',
    'To let other VSs of your unit open the photos, share the Drive folder with their Google accounts.',
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-green-700 uppercase tracking-widest">
          <FolderOpen className="w-4 h-4" />
          Google Drive Setup
        </div>
        <h2 className="text-xl font-bold text-stone-900 mt-1">Connect your unit&apos;s Drive</h2>
        <p className="text-sm text-stone-600 mt-1">
          Volunteers&apos; planting photos will upload straight into a folder in your Google Drive. You only do this once
          per unit.
        </p>

        <div
          className={`mt-4 flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2 ${
            driveSettings ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {driveSettings ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {driveSettings ? 'Connected. Volunteers can upload.' : 'Not connected yet.'}
        </div>

        <ol className="mt-5 space-y-3">
          {steps.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm text-stone-700 leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-stone-900">Script to paste (step 2)</h3>
          <button
            onClick={copyScript}
            className="px-3 py-1.5 bg-green-800 hover:bg-green-900 text-white rounded-full text-xs font-semibold flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy script'}
          </button>
        </div>
        <pre className="mt-3 max-h-64 overflow-auto bg-stone-900 text-stone-100 text-[11px] leading-relaxed p-4 rounded-xl whitespace-pre">
          {APPS_SCRIPT}
        </pre>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-green-700" />
          Connect
        </h3>
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Web app URL (ends with /exec)</label>
          <input
            type="url"
            value={scriptUrl}
            onChange={(e) => setScriptUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Drive folder link (optional, for your reference)</label>
          <input
            type="url"
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>

        {msg && (
          <div
            className={`text-xs rounded-xl px-3 py-2 border ${
              msg.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleTest}
            disabled={busy || !scriptUrl}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 rounded-full text-xs font-semibold border border-stone-300"
          >
            Test connection
          </button>
          <button
            onClick={handleSave}
            disabled={busy || !scriptUrl}
            className="px-4 py-2 bg-green-800 hover:bg-green-900 disabled:opacity-50 text-white rounded-full text-xs font-semibold"
          >
            Save
          </button>
          {folderUrl && (
            <a
              href={folderUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-green-800 hover:underline text-xs font-semibold"
            >
              Open Drive folder
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AIModelSettings } from '../types/trading';

interface AIModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AIModelSettings;
  onSaveSettings: (settings: AIModelSettings) => void;
}

export const AIModelConfigModal: React.FC<AIModelConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AIModelSettings>(settings);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string; latency?: number }>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async (provider: 'freellm' | 'mistral' | 'openai' | 'gemini') => {
    setTestingProvider(provider);
    try {
      const body: any = { provider };
      if (provider === 'freellm') {
        body.baseUrl = formData.freeLlmUrl;
        body.apiKey = formData.freeLlmKey;
      } else if (provider === 'mistral') {
        body.apiKey = formData.mistralKey;
      } else if (provider === 'openai') {
        body.apiKey = formData.openaiKey;
      }

      const res = await fetch('/api/council/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            ok: true,
            msg: `Connected (${data.latencyMs}ms)`,
            latency: data.latencyMs,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            ok: false,
            msg: data.error || 'Connection failed',
          },
        }));
      }
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          ok: false,
          msg: e.message || 'Network error',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Models & FreeLLM Council Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live API connections for the 4-AI Council. Zero dummy data or mock fallbacks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* 1. FreeLLM API Section */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>FreeLLM API / Open Model</span>
                </h3>
                <span className="text-[11px] text-slate-400">OpenAI-compatible local or remote endpoint</span>
              </div>
              <button
                type="button"
                onClick={() => handleTest('freellm')}
                disabled={testingProvider === 'freellm'}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono text-[11px] cursor-pointer"
              >
                {testingProvider === 'freellm' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">FreeLLM Base URL</label>
              <input
                type="text"
                value={formData.freeLlmUrl}
                onChange={(e) => setFormData({ ...formData, freeLlmUrl: e.target.value })}
                placeholder="http://localhost:8000/v1 or https://your-freellm-host.com/v1"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">API Key (Optional for local)</label>
                <input
                  type="password"
                  value={formData.freeLlmKey}
                  onChange={(e) => setFormData({ ...formData, freeLlmKey: e.target.value })}
                  placeholder="Bearer token or sk-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Model ID</label>
                <input
                  type="text"
                  value={formData.freeLlmModel}
                  onChange={(e) => setFormData({ ...formData, freeLlmModel: e.target.value })}
                  placeholder="llama-3.3-70b-instruct"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {testResults.freellm && (
              <div className={`text-[11px] font-mono ${testResults.freellm.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {testResults.freellm.ok ? '✓ ' : '✗ '}{testResults.freellm.msg}
              </div>
            )}
          </div>

          {/* 2. Google Gemini 3.8 Flash Section */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Google Gemini 3.8 Flash</span>
                </h3>
                <span className="text-[11px] text-slate-400">Server-side managed via @google/genai</span>
              </div>
              <button
                type="button"
                onClick={() => handleTest('gemini')}
                disabled={testingProvider === 'gemini'}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono text-[11px] cursor-pointer"
              >
                {testingProvider === 'gemini' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Injected automatically via GEMINI_API_KEY environment credentials.
            </p>
            {testResults.gemini && (
              <div className={`text-[11px] font-mono ${testResults.gemini.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {testResults.gemini.ok ? '✓ ' : '✗ '}{testResults.gemini.msg}
              </div>
            )}
          </div>

          {/* 3. Mistral AI Section */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Mistral AI</span>
                </h3>
                <span className="text-[11px] text-slate-400">Direct connection via api.mistral.ai</span>
              </div>
              <button
                type="button"
                onClick={() => handleTest('mistral')}
                disabled={testingProvider === 'mistral'}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono text-[11px] cursor-pointer"
              >
                {testingProvider === 'mistral' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mistral API Key</label>
                <input
                  type="password"
                  value={formData.mistralKey}
                  onChange={(e) => setFormData({ ...formData, mistralKey: e.target.value })}
                  placeholder="mistral-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Model Version</label>
                <select
                  value={formData.mistralModel}
                  onChange={(e) => setFormData({ ...formData, mistralModel: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
                >
                  <option value="mistral-small-latest">mistral-small-latest</option>
                  <option value="mistral-large-latest">mistral-large-latest</option>
                </select>
              </div>
            </div>

            {testResults.mistral && (
              <div className={`text-[11px] font-mono ${testResults.mistral.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {testResults.mistral.ok ? '✓ ' : '✗ '}{testResults.mistral.msg}
              </div>
            )}
          </div>

          {/* 4. OpenAI Section */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>OpenAI / Compatible</span>
                </h3>
                <span className="text-[11px] text-slate-400">api.openai.com</span>
              </div>
              <button
                type="button"
                onClick={() => handleTest('openai')}
                disabled={testingProvider === 'openai'}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono text-[11px] cursor-pointer"
              >
                {testingProvider === 'openai' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={formData.openaiKey}
                  onChange={(e) => setFormData({ ...formData, openaiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Model Version</label>
                <select
                  value={formData.openaiModel}
                  onChange={(e) => setFormData({ ...formData, openaiModel: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                </select>
              </div>
            </div>

            {testResults.openai && (
              <div className={`text-[11px] font-mono ${testResults.openai.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {testResults.openai.ok ? '✓ ' : '✗ '}{testResults.openai.msg}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Credentials are saved in your local browser session.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
              >
                Save & Apply Configuration
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

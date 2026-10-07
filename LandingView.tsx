import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useThanal } from './ThanalContext';
import { calculateThanalWindow } from './thanalWindow';
import campusImg from './campus.jpg';
import logo from './logo.png';
import { Sprout, Users, ArrowRight, Leaf, CalendarDays, Camera, BadgeCheck } from 'lucide-react';

interface LandingViewProps {
  onOpenLogin: () => void;
  onOpenVolRegister: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenLogin,
  onOpenVolRegister,
}) => {
  const { units } = useThanal();
  const [stats, setStats] = useState<{
    volunteers: number;
    trees: number;
    units: { code: string; volunteers: number; trees: number }[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('public_stats').then(({ data, error }) => {
      if (!cancelled && !error && data) setStats(data as any);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const [testDob, setTestDob] = useState('2004-10-20');
  const previewWindow = calculateThanalWindow(testDob, 2026);

  const steps = [
    { icon: CalendarDays, title: 'Get your window', text: 'Your birthday sets a 21-day tree planting window each year.' },
    { icon: Sprout, title: 'Plant a sapling', text: 'Prepare the pit, plant, and note the species and location.' },
    { icon: Camera, title: 'Upload evidence', text: 'Submit a photo of your planting for verification.' },
    { icon: BadgeCheck, title: 'Get verified', text: 'Your unit VS checks the tag and marks it complete.' },
  ];

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-green-950 via-green-900 to-green-800 text-white">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-lime-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-wide text-lime-200">
              <Leaf className="w-3.5 h-3.5" />
              AN INITIATIVE OF THE NRPF
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              THANAL
              <span className="block text-lg sm:text-2xl font-semibold text-lime-300 mt-1">
                Tree Planting &amp; Monitoring System
              </span>
            </h1>
            <p className="text-green-100 text-sm sm:text-base leading-relaxed max-w-xl">
              THANAL is an initiative of the <strong className="text-white">NRPF (Natural Resource Protection Force)</strong>.
              Every NSS volunteer plants a tree within a 21-day window around their birthday, and every planting is
              tracked from sapling to verified tag.
            </p>
            <p className="text-lime-200 text-sm font-medium">“നാളേക്കായി തണലേകാം”</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenVolRegister}
                className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-green-950 rounded-full text-sm font-bold transition-colors shadow-lg flex items-center gap-2"
              >
                Register as Volunteer
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenLogin}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full text-sm font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-lime-300/20 blur-2xl" aria-hidden="true" />
              <img
                src={logo}
                alt="THANAL NRPF logo"
                className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full ring-8 ring-white/15 shadow-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-3 bg-white rounded-2xl shadow-lg border border-stone-200 divide-x divide-stone-200">
          {[
            { n: units.length, l: 'NSS Units' },
            { n: stats ? stats.volunteers : '–', l: 'Volunteers' },
            { n: stats ? stats.trees : '–', l: 'Trees Planted' },
          ].map((x) => (
            <div key={x.l} className="py-5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-green-800">{x.n}</div>
              <div className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About NRPF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200 aspect-video">
          <img src={campusImg} alt="Tree plantation avenue on campus" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-3">
          <div className="text-xs font-bold text-green-700 uppercase tracking-widest">About</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Protecting natural resources, one tree at a time</h2>
          <p className="text-stone-600 text-sm leading-relaxed">
            The <strong className="text-stone-900">Natural Resource Protection Force (NRPF)</strong> works to protect and
            restore our natural resources. <strong className="text-stone-900">THANAL</strong> is its tree planting
            initiative, run with NSS Units 141, 257 and 265 of Government College of Engineering Kannur.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <h2 className="text-2xl font-bold text-stone-900 text-center">How it works</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((st, i) => (
            <div key={st.title} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 flex items-center justify-center">
                  <st.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-stone-300">0{i + 1}</span>
              </div>
              <h3 className="mt-3 font-bold text-stone-900 text-sm">{st.title}</h3>
              <p className="mt-1 text-xs text-stone-600 leading-relaxed">{st.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Window calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-xs font-bold text-green-700 uppercase tracking-widest">21-Day Window</div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">Find your planting window</h2>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              10 days before your birthday, your birthday, and 10 days after: 21 days to plant your tree.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
            <label className="block text-xs font-semibold text-stone-700">Your birthday</label>
            <input
              type="date"
              value={testDob}
              onChange={(e) => setTestDob(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
            />
            {previewWindow && (
              <div>
                <div className="text-[11px] text-stone-500">Your 2026 window</div>
                <div className="text-base font-bold text-green-900 font-mono">
                  {previewWindow.startDate} to {previewWindow.endDate}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Two tiers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <h2 className="text-2xl font-bold text-stone-900 text-center">Who takes part</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-green-800 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Volunteer Secretary (VS)</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Leads a unit. Approves volunteer registrations, reviews planting photos and verifies tree tags. Each unit has its own VS login.
            </p>
            <button onClick={onOpenLogin} className="text-sm font-semibold text-green-800 hover:text-green-600 flex items-center gap-1">
              VS Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-lime-500 text-green-950 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Volunteer</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Gets a reminder when the 21-day window opens, plants a sapling and uploads photo evidence.
            </p>
            <button onClick={onOpenVolRegister} className="text-sm font-semibold text-green-800 hover:text-green-600 flex items-center gap-1">
              Register as Volunteer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <h2 className="text-2xl font-bold text-stone-900 text-center">NSS Units</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((u) => {
            const uStat = stats?.units.find((x) => String(x.code) === String(u.code));
            const uVols = { length: uStat ? uStat.volunteers : 0 };
            const uSubs = { length: uStat ? uStat.trees : 0 };
            return (
              <div key={u.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-green-800 bg-green-100 px-2.5 py-1 rounded-full">{u.code}</span>
                  <span className="text-[11px] text-stone-400">{u.district}</span>
                </div>
                <div className="mt-3 font-semibold text-stone-900 text-sm">{u.name}</div>
                <div className="text-xs text-stone-500">{u.college}</div>
                <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between text-xs text-stone-600">
                  <span>{uVols.length} Volunteers</span>
                  <span>{uSubs.length} Trees Planted</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

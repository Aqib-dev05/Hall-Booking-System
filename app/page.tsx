"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  FolderTree, 
  Settings, 
  ShieldCheck, 
  CreditCard, 
  Mail, 
  Calendar, 
  FileText, 
  Sparkles,
  Database,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { testDatabaseConnection } from "@/actions";

export default function Home() {
  const [dbLoading, setDbLoading] = useState(false);
  const [dbResult, setDbResult] = useState<{
    success: boolean;
    message: string;
    data?: {
      isConnected: boolean;
      userCount: number;
      dbName?: string;
    };
  } | null>(null);

  const handleTestConnection = async () => {
    setDbLoading(true);
    setDbResult(null);
    try {
      const response = await testDatabaseConnection();
      setDbResult(response);
      if (response.success) {
        toast.success("Database Connection Succeeded!", {
          description: "Next.js server action successfully connected to MongoDB.",
        });
      } else {
        toast.error("Database Connection Offline", {
          description: response.message || "Could not reach MongoDB. Check your environment variables.",
        });
      }
    } catch (error) {
      toast.error("Connection Failed", {
        description: "An unexpected error occurred while executing the server action.",
      });
      setDbResult({
        success: false,
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setDbLoading(false);
    }
  };

  const showDemoToasts = () => {
    toast("Welcome to Elysian Fields!", {
      description: "This is a premium Next.js 14 setup utilizing shadcn/ui and Sonner toast system.",
      action: {
        label: "Awesome",
        onClick: () => toast.success("Glad you like it!"),
      },
    });
  };

  const dependencies = [
    { name: "mongoose", category: "Database", desc: "Elegant MongoDB object modeling for Node.js.", icon: Database },
    { name: "next-auth", category: "Security", desc: "Flexible, secure passwordless & credentials authentication.", icon: ShieldCheck },
    { name: "bcryptjs", category: "Security", desc: "Optimized password hashing in pure JavaScript.", icon: ShieldCheck },
    { name: "stripe", category: "Payments", desc: "Premium, secure client/server payment processing APIs.", icon: CreditCard },
    { name: "nodemailer", category: "Emails", desc: "Universal secure email delivery from server environments.", icon: Mail },
    { name: "date-fns", category: "Utilities", desc: "Modern, simple date helper functions for event scheduling.", icon: Calendar },
    { name: "react-hook-form", category: "Forms", desc: "Performant, extensible forms validation engine.", icon: FileText },
    { name: "zod", category: "Validation", desc: "TypeScript-first schema declaration and parsing.", icon: Settings },
    { name: "@hookform/resolvers", category: "Forms", desc: "React Hook Form integration with Zod schemas.", icon: FileText },
    { name: "lucide-react", category: "Design", desc: "Clean, consistent icon set optimized for Next.js.", icon: Sparkles },
    { name: "sonner", category: "Design", desc: "Gorgeous, modern toast notification engine.", icon: Terminal }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-stone-950 to-black text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Premium Header */}
      <header className="border-b border-zinc-800/80 backdrop-blur-md bg-stone-950/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-200 to-amber-200">ELYSIAN FIELDS</span>
              <span className="block text-[10px] text-rose-400 font-semibold tracking-widest uppercase">Luxury Event Venue</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="h-3.5 w-3.5 animate-pulse" /> Active Setup
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Overview and Controls */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 backdrop-blur-sm">
            <div className="absolute top-0 right-0 h-40 w-40 bg-rose-500/10 rounded-full blur-3xl -z-10" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Premium Next.js 14 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">
                Wedding & Event Stack
              </span>
            </h1>
            <p className="text-zinc-400 leading-relaxed max-w-xl text-sm sm:text-base">
              A state-of-the-art framework initialized with Tailwind CSS, TypeScript, shadcn/ui variables, and premium database & payment connectors to build standard-setting booking engines.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Button id="btn-show-toast" onClick={showDemoToasts} className="font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-2">
                <Sparkles className="h-4 w-4" /> Trigger Toast
              </Button>
              <Button id="btn-test-db" variant="outline" onClick={handleTestConnection} disabled={dbLoading} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2">
                <Database className="h-4 w-4" /> {dbLoading ? "Connecting..." : "Test Mongoose Connection"}
              </Button>
            </div>

            {/* DB Test Result Viewer */}
            {dbResult && (
              <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                dbResult.success 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300"
              }`}>
                {dbResult.success ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
                )}
                <div>
                  <h4 className="font-bold text-sm">Server Response:</h4>
                  <p className="text-xs opacity-90 mt-1">{dbResult.message}</p>
                  {dbResult.success && dbResult.data && (
                    <div className="mt-2 text-xs flex gap-4 font-mono opacity-80">
                      <span>Database: {dbResult.data.dbName}</span>
                      <span>Users Count: {dbResult.data.userCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dependencies List */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Layers className="h-5 w-5 text-rose-400" />
              <h2 className="text-xl font-bold tracking-tight">Installed Core Dependencies</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dependencies.map((dep, index) => {
                const IconComponent = dep.icon;
                return (
                  <div key={dep.name} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-rose-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/5 group flex gap-3.5">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all duration-300">
                      <IconComponent className="h-5 w-5 text-zinc-400 group-hover:text-rose-400 transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tracking-wide text-zinc-200">{dep.name}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{dep.category}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{dep.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* Right Column: Directory tree & info */}
        <section className="lg:col-span-5 flex flex-col gap-8">
          
          {/* File Structure Map */}
          <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <FolderTree className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold tracking-tight">Project Architecture</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Standard structured directory layout matching strict component patterns:
            </p>
            <div className="font-mono text-xs text-zinc-300 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 overflow-x-auto leading-relaxed">
              <div className="text-zinc-500">// App Core Structure</div>
              <div className="text-emerald-400">📂 app/ <span className="text-zinc-500">→ App routing & pages</span></div>
              <div className="text-zinc-400">  ├── 📂 fonts/ <span className="text-zinc-500">→ Local custom typography</span></div>
              <div className="text-zinc-400">  ├── 📄 globals.css <span className="text-zinc-500">→ Baseline theme tokens</span></div>
              <div className="text-zinc-400">  ├── 📄 layout.tsx <span className="text-zinc-500">→ Global shell with Toast provider</span></div>
              <div className="text-zinc-400">  └── 📄 page.tsx <span className="text-zinc-500">→ Dashboard interface</span></div>
              
              <div className="text-rose-400 mt-2">📂 components/ <span className="text-zinc-500">→ Reusable UI widgets</span></div>
              <div className="text-zinc-400">  └── 📂 ui/ <span className="text-zinc-500">→ Atomic shadcn elements</span></div>
              <div className="text-zinc-400">      ├── 📄 button.tsx <span className="text-zinc-500">→ Premium interactive button</span></div>
              <div className="text-zinc-400">      └── 📄 sonner.tsx <span className="text-zinc-500">→ Customized toast engine</span></div>

              <div className="text-amber-400 mt-2">📂 lib/ <span className="text-zinc-500">→ Database connection & utilities</span></div>
              <div className="text-zinc-400">  ├── 📄 db.ts <span className="text-zinc-500">→ Cached Mongoose provider</span></div>
              <div className="text-zinc-400">  └── 📄 utils.ts <span className="text-zinc-500">→ Class merging helper `cn`</span></div>

              <div className="text-indigo-400 mt-2">📂 models/ <span className="text-zinc-500">→ Database schemas</span></div>
              <div className="text-zinc-400">  └── 📄 User.ts <span className="text-zinc-500">→ Mongoose user schema</span></div>

              <div className="text-teal-400 mt-2">📂 actions/ <span className="text-zinc-500">→ Server Actions</span></div>
              <div className="text-zinc-400">  └── 📄 index.ts <span className="text-zinc-500">→ Database testing server actions</span></div>

              <div className="text-cyan-400 mt-2">📂 hooks/ <span className="text-zinc-500">→ Custom React Hooks</span></div>
              <div className="text-zinc-400">  └── 📄 useFetch.ts <span className="text-zinc-500">→ Async state fetching hook</span></div>

              <div className="text-fuchsia-400 mt-2">📂 types/ <span className="text-zinc-500">→ TS interface definitions</span></div>
              <div className="text-zinc-400">  └── 📄 index.ts <span className="text-zinc-500">→ Response & session schemas</span></div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/20 flex flex-col gap-4">
            <h3 className="font-bold text-sm tracking-wide text-zinc-300">Project Configuration</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <span className="text-zinc-500 block">Next.js Version</span>
                <span className="font-bold text-zinc-200 mt-1 block">v14.2 (App Router)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <span className="text-zinc-500 block">Styling Core</span>
                <span className="font-bold text-rose-400 mt-1 block">Tailwind CSS v3</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <span className="text-zinc-500 block">shadcn/ui Status</span>
                <span className="font-bold text-amber-400 mt-1 block">Fully Configured</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <span className="text-zinc-500 block">Database</span>
                <span className="font-bold text-emerald-400 mt-1 block">Mongoose Enabled</span>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* Premium Footer */}
      <footer className="border-t border-zinc-800/60 bg-black/40 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Elysian Fields Suite. Designed with rigorous excellence.</p>
          <div className="flex gap-6">
            <a href="https://nextjs.org" target="_blank" className="hover:text-rose-400 transition-colors">Next.js</a>
            <a href="https://tailwindcss.com" target="_blank" className="hover:text-rose-400 transition-colors">Tailwind CSS</a>
            <a href="https://ui.shadcn.com" target="_blank" className="hover:text-rose-400 transition-colors">shadcn/ui</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

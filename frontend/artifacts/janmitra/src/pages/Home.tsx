import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, BookOpen, MessageSquare, LayoutDashboard,
  ArrowRight, Languages, Mic, Users, TrendingUp,
  BadgeCheck, AlertTriangle, Phone, Globe, ChevronRight,
  Building2, Scale, FileText, Landmark
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">

      {/* ── Navbar ── */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-[hsl(224,65%,13%)]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF9933] flex items-center justify-center shadow-md">
              <Landmark className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-xl text-white tracking-tight">JanMitra</span>
              <span className="ml-2 text-xs text-white/50 hidden sm:inline">RBI Policy Assistant</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
              Dashboard
            </Link>
            <Link href="/chatbot" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
              Chatbot
            </Link>
            <Link href="/chatbot">
              <Button className="bg-[#FF9933] hover:bg-[#e88800] text-white border-0 font-semibold gap-2 shadow-lg">
                <MessageSquare className="w-4 h-4" />
                Ask JanMitra
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">

        {/* ── Hero ── */}
        <section className="hero-gradient relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/[0.03] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#FF9933]/[0.06] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          {/* Ashoka Chakra watermark */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
            <svg viewBox="0 0 200 200" className="w-80 h-80" fill="white">
              <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="8"/>
              <circle cx="100" cy="100" r="12" fill="white"/>
              {Array.from({length: 24}).map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const x1 = 100 + 14 * Math.cos(angle);
                const y1 = 100 + 14 * Math.sin(angle);
                const x2 = 100 + 88 * Math.cos(angle);
                const y2 = 100 + 88 * Math.sin(angle);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2.5"/>;
              })}
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
            <div className="max-w-3xl">
              {/* Flag stripe */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-1.5 w-24 overflow-hidden rounded-full">
                  <div className="flex-1 bg-[#FF9933]" />
                  <div className="flex-1 bg-white" />
                  <div className="flex-1 bg-[#138808]" />
                </div>
                <span className="text-white/60 text-sm font-medium tracking-widest uppercase">Reserve Bank of India</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Understand RBI{" "}
                <span className="text-[#FF9933]">Policies</span>{" "}
                in Your Language
              </h1>

              <p className="text-lg md:text-xl text-white/65 max-w-2xl mb-10 leading-relaxed">
                JanMitra simplifies complex RBI circulars and banking regulations into plain language — for farmers, students, MSMEs, and every Indian citizen.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chatbot">
                  <Button size="lg" className="bg-[#FF9933] hover:bg-[#e88800] text-white border-0 font-semibold gap-2 text-base h-13 px-8 shadow-xl">
                    <MessageSquare className="w-5 h-5" />
                    Try AI Chatbot Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/15 font-medium gap-2 text-base h-13 px-8">
                    <LayoutDashboard className="w-5 h-5" />
                    Explore Policies
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
            <svg viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 64 L0 32 Q360 0 720 32 Q1080 64 1440 32 L1440 64 Z" fill="hsl(210, 33%, 98%)" />
            </svg>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="py-10 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "12+", label: "RBI Circulars Indexed", icon: FileText, color: "text-[hsl(224,65%,28%)]" },
                { value: "5", label: "Indian Languages", icon: Languages, color: "text-[#FF9933]" },
                { value: "4", label: "User Profiles", icon: Users, color: "text-[hsl(145,63%,30%)]" },
                { value: "100%", label: "Free to Use", icon: BadgeCheck, color: "text-[hsl(224,65%,28%)]" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 p-5 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who It Helps ── */}
        <section className="py-20 px-6 bg-muted/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#FF9933] mb-3">Tailored for Every Indian</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Who Uses JanMitra?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">The same RBI policy hits farmers, students, and business owners differently. We explain it based on who you are.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Farmers",
                  subtitle: "Kisan Credit Card, Agri Loans",
                  Icon: Users,
                  color: "bg-[hsl(145,63%,95%)] border-[hsl(145,63%,80%)]",
                  iconBg: "bg-[hsl(145,63%,28%)]",
                  textColor: "text-[hsl(145,63%,28%)]",
                  desc: "Understand how new repo rates and priority sector changes affect your farming loans and subsidies."
                },
                {
                  title: "Students",
                  subtitle: "Education Loans, Zero Balance",
                  Icon: BookOpen,
                  color: "bg-blue-50 border-blue-200",
                  iconBg: "bg-[hsl(224,65%,28%)]",
                  textColor: "text-[hsl(224,65%,28%)]",
                  desc: "Know your rights on education loan interest subvention and student banking benefits."
                },
                {
                  title: "MSME Owners",
                  subtitle: "Business Credit, MUDRA",
                  Icon: TrendingUp,
                  color: "bg-orange-50 border-orange-200",
                  iconBg: "bg-[#FF9933]",
                  textColor: "text-[#e88800]",
                  desc: "Stay updated on MSME credit guarantees, startup lending frameworks, and working capital norms."
                },
                {
                  title: "Salaried",
                  subtitle: "Home Loans, Savings Rates",
                  Icon: BadgeCheck,
                  color: "bg-purple-50 border-purple-200",
                  iconBg: "bg-purple-600",
                  textColor: "text-purple-700",
                  desc: "See how home loan rate changes and new digital payment rules impact your day-to-day banking."
                },
              ].map((card) => (
                <div key={card.title} className={`p-6 rounded-2xl border card-glow cursor-default transition-all ${card.color}`}>
                  <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                    <card.Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold mb-1 ${card.textColor}`}>{card.title}</h3>
                  <p className="text-xs font-medium text-muted-foreground mb-3">{card.subtitle}</p>
                  <p className="text-sm text-foreground/70 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Core Features ── */}
        <section className="py-20 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#FF9933] mb-3">Powerful Features</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: MessageSquare,
                  title: "AI-Powered Chatbot",
                  desc: "Ask any RBI-related question in plain English or your local language. Get precise, sourced answers instantly.",
                  accent: "bg-[hsl(224,65%,23%)]",
                },
                {
                  icon: Languages,
                  title: "5 Indian Languages",
                  desc: "Switch between English, Hindi, Tamil, Bengali, and Marathi. Policies explained natively, not just translated.",
                  accent: "bg-[#FF9933]",
                },
                {
                  icon: Mic,
                  title: "Voice Input",
                  desc: "Speak your query — our voice recognition supports all languages. No typing needed for those who prefer to talk.",
                  accent: "bg-[hsl(145,63%,28%)]",
                },
                {
                  icon: TrendingUp,
                  title: "Policy Dashboard",
                  desc: "Visual charts showing policy trends by category, timeline, and sector impact — data that tells the full story.",
                  accent: "bg-purple-600",
                },
                {
                  icon: Users,
                  title: "Personalized Impact",
                  desc: "Set your profile (farmer, student, MSME, salaried) and get explanations tailored specifically to your situation.",
                  accent: "bg-[#FF9933]",
                },
                {
                  icon: ShieldAlert,
                  title: "Fraud Alerts",
                  desc: "Real-time warnings about common banking frauds and RBI-verified tips to keep your money safe.",
                  accent: "bg-red-600",
                },
              ].map((feature) => (
                <div key={feature.title} className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all group card-glow">
                  <div className={`w-12 h-12 ${feature.accent} rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 px-6 bg-[hsl(224,65%,13%)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]">
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#FF9933]" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white" />
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#FF9933] mb-3">Simple Process</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How JanMitra Works</h2>
              <p className="text-white/60 max-w-xl mx-auto">From question to clarity in seconds — no banking expertise required.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "01", icon: Users, title: "Set Your Profile", desc: "Tell us if you're a farmer, student, MSME owner, or salaried worker." },
                { step: "02", icon: MessageSquare, title: "Ask Your Question", desc: "Type or speak your banking question in English or your regional language." },
                { step: "03", icon: Scale, title: "AI Analyzes Policy", desc: "Our AI matches your question to actual RBI circulars and guidelines." },
                { step: "04", icon: BookOpen, title: "Get Clear Answer", desc: "Receive a simple explanation with bullet points and what it means for you." },
              ].map((step, i) => (
                <div key={step.step} className="relative">
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-white/10 z-0">
                      <ChevronRight className="absolute -right-2 -top-2.5 text-white/20 w-5 h-5" />
                    </div>
                  )}
                  <div className="relative z-10 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="text-[#FF9933] text-xs font-bold tracking-widest mb-4">{step.step}</div>
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">{step.title}</h4>
                    <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/chatbot">
                <Button size="lg" className="bg-[#FF9933] hover:bg-[#e88800] text-white border-0 font-semibold gap-2 text-base px-10 shadow-xl">
                  Start for Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Fraud Awareness ── */}
        <section className="py-20 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Stay Protected</p>
                <h2 className="text-3xl font-bold text-foreground">RBI Fraud Awareness</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Phone,
                  title: "RBI Never Calls for OTP",
                  body: "The Reserve Bank of India does not maintain individual accounts and will never call, SMS, or email asking for your PIN, OTP, password, or personal details. Any such request is a scam.",
                  tag: "Critical",
                  tagColor: "bg-red-100 text-red-700",
                  border: "border-l-4 border-l-red-500",
                },
                {
                  icon: AlertTriangle,
                  title: "Beware of Fake Loan Apps",
                  body: "Only borrow from RBI-registered NBFCs and banks. Check the official RBI website for the list of authorized entities before sharing KYC documents or bank details.",
                  tag: "High Risk",
                  tagColor: "bg-orange-100 text-orange-700",
                  border: "border-l-4 border-l-orange-400",
                },
                {
                  icon: Globe,
                  title: "Verify UPI Requests",
                  body: "Ignore requests to 'approve' money via UPI for receiving funds — you never need to enter your UPI PIN to receive payments. Scammers use this trick to drain accounts.",
                  tag: "Common Fraud",
                  tagColor: "bg-yellow-100 text-yellow-700",
                  border: "border-l-4 border-l-yellow-400",
                },
              ].map((alert) => (
                <div key={alert.title} className={`p-6 bg-card rounded-xl border shadow-sm ${alert.border}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <alert.icon className="w-5 h-5 text-red-600" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${alert.tagColor}`}>{alert.tag}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2 text-foreground">{alert.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{alert.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-20 px-6 bg-gradient-to-r from-[hsl(224,65%,18%)] to-[hsl(224,55%,28%)]">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#FF9933]/20 border border-[#FF9933]/30 rounded-full px-4 py-1.5 text-sm font-medium text-[#FF9933] mb-6">
              <Building2 className="w-4 h-4" />
              Powered by RBI Circular Database
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Your Financial Rights,<br />Explained Clearly
            </h2>
            <p className="text-white/65 text-lg mb-10 max-w-2xl mx-auto">
              Stop wondering what the latest RBI decisions mean for you. JanMitra gives you instant, personalized policy insights in your own language.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/chatbot">
                <Button size="lg" className="bg-[#FF9933] hover:bg-[#e88800] text-white border-0 font-semibold gap-2 text-base h-13 px-8 shadow-xl">
                  <MessageSquare className="w-5 h-5" />
                  Start Chatting Now
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white/25 text-white bg-transparent hover:bg-white/10 gap-2 text-base h-13 px-8">
                  <LayoutDashboard className="w-5 h-5" />
                  Browse Policy Data
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[hsl(224,65%,9%)] text-white/50 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF9933] flex items-center justify-center">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">JanMitra</span>
            <span className="text-white/30 text-sm">RBI Policy Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FF9933]" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-[#138808]" />
            <span className="ml-3 text-sm">Democratizing Financial Awareness in India</span>
          </div>
          <p className="text-xs text-white/30">Not affiliated with the Reserve Bank of India</p>
        </div>
      </footer>
    </div>
  );
}

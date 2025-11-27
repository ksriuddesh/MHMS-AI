import React, { useState, useMemo } from 'react';
import { Shield, Sparkles, HeartPulse, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { jsPDF } from 'jspdf';
import AssessmentReport from '../components/AssessmentReport';

const API_BASE = (import.meta as any)?.env?.VITE_API_URL || '';

export default function MHMS() {
  const { moodEntries, assessments, patientProfile } = useData();
  const [showReport, setShowReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReportSection, setShowReportSection] = useState(true);
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  
  // New state variables for feature cards
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingMood, setIsGeneratingMood] = useState(false);
  const [isGeneratingPrivacy, setIsGeneratingPrivacy] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [moodAnalysis, setMoodAnalysis] = useState<string | null>(null);
  const [privacyReport, setPrivacyReport] = useState<string | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [report, setReport] = useState<{
    title: string;
    summary: string;
    assessmentName: string;
    assessmentDate: string;
    score: number;
    maxScore: number;
    severity: string;
    delta: number | null;
    wellnessScore?: number;
    wellnessScoreExplanation?: string;
    overallTrend?: string;
    keyEmotion?: string;
    moodFluctuations?: string;
    insights: string | string[];
    strengths?: string[];
    actions: string[];
  } | null>(null);

  const latestAssessment = useMemo(() => assessments[0] || null, [assessments]);
  const previousAssessment = useMemo(() => assessments[1] || null, [assessments]);
  const recentMood = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeframe);
    return moodEntries.filter(e => new Date(e.date) >= cutoff).reverse();
  }, [moodEntries, timeframe]);

  const callAI = async (prompt: string) => {
    const resp = await fetch(`${API_BASE}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, generationConfig: { temperature: 0.8, topP: 0.9, topK: 40, maxOutputTokens: 1024 } })
    });
    if (!resp.ok) throw new Error(`AI error ${resp.status}`);
    const data = await resp.json();
    return String(data?.text ?? '');
  };

  const generateReport = async () => {
    try {
      console.log('🔵 Starting report generation...');
      setIsGenerating(true);
      setError(null);

      // Require key patient details before generating comprehensive report
      const required = [patientProfile.firstName, patientProfile.lastName, patientProfile.dateOfBirth, patientProfile.gender, patientProfile.patientId];
      console.log('🔵 Patient profile check:', { patientProfile, required });
      
      if (required.some(v => !v || String(v).trim() === '')) {
        console.log('❌ Patient profile incomplete');
        setError('Please complete your Patient Profile (name, DOB, gender, Patient ID) before generating the comprehensive report. Go to /patient-profile to fill details.');
        setIsGenerating(false);
        return;
      }
      
      console.log('✅ Patient profile complete');

      const a = latestAssessment;
      const p = previousAssessment;
      const moods = recentMood.map(e => ({ date: e.date, mood: e.mood, factors: e.factors.join(', ') }));

      const payload = {
        assessment: a ? { name: a.type, date: a.date, score: a.score, maxScore: a.maxScore, severity: a.severity, previousScore: p ? p.score : null } : null,
        moods,
      };

      const userName = `${patientProfile.firstName || 'User'} ${patientProfile.lastName || ''}`.trim();
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toLocaleDateString();
      const endDate = new Date().toLocaleDateString();
      
      const prompt = `Act as a sophisticated and empathetic AI Mental Wellness Analyst. Generate a comprehensive mental health report for ${userName} analyzing their data from ${startDate} to ${endDate} (${timeframe} days).

**Input Data:**
${JSON.stringify(payload, null, 2)}

**Generate a report with these sections:**

1. **Wellness at a Glance**: Overall mood trend, key emotion, wellness score (X/10) with explanation
2. **Deep Dive: Emotional Patterns**: Mood fluctuations analysis, when mood was highest/lowest, recurring themes
3. **Connecting the Dots: Lifestyle & Mood**: At least 2 data-backed insights correlating mood with activities/sleep/triggers
4. **Your Strengths & Bright Spots**: Positive highlights, coping mechanisms observed
5. **Gentle Suggestions**: 2-3 personalized, actionable recommendations based on the data

**Return as JSON with keys:**
- summary: Brief welcoming paragraph (2-3 sentences)
- wellnessScore: number (0-10)
- wellnessScoreExplanation: string
- overallTrend: string (e.g., "stable with positive moments")
- keyEmotion: string
- moodFluctuations: string (when highest/lowest)
- insights: array of 2-3 insight strings connecting lifestyle to mood
- strengths: array of 2-3 positive highlight strings
- actions: array of 2-3 gentle suggestion strings

Be professional, encouraging, and use clear simple language. Focus on patterns and actionable insights.`;

      // Try AI first
      let parsed: any | null = null;
      try {
        const text = await callAI(prompt);
        const match = text.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : JSON.parse(text);
      } catch (_e) {
        parsed = null;
      }

      const score = a ? a.score : 0;
      const maxScore = a ? a.maxScore : 27;
      const severity = a ? a.severity : 'mild';
      const delta = a && p ? a.score - p.score : null;

      // Local deterministic fallback when AI fails
      const localSummary = a
        ? `Your latest ${a.type} score is ${score}/${maxScore} (${severity}). ${delta == null ? '' : `Compared to the previous assessment, your score changed by ${delta > 0 ? '+' : ''}${delta}.`}`
        : 'No recent assessment found. Consider completing an assessment to unlock more insights.';

      const avgMood = recentMood.length
        ? Math.round(recentMood.reduce((s, e) => s + e.mood, 0) / recentMood.length)
        : 0;
      const commonFactors = (() => {
        const counts: Record<string, number> = {};
        recentMood.forEach(e => e.factors.forEach(f => counts[f] = (counts[f] || 0) + 1));
        return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
      })();

      const fallbackInsights = recentMood.length
        ? `Average mood (last 7 days): ${avgMood}/10. Frequent factors: ${commonFactors.join(', ') || '—'}.`
        : 'Not enough mood data to analyze trends yet.';

      const fallbackActions = [
        'Keep a brief daily mood log and note one helpful activity.',
        'Schedule a 10–15 minute walk or stretch most days.',
        'Plan one supportive social check-in this week.',
        'Aim for a consistent bedtime routine.',
      ];

      const finalSummary = parsed?.summary || localSummary;
      const finalInsights = parsed?.insights || fallbackInsights;
      const finalActions = Array.isArray(parsed?.actions) && parsed.actions.length ? parsed.actions.slice(0,5) : fallbackActions;

      console.log('✅ Report data prepared:', { finalSummary, finalInsights, finalActions });

      const reportData = {
        title: 'Comprehensive Mental Wellness Report',
        summary: finalSummary,
        assessmentName: a ? a.type : 'Assessment',
        assessmentDate: a ? a.date : new Date().toISOString().split('T')[0],
        score,
        maxScore,
        severity,
        delta,
        wellnessScore: parsed?.wellnessScore,
        wellnessScoreExplanation: parsed?.wellnessScoreExplanation,
        overallTrend: parsed?.overallTrend,
        keyEmotion: parsed?.keyEmotion,
        moodFluctuations: parsed?.moodFluctuations,
        insights: finalInsights,
        strengths: parsed?.strengths,
        actions: finalActions
      };
      
      console.log('✅ Setting report state:', reportData);
      setReport(reportData);
      console.log('✅ Setting showReport to true');
      setShowReport(true);
      console.log('✅ Report generation complete!');
    } catch (e) {
      console.error(e);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Insights generation
  const generateAIInsights = async () => {
    try {
      setIsGeneratingInsights(true);
      setError(null);

      const a = latestAssessment;
      const moods = recentMood.map(e => ({ date: e.date, mood: e.mood, factors: e.factors.join(', ') }));

      const payload = {
        assessment: a ? { name: a.type, date: a.date, score: a.score, maxScore: a.maxScore, severity: a.severity } : null,
        moods,
        userContext: 'mental health management'
      };

      const prompt = `As an AI mental health assistant, analyze this user data and provide personalized insights: ${JSON.stringify(payload)}\n\nReturn a concise, empathetic response (2-3 sentences) with actionable suggestions for improving mental wellbeing. Focus on positive reinforcement and practical steps.`;

      let insights = '';
      try {
        insights = await callAI(prompt);
      } catch (aiError) {
        // Fallback insights when AI is unavailable
        const avgMood = recentMood.length ? Math.round(recentMood.reduce((s,e)=>s+e.mood,0)/recentMood.length) : 5;
        insights = `Based on your recent activity, your average mood is ${avgMood}/10. ${avgMood >= 7 ? 'Keep up the positive momentum with regular self-care.' : avgMood >= 4 ? 'Consider incorporating small daily activities that bring you joy.' : 'Reach out to supportive people and consider professional guidance if needed.'} Remember, tracking your mental health is a powerful step toward wellbeing.`;
      }
      
      setAiInsights(insights);
      setShowInsightsModal(true);
    } catch (e) {
      console.error(e);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Mood analysis generation
  const generateMoodAnalysis = async () => {
    try {
      setIsGeneratingMood(true);
      setError(null);

      const moods = recentMood.map(e => ({ date: e.date, mood: e.mood, factors: e.factors.join(', ') }));

      const payload = {
        moods,
        analysisType: 'trend analysis and recommendations'
      };

      const prompt = `As a mood analysis expert, analyze this mood data: ${JSON.stringify(payload)}\n\nProvide a brief analysis (2-3 sentences) of mood patterns, triggers, and specific recommendations for mood improvement. Be encouraging and practical.`;

      let analysis = '';
      try {
        analysis = await callAI(prompt);
      } catch (aiError) {
        // Fallback analysis when AI is unavailable
        const counts: Record<string,number> = {};
        recentMood.forEach(e => e.factors.forEach(f => counts[f] = (counts[f]||0)+1));
        const topFactors = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k).join(', ') || 'various factors';
        const trend = recentMood.length >= 3 ? (recentMood[0].mood > recentMood[recentMood.length-1].mood ? 'improving' : recentMood[0].mood < recentMood[recentMood.length-1].mood ? 'declining' : 'stable') : 'stable';
        analysis = `Your mood trend is ${trend} over the selected period. Common factors affecting your mood include: ${topFactors}. Continue tracking daily to identify patterns and consider activities that boost your wellbeing.`;
      }
      
      setMoodAnalysis(analysis);
      setShowMoodModal(true);
    } catch (e) {
      console.error(e);
      setError('Failed to generate mood analysis. Please try again.');
    } finally {
      setIsGeneratingMood(false);
    }
  };

  // Privacy report generation
  const generatePrivacyReport = async () => {
    try {
      setIsGeneratingPrivacy(true);
      setError(null);

      const payload = {
        dataTypes: ['mood entries', 'assessments', 'personal information'],
        privacyFeatures: ['encryption', 'user control', 'data retention'],
        compliance: 'HIPAA-inspired privacy standards'
      };

      const prompt = `As a privacy expert, create a brief report about data privacy: ${JSON.stringify(payload)}\n\nReturn a concise explanation (2-3 sentences) of how user data is protected, what controls users have, and why privacy matters in mental health apps.`;

      let report = '';
      try {
        report = await callAI(prompt);
      } catch (aiError) {
        // Fallback privacy report when AI is unavailable
        report = `Your mental health data is encrypted and stored securely with end-to-end protection. You maintain full control over your information with options to export or delete data at any time. Privacy is paramount in mental health applications, ensuring your sensitive information remains confidential and under your control.`;
      }
      
      setPrivacyReport(report);
      setShowPrivacyModal(true);
    } catch (e) {
      console.error(e);
      setError('Failed to generate privacy report. Please try again.');
    } finally {
      setIsGeneratingPrivacy(false);
    }
  };

  const Progress = ({ value, max }: { value: number; max: number }) => {
    const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
    return (
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)' }} />
      </div>
    );
  };

  const MoodSparkline = () => {
    const points = recentMood.map((e, i) => `${i * 40},${100 - e.mood * 9}`);
    return (
      <svg viewBox={`0 0 ${Math.max(0, (recentMood.length - 1) * 40)} 100`} className="w-full h-24">
        <polyline fill="none" stroke="#6366f1" strokeWidth="3" points={points.join(' ')} />
      </svg>
    );
  };

  const downloadReport = () => {
    if (!report) return;

    const latest = assessments?.[0] || null;
    const previous = assessments?.[1] || null;
    const recentMood = (() => {
      const days = 7; const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      return (moodEntries || []).filter((e: any) => new Date(e.date) >= cutoff).slice(-30);
    })();

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // Header
    doc.setFillColor(67, 56, 202);
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Comprehensive Medical Report', pageWidth/2, 48, { align: 'center' });

    // Metadata
    y = 100; doc.setTextColor(31,41,55); doc.setFont('helvetica','normal'); doc.setFontSize(10);
    const rid = `RPT-${Date.now()}`; doc.text(`Report ID: ${rid}`, margin, y);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 200, y);
    y += 12; doc.text(`Timeframe: Last ${timeframe} days`, margin, y);

    // Patient block
    y += 20; doc.setFillColor(248,250,252); doc.rect(margin, y, pageWidth - 2*margin, 100, 'F');
    doc.setDrawColor(226,232,240); doc.rect(margin, y, pageWidth - 2*margin, 100, 'S');
    y += 20; doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('Patient Information', margin + 12, y);
    y += 18; doc.setFont('helvetica','normal'); doc.setFontSize(11);
    const fullName = `${patientProfile.firstName || ''} ${patientProfile.lastName || ''}`.trim() || '—';
    doc.text(`Name: ${fullName}`, margin + 12, y); doc.text(`DOB: ${patientProfile.dateOfBirth || '—'}`, margin + 260, y); y += 14;
    doc.text(`Gender: ${patientProfile.gender || '—'}`, margin + 12, y); doc.text(`Patient ID: ${patientProfile.patientId || '—'}`, margin + 260, y); y += 14;
    doc.text(`Phone: ${patientProfile.phone || '—'}`, margin + 12, y); doc.text(`Email: ${patientProfile.email || '—'}`, margin + 260, y); y += 14;
    const addr = [patientProfile.addressLine1, patientProfile.addressLine2].filter(Boolean).join(', ');
    const city = [patientProfile.city, patientProfile.state, patientProfile.zip].filter(Boolean).join(', ');
    doc.text(`Address: ${addr || '—'}`, margin + 12, y); y += 14; doc.text(`City/State/ZIP: ${city || '—'}`, margin + 12, y);

    // Executive summary from state
    y += 24; doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.setFontSize(13); doc.text('Executive Summary', margin, y);
    y += 16; doc.setTextColor(31,41,55); doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text(doc.splitTextToSize(report.summary, pageWidth - 2*margin), margin, y); y += 40;

    // Assessment overview
    doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Assessment Overview', margin, y); y += 16;
    doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
    if (latest) {
      const delta = previous ? latest.score - previous.score : null;
      doc.text(`Instrument: ${latest.type}`, margin, y); doc.text(`Date: ${new Date(latest.date).toLocaleDateString()}`, margin + 220, y); y += 14;
      doc.text(`Score: ${latest.score}/${latest.maxScore} (${latest.severity})`, margin, y);
      if (delta !== null) doc.text(`Change since previous: ${delta > 0 ? '+' : ''}${delta}`, margin + 220, y);
      y += 22;
    } else { doc.text('No recent assessment available.', margin, y); y += 22; }

    // App-wide aggregated assessments (no per-question details in MHMS)
    {
      const items = (assessments || []).slice(0, 6);
      doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Assessments Summary (last 6)', margin, y); y += 16;
      doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
      if (!items.length) {
        doc.text('No assessments recorded yet.', margin, y); y += 20;
      } else {
        // Table header
        const colX = [margin, margin+120, margin+260, margin+360, margin+460];
        const header = ['Date','Instrument','Score','Severity','Δ vs prev'];
        doc.setFont('helvetica','bold');
        header.forEach((h, i) => doc.text(h, colX[i], y));
        y += 12; doc.setDrawColor(226,232,240); doc.line(margin, y, pageWidth - margin, y); y += 10;
        doc.setFont('helvetica','normal');
        for (let i=0;i<items.length;i++) {
          if (y > pageHeight - 80) { doc.addPage(); y = margin; }
          const it = items[i];
          const prev = (assessments || [])[i+1] || null;
          const delta = prev ? it.score - prev.score : null;
          doc.text(new Date(it.date).toLocaleDateString(), colX[0], y);
          doc.text(String(it.type), colX[1], y);
          doc.text(`${it.score}/${it.maxScore}`, colX[2], y);
          doc.text(String(it.severity), colX[3], y);
          doc.text(delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}`, colX[4], y);
          y += 16;
        }
        y += 10;
      }
    }

    // Wellness at a Glance
    if (report.wellnessScore || report.overallTrend || report.keyEmotion) {
      doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Wellness at a Glance', margin, y); y += 16;
      doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
      if (report.overallTrend) { doc.text(`Overall Trend: ${report.overallTrend}`, margin, y); y += 14; }
      if (report.keyEmotion) { doc.text(`Key Emotion: ${report.keyEmotion}`, margin, y); y += 14; }
      if (report.wellnessScore) { 
        doc.text(`Wellness Score: ${report.wellnessScore}/10`, margin, y); y += 14;
        if (report.wellnessScoreExplanation) {
          doc.text(doc.splitTextToSize(report.wellnessScoreExplanation, pageWidth - 2*margin), margin + 10, y); y += 20;
        }
      }
      y += 10;
    }
    
    // Deep Dive: Emotional Patterns
    if (report.moodFluctuations) {
      doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Deep Dive: Emotional Patterns', margin, y); y += 16;
      doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
      doc.text(doc.splitTextToSize(report.moodFluctuations, pageWidth - 2*margin), margin, y); y += 30;
    }
    
    // Connecting the Dots: Lifestyle & Mood
    doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Connecting the Dots: Lifestyle & Mood', margin, y); y += 16;
    doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
    const insightsArray = Array.isArray(report.insights) ? report.insights : [report.insights];
    insightsArray.forEach((insight: string, i: number) => {
      doc.text(`${i+1}. ${insight}`, margin, y); y += doc.splitTextToSize(insight, pageWidth - 2*margin - 20).length * 14 + 8;
    });
    y += 10;
    
    // Mood trend sparkline
    if (recentMood.length > 1) {
      const chartWidth = 200; const chartHeight = 60; const chartX = margin; const chartY = y;
      doc.setDrawColor(226,232,240); doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('Mood Trend', chartX, chartY - 5);
      doc.setDrawColor(67,56,202); doc.setLineWidth(2);
      const points = recentMood.map((e:any,i:number) => ({
        x: chartX + (i / (recentMood.length - 1)) * chartWidth,
        y: chartY + chartHeight - (e.mood / 10) * chartHeight
      }));
      for (let i=0; i<points.length-1; i++) {
        doc.line(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
      }
      doc.setLineWidth(0.5);
      y += chartHeight + 20;
    }
    
    // Assessment score sparkline
    if (assessments.length > 1) {
      const chartWidth = 200; const chartHeight = 60; const chartX = margin + 250; const chartY = y - chartHeight - 20;
      doc.setDrawColor(226,232,240); doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('Assessment Scores', chartX, chartY - 5);
      doc.setDrawColor(236,72,153); doc.setLineWidth(2);
      const items = assessments.slice(0,10).reverse();
      const maxS = Math.max(...items.map((a:any)=>a.maxScore));
      const points = items.map((a:any,i:number) => ({
        x: chartX + (i / (items.length - 1)) * chartWidth,
        y: chartY + chartHeight - (a.score / maxS) * chartHeight
      }));
      for (let i=0; i<points.length-1; i++) {
        doc.line(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
      }
      doc.setLineWidth(0.5);
    }
    y += 10;
    
    // Your Strengths & Bright Spots
    if (report.strengths && report.strengths.length) {
      doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Your Strengths & Bright Spots', margin, y); y += 16;
      doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
      report.strengths.forEach((strength: string, i: number) => {
        doc.text(`• ${strength}`, margin, y); y += doc.splitTextToSize(strength, pageWidth - 2*margin - 20).length * 14 + 8;
      });
      y += 10;
    }

    // Gentle Suggestions for You
    doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Gentle Suggestions for You', margin, y); y += 16;
    doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
    report.actions.forEach((a, i) => { 
      doc.text(`${i+1}. ${a}`, margin, y); 
      y += doc.splitTextToSize(a, pageWidth - 2*margin - 20).length * 14 + 8;
    });
    
    // Disclaimer
    if (y > pageHeight - 150) { doc.addPage(); y = margin; }
    y += 20;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(220,38,38);
    doc.text('Important Disclaimer', margin, y); y += 16;
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(107,114,128);
    const disclaimer = 'This is an AI-generated report for informational purposes only. It is not a medical diagnosis. For health concerns, please consult a qualified healthcare professional. Your data is encrypted and remains under your control.';
    doc.text(doc.splitTextToSize(disclaimer, pageWidth - 2*margin), margin, y); y += 40;

    // Signatures
    if (y > pageHeight - 120) { doc.addPage(); y = margin; }
    y += 20; doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Signatures', margin, y); y += 24;
    doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
    doc.text('Patient Signature: ____________________________    Date: ____________', margin, y); y += 22;
    doc.text('Provider Signature: ___________________________    Date: ____________', margin, y); y += 22;

    doc.save(`medical_report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-lg">
        <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8" />
            <h1 className="ml-3 text-3xl font-extrabold tracking-tight">MHMS</h1>
          </div>
          <p className="text-indigo-100 text-lg">
            Your Mental Health Management Suite—beautifully designed to help you track moods, complete assessments, and discover insights that support your wellbeing.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* AI Insights Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all cursor-pointer group" onClick={() => generateAIInsights()}>
          <div className="flex items-center justify-between mb-3">
            <Sparkles className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
            {isGeneratingInsights && <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Personalized, privacy-first suggestions to help you feel better.</p>
          <div className="mt-4">
            <button 
              onClick={(e) => { e.stopPropagation(); generateAIInsights(); }}
              disabled={isGeneratingInsights}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isGeneratingInsights ? 'Generating...' : 'Get AI Insights'}
            </button>
          </div>
        </div>

        {/* Mood Tracking Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all cursor-pointer group" onClick={() => generateMoodAnalysis()}>
          <div className="flex items-center justify-between mb-3">
            <HeartPulse className="h-6 w-6 text-pink-600 group-hover:scale-110 transition-transform" />
            {isGeneratingMood && <Loader2 className="h-5 w-5 text-pink-600 animate-spin" />}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mood Tracking</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Fast daily check-ins with visual trends and gentle reminders.</p>
          <div className="mt-4">
            <button 
              onClick={(e) => { e.stopPropagation(); generateMoodAnalysis(); }}
              disabled={isGeneratingMood}
              className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isGeneratingMood ? 'Analyzing...' : 'Analyze Mood Trends'}
            </button>
          </div>
        </div>

        {/* Privacy First Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all cursor-pointer group" onClick={() => generatePrivacyReport()}>
          <div className="flex items-center justify-between mb-3">
            <Shield className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
            {isGeneratingPrivacy && <Loader2 className="h-5 w-5 text-green-600 animate-spin" />}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Privacy First</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Your data is encrypted and always under your control.</p>
          <div className="mt-4">
            <button 
              onClick={(e) => { e.stopPropagation(); generatePrivacyReport(); }}
              disabled={isGeneratingPrivacy}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isGeneratingPrivacy ? 'Generating...' : 'Privacy Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Generate Report Section */}
      {showReportSection && (
        <div className="mt-10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Generate Report</h2>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimeframe(days as 7 | 30 | 90)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      timeframe === days
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              <button 
                onClick={generateReport} 
                disabled={isGenerating} 
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />} Generate Report
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mental Health Report</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generate comprehensive reports of your mental health data and insights.</p>
              <div className="flex gap-2">
                <button 
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </button>
                <button className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Email Link
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
              <div className="flex items-center mb-3">
                <Shield className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Data Privacy</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your data is encrypted and always under your control.</p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>• End-to-end encryption</p>
                <p>• User-controlled retention</p>
                <p>• Privacy-first processing</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!showReportSection && (
        <div className="mt-10 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Report generation section is hidden</p>
            <button
              onClick={() => setShowReportSection(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Show Report Section
            </button>
          </div>
        </div>
      )}

      {/* Piktochart-style Report Modal */}
      {showReport && report && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-0 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white relative">
              <button 
                onClick={() => setShowReport(false)} 
                className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
              <h3 className="text-2xl font-bold pr-12">{report.title}</h3>
              <p className="opacity-90 mt-1">Inspired by modern healthcare infographics. See examples at piktochart templates.</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Executive Summary */}
              <section>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Executive Summary</h4>
                <p className="text-gray-700 dark:text-gray-300">{report.summary}</p>
              </section>

              {/* Assessment Summary */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">{report.assessmentName}</p>
                    <p className="text-xs text-gray-400">{new Date(report.assessmentDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{report.score}/{report.maxScore}</div>
                    <div className="text-sm px-2 py-1 rounded-full inline-block mt-1" style={{ background: '#eef2ff', color: '#3730a3' }}>{report.severity}</div>
                  </div>
                </div>
                <Progress value={report.score} max={report.maxScore} />
                {report.delta != null && (
                  <p className="text-xs text-gray-500 mt-2">Change since previous: {report.delta > 0 ? '+' : ''}{report.delta} points</p>
                )}
              </section>

              {/* Mood Trend */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Mood Trend (last 7 days)</h4>
                <MoodSparkline />
                <p className="text-gray-700 dark:text-gray-300 mt-2">{report.insights}</p>
              </section>

              {/* Action Plan */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Action Plan</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {report.actions.map((a, i) => (<li key={i}>{a}</li>))}
                </ul>
              </section>

              {/* Action Buttons */}
              <div className="flex justify-end">
                <button onClick={downloadReport} className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Download</button>
              </div>
              
              {/* Back Button */}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setShowReport(false)} 
                  className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to MHMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showInsightsModal && aiInsights && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Insights</h3>
              </div>
              <button 
                onClick={() => setShowInsightsModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{aiInsights}</p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowInsightsModal(false)} 
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Analysis Modal */}
      {showMoodModal && moodAnalysis && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-6 w-6 text-pink-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mood Analysis</h3>
              </div>
              <button 
                onClick={() => setShowMoodModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{moodAnalysis}</p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowMoodModal(false)} 
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Report Modal */}
      {showPrivacyModal && privacyReport && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Privacy Report</h3>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{privacyReport}</p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assessment Report Section */}
      <div className="mt-8">
        <AssessmentReport />
      </div>
    </div>
  );
}



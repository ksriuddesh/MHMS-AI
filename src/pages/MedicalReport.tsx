import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { jsPDF } from 'jspdf';
import { FileText, Download } from 'lucide-react';

export default function MedicalReport() {
  const { assessments, moodEntries, patientProfile } = useData() as any;

  const latest = useMemo(() => assessments?.[0] || null, [assessments]);
  const previous = useMemo(() => assessments?.[1] || null, [assessments]);
  const recentMood = useMemo(() => {
    const days = 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return (moodEntries || []).filter((e: any) => new Date(e.date) >= cutoff).slice(-30);
  }, [moodEntries]);

  const downloadPdf = () => {
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
    doc.text('Medical Mental Health Report', pageWidth/2, 48, { align: 'center' });

    // Report metadata
    y = 100;
    doc.setTextColor(31,41,55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const rid = `RPT-${Date.now()}`;
    doc.text(`Report ID: ${rid}`, margin, y);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 200, y);

    // Patient block
    y += 20;
    doc.setFillColor(248,250,252);
    doc.rect(margin, y, pageWidth - 2*margin, 100, 'F');
    doc.setDrawColor(226,232,240);
    doc.rect(margin, y, pageWidth - 2*margin, 100, 'S');
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Patient Information', margin + 12, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const fullName = `${patientProfile.firstName || ''} ${patientProfile.lastName || ''}`.trim() || '—';
    doc.text(`Name: ${fullName}`, margin + 12, y); doc.text(`DOB: ${patientProfile.dateOfBirth || '—'}`, margin + 260, y);
    y += 14;
    doc.text(`Gender: ${patientProfile.gender || '—'}`, margin + 12, y); doc.text(`Patient ID: ${patientProfile.patientId || '—'}`, margin + 260, y);
    y += 14;
    doc.text(`Phone: ${patientProfile.phone || '—'}`, margin + 12, y); doc.text(`Email: ${patientProfile.email || '—'}`, margin + 260, y);
    y += 14;
    const addr = [patientProfile.addressLine1, patientProfile.addressLine2].filter(Boolean).join(', ');
    const city = [patientProfile.city, patientProfile.state, patientProfile.zip].filter(Boolean).join(', ');
    doc.text(`Address: ${addr || '—'}`, margin + 12, y);
    y += 14;
    doc.text(`City/State/ZIP: ${city || '—'}`, margin + 12, y);

    // Assessment overview
    y += 24;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67,56,202);
    doc.setFontSize(13);
    doc.text('Assessment Overview', margin, y);
    y += 16;
    doc.setTextColor(31,41,55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    if (latest) {
      const delta = previous ? latest.score - previous.score : null;
      doc.text(`Instrument: ${latest.type}`, margin, y); doc.text(`Date: ${new Date(latest.date).toLocaleDateString()}`, margin + 220, y); y += 14;
      doc.text(`Score: ${latest.score}/${latest.maxScore} (${latest.severity})`, margin, y);
      if (delta !== null) doc.text(`Change since previous: ${delta > 0 ? '+' : ''}${delta}`, margin + 220, y);
      y += 22;
    } else {
      doc.text('No recent assessment available. Complete an assessment to populate this section.', margin, y); y += 22;
    }

    // Executive summary
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67,56,202);
    doc.text('Executive Summary', margin, y);
    y += 16;
    doc.setTextColor(31,41,55);
    doc.setFont('helvetica', 'normal');
    const summary = latest
      ? `Latest ${latest.type} indicates ${latest.severity} severity. The results reflect self-reported symptoms over the recent period. Consider contextual factors (work, sleep, stress).`
      : 'Insufficient assessment data to summarize clinical status at this time.';
    doc.text(doc.splitTextToSize(summary, pageWidth - 2*margin), margin, y);
    y += 40;

    // Questionnaire & responses
    if (latest?.questions?.length) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(67,56,202); doc.text('Questionnaire & Responses', margin, y); y += 16;
      doc.setTextColor(31,41,55); doc.setFont('helvetica', 'normal');
      const labelFor = (v:number) => ['Not at all','Several days','More than half the days','Nearly every day'][v] ?? String(v);
      for (let i=0;i<latest.questions.length;i++) {
        if (y > pageHeight - 80) { doc.addPage(); y = margin; }
        const q = latest.questions[i]; const r = latest.responses?.[i];
        doc.setFont('helvetica','bold'); doc.text(`${i+1}. ${q}`, margin, y); y += 14;
        doc.setFont('helvetica','normal'); doc.text(`Response: ${r == null ? '—' : labelFor(Number(r))} (${r ?? '-'}/3)`, margin + 16, y); y += 16;
      }
      if (latest.followUpQuestions?.length) {
        y += 8; doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Follow-up', margin, y); y += 16; doc.setTextColor(31,41,55);
        for (let i=0;i<latest.followUpQuestions.length;i++) {
          if (y > pageHeight - 80) { doc.addPage(); y = margin; }
          const q = latest.followUpQuestions[i]; const r = latest.followUpResponses?.[i];
          doc.setFont('helvetica','bold'); doc.text(`${i+1}. ${q}`, margin, y); y += 14;
          doc.setFont('helvetica','normal'); doc.text(`Response: ${r == null ? '—' : labelFor(Number(r))} (${r ?? '-'}/3)`, margin + 16, y); y += 16;
        }
      }
      y += 10;
    }

    // Mood insights
    doc.setFont('helvetica', 'bold'); doc.setTextColor(67,56,202); doc.text('Mood Insights', margin, y); y += 16;
    doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
    if (recentMood.length) {
      const avg = Math.round(recentMood.reduce((s:any,e:any)=>s+e.mood,0)/recentMood.length);
      const counts: Record<string,number> = {};
      recentMood.forEach((e:any)=> e.factors.forEach((f:string)=> counts[f]=(counts[f]||0)+1));
      const factors = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k).join(', ') || '—';
      const txt = `Average mood (last 7 days): ${avg}/10. Frequent factors: ${factors}.`;
      doc.text(doc.splitTextToSize(txt, pageWidth - 2*margin), margin, y); y += 30;
    } else {
      doc.text('Not enough recent mood data to analyze trends.', margin, y); y += 30;
    }

    // Recommendations & safety
    doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Recommendations & Safety', margin, y); y += 16;
    doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
    const actions = [
      'Keep a daily mood log and note one helpful activity.',
      'Aim for consistent sleep and light physical activity.',
      'Schedule one supportive social check-in this week.',
      'Seek professional support for escalating symptoms or safety concerns.'
    ];
    actions.forEach((a)=> { doc.text(`• ${a}`, margin, y); y += 16; });

    // Signatures
    if (y > pageHeight - 120) { doc.addPage(); y = margin; }
    y += 20; doc.setFont('helvetica','bold'); doc.setTextColor(67,56,202); doc.text('Signatures', margin, y); y += 24;
    doc.setTextColor(31,41,55); doc.setFont('helvetica','normal');
    doc.text('Patient Signature: ____________________________    Date: ____________', margin, y); y += 22;
    doc.text('Provider Signature: ___________________________    Date: ____________', margin, y); y += 22;

    // Footer
    const footerY = pageHeight - 40;
    doc.setDrawColor(226, 232, 240); doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setTextColor(107,114,128); doc.setFontSize(9);
    doc.text('Generated by MHMS • For informational use; not a diagnosis.', pageWidth/2, footerY + 15, { align: 'center' });

    doc.save(`Medical_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Report</h1>
          </div>
          <button onClick={downloadPdf} className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            <Download className="h-4 w-4 mr-2"/> Download PDF
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">This page compiles your demographics, latest assessment (with all questions and responses), and mood trends into a professional, printable PDF.</p>
        {!latest && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">No assessments found. Complete an assessment so the full questionnaire appears in your report.</div>
        )}
      </div>
    </div>
  );
}

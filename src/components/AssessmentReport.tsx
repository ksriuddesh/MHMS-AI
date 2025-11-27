import { useState } from 'react';
import { Download, FileText, TrendingUp, AlertCircle, CheckCircle, Brain } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface Assessment {
  id: string;
  type: string;
  date: string;
  score: number;
  maxScore: number;
  severity: string;
  responses?: any;
}

export default function AssessmentReport() {
  const { assessments, patientProfile } = useData();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);

  // Generate AI summary based on assessment data
  const generateAISummary = (assessments: Assessment[]) => {
    if (assessments.length === 0) {
      return {
        overview: 'No assessment data available yet.',
        trends: [],
        recommendations: ['Complete your first mental health assessment to receive personalized insights.'],
        riskLevel: 'unknown'
      };
    }

    // Calculate trends
    const phq9Assessments = assessments.filter(a => a.type === 'PHQ-9');
    const gad7Assessments = assessments.filter(a => a.type === 'GAD-7');
    
    const latestPHQ9 = phq9Assessments[phq9Assessments.length - 1];
    const latestGAD7 = gad7Assessments[gad7Assessments.length - 1];

    // Analyze severity trends
    const severityCounts = assessments.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantSeverity = Object.entries(severityCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'minimal';

    // Generate overview
    let overview = '';
    if (latestPHQ9 && latestGAD7) {
      overview = `Based on your recent assessments, you show ${latestPHQ9.severity} depression symptoms (PHQ-9: ${latestPHQ9.score}/${latestPHQ9.maxScore}) and ${latestGAD7.severity} anxiety symptoms (GAD-7: ${latestGAD7.score}/${latestGAD7.maxScore}). `;
    } else if (latestPHQ9) {
      overview = `Your latest PHQ-9 assessment indicates ${latestPHQ9.severity} depression symptoms with a score of ${latestPHQ9.score}/${latestPHQ9.maxScore}. `;
    } else if (latestGAD7) {
      overview = `Your latest GAD-7 assessment shows ${latestGAD7.severity} anxiety symptoms with a score of ${latestGAD7.score}/${latestGAD7.maxScore}. `;
    }

    overview += `You have completed ${assessments.length} assessment${assessments.length > 1 ? 's' : ''} total.`;

    // Generate trends
    const trends = [];
    if (phq9Assessments.length >= 2) {
      const oldScore = phq9Assessments[0].score;
      const newScore = phq9Assessments[phq9Assessments.length - 1].score;
      const change = newScore - oldScore;
      trends.push({
        type: 'Depression (PHQ-9)',
        direction: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
        change: Math.abs(change),
        message: change > 0 
          ? `Depression symptoms have increased by ${change} points` 
          : change < 0 
          ? `Depression symptoms have decreased by ${Math.abs(change)} points` 
          : 'Depression symptoms remain stable'
      });
    }

    if (gad7Assessments.length >= 2) {
      const oldScore = gad7Assessments[0].score;
      const newScore = gad7Assessments[gad7Assessments.length - 1].score;
      const change = newScore - oldScore;
      trends.push({
        type: 'Anxiety (GAD-7)',
        direction: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
        change: Math.abs(change),
        message: change > 0 
          ? `Anxiety symptoms have increased by ${change} points` 
          : change < 0 
          ? `Anxiety symptoms have decreased by ${Math.abs(change)} points` 
          : 'Anxiety symptoms remain stable'
      });
    }

    // Generate recommendations
    const recommendations = [];
    
    if (dominantSeverity === 'severe' || dominantSeverity === 'moderately severe') {
      recommendations.push('🚨 Immediate professional help recommended - Please contact a mental health provider');
      recommendations.push('Consider crisis support: National Suicide Prevention Lifeline 988');
      recommendations.push('Schedule an appointment with a psychiatrist or therapist within 48 hours');
    } else if (dominantSeverity === 'moderate') {
      recommendations.push('📞 Professional consultation recommended within 1-2 weeks');
      recommendations.push('Consider cognitive behavioral therapy (CBT) or counseling');
      recommendations.push('Practice stress management techniques daily');
      recommendations.push('Maintain regular sleep schedule and healthy diet');
    } else if (dominantSeverity === 'mild') {
      recommendations.push('✅ Continue monitoring your mental health regularly');
      recommendations.push('Practice mindfulness and relaxation techniques');
      recommendations.push('Maintain social connections and physical activity');
      recommendations.push('Consider preventive therapy or support groups');
    } else {
      recommendations.push('✨ Great job maintaining your mental wellness!');
      recommendations.push('Continue healthy habits and regular self-assessment');
      recommendations.push('Stay connected with support systems');
    }

    // Determine risk level
    let riskLevel = 'low';
    if (dominantSeverity === 'severe' || dominantSeverity === 'moderately severe') {
      riskLevel = 'high';
    } else if (dominantSeverity === 'moderate') {
      riskLevel = 'medium';
    }

    return { overview, trends, recommendations, riskLevel };
  };

  // Generate PDF report
  const downloadReport = async () => {
    setGenerating(true);
    
    try {
      const summary = generateAISummary(assessments);
      
      // Create HTML content for PDF
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Mental Health Assessment Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #4F46E5; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .section { margin: 30px 0; }
            .section h2 { color: #4F46E5; border-left: 4px solid #4F46E5; padding-left: 10px; }
            .risk-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .risk-high { background: #FEE2E2; color: #DC2626; }
            .risk-medium { background: #FEF3C7; color: #D97706; }
            .risk-low { background: #D1FAE5; color: #059669; }
            .assessment-item { background: #F9FAFB; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4F46E5; }
            .trend-item { padding: 10px; margin: 5px 0; background: #EEF2FF; border-radius: 6px; }
            .recommendation { padding: 10px 10px 10px 30px; margin: 5px 0; position: relative; }
            .recommendation:before { content: "•"; position: absolute; left: 15px; color: #4F46E5; font-size: 20px; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { background: #F3F4F6; font-weight: bold; color: #4F46E5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🧠 Mental Health Assessment Report</h1>
            <p><strong>Patient:</strong> ${patientProfile.firstName} ${patientProfile.lastName}</p>
            <p><strong>Patient ID:</strong> ${patientProfile.patientId}</p>
            <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Risk Level:</strong> <span class="risk-badge risk-${summary.riskLevel}">${summary.riskLevel.toUpperCase()}</span></p>
          </div>

          <div class="section">
            <h2>📊 Executive Summary</h2>
            <p>${summary.overview}</p>
          </div>

          <div class="section">
            <h2>📈 Assessment History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Assessment Type</th>
                  <th>Score</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                ${assessments.map(a => `
                  <tr>
                    <td>${new Date(a.date).toLocaleDateString()}</td>
                    <td>${a.type}</td>
                    <td>${a.score}/${a.maxScore}</td>
                    <td><strong>${a.severity.toUpperCase()}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${summary.trends.length > 0 ? `
            <div class="section">
              <h2>📉 Trend Analysis</h2>
              ${summary.trends.map(t => `
                <div class="trend-item">
                  <strong>${t.type}:</strong> ${t.message}
                  ${t.direction === 'increasing' ? '📈' : t.direction === 'decreasing' ? '📉' : '➡️'}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="section">
            <h2>💡 AI-Generated Recommendations</h2>
            ${summary.recommendations.map(r => `
              <div class="recommendation">${r}</div>
            `).join('')}
          </div>

          <div class="section">
            <h2>⚠️ Important Disclaimer</h2>
            <p style="background: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #D97706;">
              This report is generated based on self-assessment questionnaires and should not be considered a clinical diagnosis. 
              Please consult with a qualified mental health professional for proper evaluation and treatment. 
              If you are experiencing a mental health crisis, please call 988 (Suicide & Crisis Lifeline) or visit your nearest emergency room.
            </p>
          </div>

          <div class="footer">
            <p><strong>MindWell Mental Health Management System</strong></p>
            <p>This report is confidential and intended solely for the patient and their healthcare providers.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MHMS_Assessment_Report_${patientProfile.patientId}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      alert('✅ Assessment report downloaded successfully! Open the HTML file in your browser to view or print as PDF.');
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('❌ Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const summary = generateAISummary(assessments);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Brain className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assessment Report</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered analysis of your mental health assessments
            </p>
          </div>
        </div>
        <button
          onClick={downloadReport}
          disabled={generating || assessments.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {generating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Report
            </>
          )}
        </button>
      </div>

      {/* Risk Level Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          summary.riskLevel === 'high' 
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            : summary.riskLevel === 'medium'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {summary.riskLevel.toUpperCase()}
        </span>
      </div>

      {/* Overview */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Summary
        </h3>
        <p className="text-gray-700 dark:text-gray-300">{summary.overview}</p>
      </div>

      {/* Trends */}
      {summary.trends.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Trends
          </h3>
          <div className="space-y-2">
            {summary.trends.map((trend, idx) => (
              <div key={idx} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">{trend.type}</span>
                  <span className={`text-sm font-bold ${
                    trend.direction === 'increasing' ? 'text-red-600' :
                    trend.direction === 'decreasing' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {trend.direction === 'increasing' ? '📈 Increasing' :
                     trend.direction === 'decreasing' ? '📉 Decreasing' :
                     '➡️ Stable'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{trend.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          {summary.riskLevel === 'high' ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
          Recommendations
        </h3>
        <div className="space-y-2">
          {summary.recommendations.map((rec, idx) => (
            <div key={idx} className={`p-3 rounded-lg border-l-4 ${
              summary.riskLevel === 'high' 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                : summary.riskLevel === 'medium'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                : 'bg-green-50 dark:bg-green-900/20 border-green-500'
            }`}>
              <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Disclaimer:</strong> This AI-generated report is based on self-assessment questionnaires and should not replace professional medical advice. 
          Please consult with a qualified mental health professional for proper diagnosis and treatment.
        </p>
      </div>
    </div>
  );
}

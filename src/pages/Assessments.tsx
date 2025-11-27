import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { HeartPulse, Activity, Moon, Sun, Users, BookOpen, Loader2, Clock, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const GEMINI_API_KEY = 'AIzaSyB8iipPzPyXQqbOcVqql6LTCg_SqSeFcmE';
// Using gemini-1.5-pro - available in v1beta API
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

async function generateWithGemini(prompt: string) {
  try {
    console.log('🔄 Calling Gemini API...');
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY, // Correct header authentication
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    console.log('📡 API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.error?.message || `API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response received');
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('❌ No text in response:', data);
      throw new Error('No content generated');
    }
    
    return text;
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    throw error;
  }
}

const assessmentTypes = [
  {
    id: 'Depression',
    name: 'Depression Check',
    description: 'Clinically validated questions to assess depression symptoms',
    duration: '5-8 minutes',
    icon: Moon,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  {
    id: 'Anxiety',
    name: 'Anxiety Check',
    description: 'Evidence-based questions to evaluate anxiety levels',
    duration: '4-7 minutes',
    icon: Activity,
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600'
  },
  {
    id: 'Stress',
    name: 'Stress Assessment',
    description: 'Professional questions to measure stress and coping',
    duration: '4-7 minutes',
    icon: Sun,
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600'
  },
  {
    id: 'Wellbeing',
    name: 'Wellbeing Check',
    description: 'Comprehensive questions for mental and emotional health',
    duration: '5-10 minutes',
    icon: HeartPulse,
    gradient: 'from-pink-500 to-rose-600',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
    borderColor: 'border-pink-200',
    iconColor: 'text-pink-600'
  },
  {
    id: 'Social',
    name: 'Social Health',
    description: 'Structured questions about social connections and support',
    duration: '3-6 minutes',
    icon: Users,
    gradient: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'Lifestyle',
    name: 'Lifestyle Factors',
    description: 'Clinical questions on lifestyle impact on mental health',
    duration: '5-8 minutes',
    icon: BookOpen,
    gradient: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-200',
    iconColor: 'text-indigo-600'
  }
];

const responseOptions = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' }
];

export default function Assessments() {
  const { assessments, addAssessment, removeAssessment, patientProfile } = useData();
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpResponses, setFollowUpResponses] = useState<Record<string, number>>({});
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(true);
  const [pendingAssessment, setPendingAssessment] = useState<any | null>(null);

  const allQuestions = dynamicQuestions;

  const handleStartAssessment = async (type: string) => {
    setSelectedAssessment(type);
    setCurrentQuestionIndex(0);
    setResponses({});
    setDynamicQuestions([]);
    setError(null);
    await generateQuestions(type);
  };

  const generateQuestions = async (domain: string) => {
    setIsLoadingQuestions(true);
    setError(null);
    
    try {
      console.log(`📋 Loading predefined questions for ${domain}...`);
      
      // Use predefined clinical questions - reliable and instant
      const questions = getPredefinedQuestions(domain);
      
      console.log(`✅ Loaded ${questions.length} questions`);
      setDynamicQuestions(questions);
      setIsLoadingQuestions(false);
      return questions;
    } catch (e: any) {
      console.error('❌ Question loading failed:', e.message);
      setError('Failed to load questions. Please try again.');
      setIsLoadingQuestions(false);
      return [];
    }
  };
  
  const getPredefinedQuestions = (domain: string): string[] => {
    const predefinedQuestions: Record<string, string[]> = {
      'Depression': [
        'Over the past 2 weeks, how often have you felt down, depressed, or hopeless?',
        'Have you lost interest or pleasure in activities you usually enjoy?',
        'How would you rate your energy levels recently?',
        'Have you experienced changes in your sleep patterns?',
        'Have you noticed any changes in your appetite or weight?',
        'How often do you feel tired or have little energy?',
        'Do you have trouble concentrating on things like reading or watching TV?',
        'How would you rate your self-esteem and confidence lately?',
        'Have you had thoughts that you would be better off dead?',
        'How often do you feel that life isn\'t worth living?',
        'Have you been moving or speaking more slowly than usual?',
        'How often do you feel restless or have trouble sitting still?'
      ],
      'Anxiety': [
        'How often do you feel nervous, anxious, or on edge?',
        'How often do you feel unable to stop or control worrying?',
        'How often do you worry too much about different things?',
        'How often do you have trouble relaxing?',
        'How often are you so restless that it is hard to sit still?',
        'How often do you become easily annoyed or irritable?',
        'How often do you feel afraid as if something awful might happen?',
        'Have you experienced any panic or anxiety attacks?',
        'How often does anxiety interfere with your daily activities?',
        'Do you avoid certain situations because they make you anxious?',
        'How often do you experience physical symptoms like rapid heartbeat or sweating?',
        'How often do you feel like your worries are overwhelming?'
      ],
      'Stress': [
        'In the last month, how often have you felt that you were unable to control the important things in your life?',
        'How often have you felt confident about your ability to handle your personal problems?',
        'How often have you felt that things were going your way?',
        'How often have you found that you could not cope with all the things that you had to do?',
        'How often have you been able to control irritations in your life?',
        'How often have you felt that you were on top of things?',
        'How often have you been angered because of things that happened that were outside of your control?',
        'How often have you felt difficulties were piling up so high that you could not overcome them?',
        'How often have you been able to control the way you spend your time?',
        'How often have you felt confident about your ability to handle your personal problems?',
        'How often have you been able to control irritations in your life?',
        'How often have you felt that you were effectively coping with important changes in your life?'
      ],
      'Wellbeing': [
        'How often do you feel happy and content with your life?',
        'How often do you feel that your life has a sense of purpose?',
        'How satisfied are you with your relationships with family and friends?',
        'How often do you feel engaged and interested in your daily activities?',
        'How well are you able to manage daily responsibilities?',
        'How often do you feel positive about your future?',
        'How often do you feel that you have enough energy for daily life?',
        'How well are you able to bounce back from difficulties?',
        'How often do you feel a sense of accomplishment?',
        'How well are you able to enjoy the present moment?',
        'How often do you feel that you are living in line with your values?',
        'How often do you feel grateful for things in your life?'
      ],
      'Social': [
        'How satisfied are you with your social relationships?',
        'How often do you feel lonely or isolated?',
        'How comfortable are you in social situations?',
        'How often do you feel understood by those around you?',
        'How often do you feel that you have someone to turn to for support?',
        'How often do you participate in social activities?',
        'How would you rate your ability to form and maintain relationships?',
        'How often do you feel connected to your community?',
        'How comfortable are you being yourself around others?',
        'How often do you feel that your relationships are meaningful?',
        'How often do you feel that you can rely on others when needed?',
        'How often do you feel that you belong to a group or community?'
      ],
      'Lifestyle': [
        'How would you rate your sleep quality?',
        'How often do you engage in physical activity?',
        'How would you describe your eating habits?',
        'How often do you use alcohol or other substances?',
        'How well do you manage your work-life balance?',
        'How often do you take time for relaxation and self-care?',
        'How would you rate your stress management techniques?',
        'How often do you engage in activities you enjoy?',
        'How well do you maintain a regular daily routine?',
        'How often do you spend time in nature?',
        'How would you rate your screen time management?',
        'How often do you practice mindfulness or meditation?'
      ]
    };
    
    return predefinedQuestions[domain] || predefinedQuestions['Depression'] || [
      'How have you been feeling overall?',
      'Have you noticed any changes in your mood recently?',
      'How would you rate your stress levels?'
    ];
  };

  const handleResponse = (questionIndex: number, value: number) => {
    setResponses(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return;
    }

    if (!selectedAssessment) {
      setError('No assessment selected');
      return;
    }

    const responseValues = Object.values(responses);
    const totalScore = responseValues.reduce<number>(
      (sum: number, score: unknown) => sum + (typeof score === 'number' ? score : 0),
      0
    );
    
    const maxScore = allQuestions.length * 3;
    const severity = 
      totalScore <= maxScore * 0.15 ? 'minimal' :
      totalScore <= maxScore * 0.35 ? 'mild' :
      totalScore <= maxScore * 0.6 ? 'moderate' : 'severe';

    // Generate follow-up questions based on assessment results
    generateFollowUpQuestions(selectedAssessment);

    // Defer saving until follow-up is completed, so we capture full Q&A
    setPendingAssessment({
      type: selectedAssessment,
      domain: selectedAssessment,
      date: new Date().toISOString().split('T')[0],
      score: totalScore,
      maxScore,
      severity,
      responses,
      questions: [...allQuestions]
    });

    // Reset the assessment UI; follow-up UI will show next
    setSelectedAssessment(null);
    setCurrentQuestionIndex(0);
    setResponses({});
    setDynamicQuestions([]);
    setError(null);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minimal': return 'bg-green-100 text-green-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateFollowUpQuestions = async (domain: string) => {
    setIsGeneratingFollowUp(true);
    try {
      console.log(`📋 Loading follow-up questions for ${domain}...`);
      
      // Use predefined follow-up questions based on domain
      const questions = getPredefinedFollowUpQuestions(domain);
      
      if (questions && questions.length > 0) {
        setFollowUpQuestions(questions);
        setShowFollowUp(true);
        console.log(`✅ Loaded ${questions.length} follow-up questions`);
      }
    } catch (e: any) {
      console.error('Follow-up loading failed:', e);
      // Continue without follow-up questions - not critical
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const getPredefinedFollowUpQuestions = (domain: string): string[] => {
    const followUpQuestions: Record<string, string[]> = {
      'Depression': [
        'Can you describe what a typical day looks like for you right now?',
        'What activities or situations tend to make you feel better or worse?',
        'Do you have people you can talk to when you\'re feeling down?',
        'Have you noticed any patterns in when these feelings are strongest?',
        'What coping strategies have you tried, and how effective have they been?',
        'Are there any physical symptoms accompanying your emotional state?',
        'How are these feelings affecting your daily responsibilities?'
      ],
      'Anxiety': [
        'What situations or thoughts tend to trigger your anxiety most?',
        'How do you typically respond when you start feeling anxious?',
        'Are there any physical sensations you notice when anxiety occurs?',
        'Do you have strategies that help calm you down?',
        'How does your anxiety affect your sleep and daily activities?',
        'Are there times of day when you feel more or less anxious?',
        'Do you find yourself avoiding certain situations because of anxiety?'
      ],
      'Stress': [
        'What are the main sources of stress in your life right now?',
        'How do you typically unwind or relax after a stressful day?',
        'Are you able to take breaks during your day?',
        'How well are you sleeping despite the stress?',
        'Do you have a support system you can lean on?',
        'What boundaries have you set to protect your wellbeing?',
        'How has stress been affecting your physical health?'
      ],
      'Wellbeing': [
        'What brings you the most joy and satisfaction in life?',
        'How connected do you feel to your personal values and goals?',
        'What aspects of your wellbeing would you like to improve?',
        'How do you practice self-care in your daily routine?',
        'What relationships in your life feel most supportive?',
        'How satisfied are you with your work-life balance?',
        'What activities help you feel most like yourself?'
      ],
      'Social': [
        'How often do you have meaningful conversations with others?',
        'What makes you feel most connected to the people around you?',
        'Are there relationships you\'d like to strengthen?',
        'How comfortable are you asking for help when you need it?',
        'Do you feel understood and accepted by people close to you?',
        'What activities do you enjoy doing with others?',
        'How has your social life changed recently?'
      ],
      'Lifestyle': [
        'What does your typical sleep schedule look like?',
        'How do you feel about your current eating habits?',
        'What physical activities do you engage in regularly?',
        'How much time do you spend on screens each day?',
        'What healthy habits would you like to develop?',
        'How do you balance work, rest, and leisure time?',
        'What obstacles prevent you from maintaining healthy routines?'
      ]
    };

    return followUpQuestions[domain] || followUpQuestions['Depression'];
  };

  const getSuggestions = async (type: string, severity: string) => {
    try {
      const prompt = `Provide 3 concise, compassionate bullet suggestions for someone with ${type.toLowerCase()} at ${severity} severity. Focus on safe, practical self-care and when to seek support. Return plain text bullets.`;
      const text = await generateWithGemini(prompt);
      const lines = text.split(/\n+/).map((s: string) => s.replace(/^[−•\-\s]+/, '').trim()).filter(Boolean).slice(0, 3);
      return lines.length ? lines : ['Maintain supportive routines.', 'Use small daily coping tools.', 'Seek professional help if needed.'];
    } catch {
      return ['Maintain supportive routines.', 'Use small daily coping tools.', 'Seek professional help if needed.'];
    }
  };

  const generateProfessionalReport = async (assessment: any, notes: string) => {
    if (!assessment?.questions || !Array.isArray(assessment.questions) || 
        !assessment.responses || typeof assessment.responses !== 'object') {
      throw new Error('Invalid assessment data');
    }
    
    try {
      // Get the actual questions and responses for context
      const qaPairs = assessment.questions
        .map((q: string, i: number) => {
          const responseValue = assessment.responses[i];
          const response = responseOptions.find(opt => opt.value === responseValue)?.label || 'Not answered';
          return `Q${i + 1}. ${q}\nResponse: ${response}`;
        })
        .join('\n\n');
      
      const prompt = `Create a detailed mental health assessment report based on the following:
      
      ASSESSMENT DETAILS:
      - Type: ${assessment.type} Assessment
      - Date: ${new Date(assessment.date).toLocaleDateString()}
      - Score: ${assessment.score} out of ${assessment.maxScore}
      - Severity Level: ${assessment.severity}
      
      QUESTIONS AND RESPONSES:
      ${qaPairs}
      
      CLINICIAN NOTES:
      ${notes || 'No additional notes provided'}
      
      INSTRUCTIONS:
      Generate a professional report with these sections:
      1. Executive Summary: 2-3 sentence overview
      2. Assessment Overview: Detailed analysis of responses
      3. Severity Analysis: What the score means in context
      4. Key Findings: 3-4 main observations
      5. Recommendations: 4-5 specific, actionable suggestions
      6. Next Steps: Suggested follow-up actions
      
      Format the response with clear section headers in ALL CAPS. Use bullet points for lists.
      Maintain a professional, compassionate tone while being clinically accurate.`;
      
      const response = await generateWithGemini(prompt);
      return response || 'Unable to generate report. Please try again later.';
    } catch (error) {
      console.error('Failed to generate professional report:', error);
      return null;
    }
  };

  async function exportAssessmentToPdf(a: any, notes: any) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // Generate professional report content
    const reportContent = await generateProfessionalReport(a, notes);
    
    // Header with modern gradient effect (Purple to Indigo)
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(0, 0, pageWidth, 100, 'F');
    
    // Add a subtle accent stripe
    doc.setFillColor(139, 92, 246); // Violet accent
    doc.rect(0, 0, pageWidth, 8, 'F');
    
    // Logo/Icon placeholder - Professional brain icon representation
    doc.setFillColor(255, 255, 255);
    doc.circle(60, 50, 18, 'F');
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(24);
    doc.text('🧠', 60, 58, { align: 'center' });
    
    // Title with better spacing
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('Mental Health Assessment Report', pageWidth/2, 55, { align: 'center' });
    
    // Subtitle with professional tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('AI-Powered Clinical Analysis • Confidential', pageWidth/2, 78, { align: 'center' });

    y = 120; // Start content below header

    // Patient Information Box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - 2*margin, 90, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - 2*margin, 90, 'S');
    y += 20;
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Patient Information', margin + 15, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const fullName = `${patientProfile.firstName || ''} ${patientProfile.lastName || ''}`.trim() || '—';
    doc.text(`Name: ${fullName}`, margin + 15, y);
    doc.text(`DOB: ${patientProfile.dateOfBirth || '—'}`, margin + 250, y);
    y += 15;
    doc.text(`Gender: ${patientProfile.gender || '—'}`, margin + 15, y);
    doc.text(`Patient ID: ${patientProfile.patientId || '—'}`, margin + 250, y);
    y += 15;
    doc.text(`Phone: ${patientProfile.phone || '—'}`, margin + 15, y);
    doc.text(`Email: ${patientProfile.email || '—'}`, margin + 250, y);
    y += 30;

    // Assessment Details Box with Score Visualization
    const scoreBoxHeight = 140;
    doc.setFillColor(248, 250, 252); // Gray-50
    doc.rect(margin, y, pageWidth - 2*margin, scoreBoxHeight, 'F');
    doc.setDrawColor(226, 232, 240); // Gray-200
    doc.rect(margin, y, pageWidth - 2*margin, scoreBoxHeight, 'S');
    
    y += 20;
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Assessment Overview', margin + 15, y);
    
    y += 25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Type: ${a.type}`, margin + 15, y);
    doc.text(`Date: ${new Date(a.date).toLocaleDateString()}`, margin + 280, y);
    y += 20;
    doc.text(`Score: ${a.score} out of ${a.maxScore}`, margin + 15, y);
    
    // Draw visual score bar
    const barWidth = 200;
    const barHeight = 20;
    const barX = margin + 280;
    const barY = y - 14;
    const scorePercentage = (a.score / a.maxScore) * 100;
    const fillWidth = (barWidth * scorePercentage) / 100;
    
    // Severity color coding
    let severityColor: [number, number, number];
    switch (a.severity) {
      case 'minimal': severityColor = [16, 185, 129]; break; // Green
      case 'mild': severityColor = [251, 191, 36]; break; // Yellow
      case 'moderate': severityColor = [249, 115, 22]; break; // Orange
      case 'severe': severityColor = [239, 68, 68]; break; // Red
      default: severityColor = [156, 163, 175]; // Gray
    }
    
    // Background bar
    doc.setFillColor(229, 231, 235); // Gray-200
    doc.roundedRect(barX, barY, barWidth, barHeight, 4, 4, 'F');
    
    // Score fill bar
    doc.setFillColor(...severityColor);
    doc.roundedRect(barX, barY, fillWidth, barHeight, 4, 4, 'F');
    
    // Score percentage text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    if (fillWidth > 30) {
      doc.text(`${Math.round(scorePercentage)}%`, barX + fillWidth - 25, barY + 14);
    }
    
    y += 25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(`Severity Level:`, margin + 15, y);
    
    // Severity badge
    const badgeX = margin + 110;
    const badgeY = y - 12;
    doc.setFillColor(...severityColor);
    doc.roundedRect(badgeX, badgeY, 80, 18, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(a.severity.toUpperCase(), badgeX + 40, badgeY + 13, { align: 'center' });

    y += 50;

    // Professional Report Content
    if (reportContent) {
      const sections = reportContent.split(/(?=^[A-Z\s]+:)/m);
      
      for (const section of sections) {
        if (section.trim()) {
          const [title, ...content] = section.split('\n');
          const sectionTitle = title.replace(':', '').trim();
          const sectionContent = content.join('\n').trim();
          
          // Check if we need a new page
          if (y > pageHeight - 150) {
            doc.addPage();
            y = margin;
          }
          
          // Section title
          doc.setTextColor(99, 102, 241); // Indigo
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text(sectionTitle, margin, y);
          y += 20;
          
          // Section content
          doc.setTextColor(31, 41, 55); // Gray-800
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          
          const lines = doc.splitTextToSize(sectionContent, pageWidth - 2*margin);
          doc.text(lines, margin, y);
          y += lines.length * 16 + 20;
        }
      }
    } else {
      // Fallback content if AI generation fails
      y += 20;
      doc.setTextColor(99, 102, 241);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Assessment Summary', margin, y);
      y += 20;
      
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`This ${a.type.toLowerCase()} assessment indicates ${a.severity} severity levels.`, margin, y);
      y += 20;
      
      const suggestions = await getSuggestions(a.type, a.severity);
      doc.setTextColor(99, 102, 241);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations:', margin, y);
      y += 20;
      
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'normal');
      suggestions.forEach((suggestion: string) => {
        doc.text(`• ${suggestion}`, margin + 10, y);
        y += 16;
      });
    }

    // Add full Questionnaire & Responses section
    const addPageIfNeeded = (needed: number) => {
      if (y + needed > pageHeight - 60) { doc.addPage(); y = margin; }
    };

    y += 30;
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Questionnaire & Responses', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31,41,55);

    const labelFor = (v: number) => {
      const found = responseOptions.find(o => o.value === v);
      return found ? found.label : String(v);
    };

    const qList: string[] = Array.isArray(a.questions) ? a.questions : [];
    for (let i = 0; i < qList.length; i++) {
      addPageIfNeeded(30);
      const q = qList[i];
      const r = a.responses?.[i] ?? null;
      doc.setFont('helvetica', 'bold');
      doc.text(`${i+1}. ${q}`, margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.text(`Response: ${r === null ? '—' : labelFor(Number(r))} (${r ?? '-'}/3)`, margin + 18, y);
      y += 16;
    }

    // Follow-up questions
    if (Array.isArray(a.followUpQuestions) && a.followUpQuestions.length) {
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99,102,241);
      doc.text('Follow-up Questions', margin, y);
      y += 16;
      doc.setTextColor(31,41,55);
      for (let i = 0; i < a.followUpQuestions.length; i++) {
        addPageIfNeeded(30);
        const q = a.followUpQuestions[i];
        const r = a.followUpResponses?.[i] ?? null;
        doc.setFont('helvetica', 'bold');
        doc.text(`${i+1}. ${q}`, margin, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        doc.text(`Response: ${r === null ? '—' : labelFor(Number(r))} (${r ?? '-'}/3)`, margin + 18, y);
        y += 16;
      }
    }

    // Footer
    const footerY = pageHeight - 40;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Generated by MindWell - AI-Powered Mental Health Platform', pageWidth/2, footerY + 15, { align: 'center' });
    doc.text(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth/2, footerY + 30, { align: 'center' });

    doc.save(`MindWell_Assessment_${a.type}_${a.date}.pdf`);
  }

  if (selectedAssessment) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {allQuestions.length === 0 ? 0 : currentQuestionIndex + 1} of {allQuestions.length || '...'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${allQuestions.length ? (((currentQuestionIndex + 1) / allQuestions.length) * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Loading/Error */}
          {isLoadingQuestions && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
              <p className="text-gray-600">Generating personalized {selectedAssessment?.toLowerCase()} questions...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => generateQuestions(selectedAssessment as string)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Question Display */}
          {!isLoadingQuestions && !error && allQuestions.length > 0 && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedAssessment} questions</h2>
                <p className="text-lg text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {allQuestions[currentQuestionIndex]}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {responseOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleResponse(currentQuestionIndex, option.value)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      responses[currentQuestionIndex] === option.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        responses[currentQuestionIndex] === option.value
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-gray-300'
                      }`}>
                        {responses[currentQuestionIndex] === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAssessment(null);
                      setCurrentQuestionIndex(0);
                      setResponses({});
                      setDynamicQuestions([]);
                      setError(null);
                    }}
                    className="px-6 py-2 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg"
                  >
                    Exit
                  </button>
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                </div>
                <button
                  onClick={handleNext}
                  disabled={responses[currentQuestionIndex] === undefined}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentQuestionIndex === allQuestions.length - 1 ? 'Complete' : 'Next'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Follow-up Questions Component
  if (showFollowUp && followUpQuestions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Personalized Follow-up</h2>
            <p className="text-gray-600">Let's explore your situation a bit more to provide better support</p>
          </div>

          {isGeneratingFollowUp ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
              <p className="text-gray-600">Generating personalized follow-up questions...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {followUpQuestions.map((question, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-3 font-medium">{question}</p>
                  <div className="space-y-2">
                    {responseOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFollowUpResponses(prev => ({ ...prev, [index]: option.value }))}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                          followUpResponses[index] === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            followUpResponses[index] === option.value
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-gray-300'
                          }`}>
                            {followUpResponses[index] === option.value && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => {
                    // Save without follow-ups
                    if (pendingAssessment) {
                      addAssessment(pendingAssessment);
                      setPendingAssessment(null);
                    }
                    setShowFollowUp(false);
                    setFollowUpQuestions([]);
                    setFollowUpResponses({});
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    // Save with follow-up Q&A attached
                    if (pendingAssessment) {
                      addAssessment({
                        ...pendingAssessment,
                        followUpQuestions: [...followUpQuestions],
                        followUpResponses: { ...followUpResponses }
                      });
                      setPendingAssessment(null);
                    }
                    setShowFollowUp(false);
                    setFollowUpQuestions([]);
                    setFollowUpResponses({});
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Complete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header with Gradient */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Mental Health Assessments
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Clinically validated assessments with AI-powered insights and professional PDF reports
        </p>
        {assessments.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700"><strong>{assessments.length}</strong> Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <span className="text-gray-700">Track Progress</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Assessment Results */}
      {assessments.length > 0 && !showResults && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Assessment results are hidden</p>
            <button
              onClick={() => setShowResults(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
      
      {assessments.length > 0 && showResults && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Assessment Results</h2>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Hide Results
            </button>
          </div>
          <div className="space-y-5">
            {assessments.slice(0, 6).map((assessment) => (
              <div key={assessment.id} className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">{assessment.type}</p>
                      <p className="text-sm text-gray-500">{new Date(assessment.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{assessment.score}/{assessment.maxScore}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(assessment.severity)}`}>
                        {assessment.severity}
                      </span>
                    </div>
                    <button
                      onClick={() => removeAssessment(assessment.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Auto-suggestions</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Export to PDF to see tailored suggestions.</li>
                    </ul>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      value={reportNotes[assessment.id] ?? ''}
                      onChange={(e) => setReportNotes(prev => ({ ...prev, [assessment.id]: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Add details you want on the PDF..."
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={async () => {
                          setIsGeneratingPdf(prev => ({ ...prev, [assessment.id]: true }));
                          try {
                            await exportAssessmentToPdf(assessment, reportNotes[assessment.id] ?? '');
                          } catch (error) {
                            console.error('PDF generation failed:', error);
                            alert('Failed to generate PDF. Please try again.');
                          } finally {
                            setIsGeneratingPdf(prev => ({ ...prev, [assessment.id]: false }));
                          }
                        }}
                        disabled={isGeneratingPdf[assessment.id]}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingPdf[assessment.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          'Download PDF'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          console.log('Wrong option selected for assessment:', assessment.id);
                          alert('Assessment download cancelled');
                        }}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Wrong
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Assessments - Modern Card Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Assessments</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessmentTypes.map((assessment) => (
            <div
              key={assessment.id}
              className={`group relative ${assessment.bgColor} border-2 ${assessment.borderColor} rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1`}
              onClick={() => handleStartAssessment(assessment.id)}
            >
              {/* Icon Badge */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-md mb-4 group-hover:shadow-lg transition-shadow duration-300`}>
                <assessment.icon className={`h-7 w-7 ${assessment.iconColor}`} />
              </div>
              
              {/* Assessment Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {assessment.name}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {assessment.description}
              </p>
              
              {/* Duration Badge */}
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Clock className="h-4 w-4 mr-1.5" />
                <span className="font-medium">{assessment.duration}</span>
              </div>
              
              {/* Start Button */}
              <button className={`w-full bg-gradient-to-r ${assessment.gradient} text-white font-semibold px-5 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform group-hover:scale-105`}>
                Start Assessment
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
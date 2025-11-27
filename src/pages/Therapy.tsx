import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, AlertTriangle, Loader2, Brain } from 'lucide-react';

// Initialize the Google Generative AI with your API key
const GEMINI_API_KEY = 'AIzaSyD-IGcapXIFRut5WrxoTfLUJb5ja8T1o5k';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Set the base URL for the API
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const MAX_CONTEXT_MESSAGES = 10;

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'warning';
}

function Therapy() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hello! I'm your AI Medical Assistant. I'm here to provide general health information, symptom assessment, and wellness advice. Please note that I'm not a substitute for professional medical advice. How can I assist you with your health today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callGemini = async (prompt: string): Promise<string> => {
    try {
      console.log('Sending request to Gemini API with prompt:', prompt.substring(0, 100) + '...');
      
      // Make a direct fetch call to the Gemini API
      const response = await fetch(`${API_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch response from Gemini API');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help. Could you please rephrase your question?";
      
      console.log('Received response from Gemini API');
      return text || "I'm here to help. Could you please rephrase your question?";
      
    } catch (error: any) {
      console.error('Gemini API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error('Sorry, I encountered an issue. Please try again in a moment.');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = inputValue.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Create a more structured prompt with conversation history
      const conversationHistory = messages
        .slice(-3) // Get last 3 messages for context
        .map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');

      const prompt = `You are a compassionate AI mental health assistant. 
      Respond to the user in a warm, empathetic, and professional manner.
      Keep responses concise (2-3 sentences).
      Focus on providing emotional support, coping strategies, and mental health guidance.

      Previous conversation (if any):
      ${conversationHistory}

      User's message: ${inputValue}

      Your response (be empathetic and supportive):`;

      const aiResponse = await callGemini(prompt);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'warning'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleRefreshChat = () => {
    setMessages([{
      id: '1',
      content: "👋 Hello! I'm your AI Medical Assistant. I'm here to provide general health information, symptom assessment, and wellness advice. Please note that I'm not a substitute for professional medical advice. How can I assist you with your health today?",
      sender: 'ai',
      timestamp: new Date(),
    }]);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 py-3 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            AI Medical Assistant
          </h1>
          <button
            onClick={handleRefreshChat}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            New Chat
          </button>
        </div>
      </header>

      {/* Quick Prompts */}
      <div className="px-6 py-3 bg-gray-900 border-b border-gray-800 overflow-x-auto">
        <div className="flex space-x-3">
          {[
            "I'm feeling anxious",
            "Help me relax",
            "I need motivation",
            "How to reduce stress"
          ].map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-4 py-2 bg-gray-800 text-sm text-blue-400 rounded-full border border-gray-700 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {message.sender === 'ai' && (
                <div className="flex items-center mb-2">
                  <Brain className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="text-xs font-medium text-blue-400">AI Therapist</span>
                </div>
              )}
              <p className="whitespace-pre-line">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <Brain className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-xs font-medium text-blue-400 mr-2">AI Therapist</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <form onSubmit={(e) => handleSendMessage(e)} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI Assistant may produce inaccurate information. For critical decisions, consult a professional.
        </p>
      </div>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-md mx-auto mt-10 bg-red-50 rounded-lg shadow">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
          </div>
          <p className="text-sm text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Reload Chat
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the Therapy component with ErrorBoundary for export
export default function TherapyWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <Therapy />
    </ErrorBoundary>
  );
}

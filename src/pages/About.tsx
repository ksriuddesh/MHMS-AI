import React from 'react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">About MHMS</h1>

      <section className="space-y-2">
        <p className="text-gray-700 dark:text-gray-300">
          MHMS (Mental Health Management Suite) is a privacy-first application designed to help individuals
          monitor wellbeing, complete clinically informed assessments, and generate clear, action-oriented
          reports. The platform emphasizes usability, data security, and supportive guidance.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">What MHMS Provides</h2>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
          <li><span className="font-medium">Assessments:</span> Guided screening flows with dynamic or curated question sets.</li>
          <li><span className="font-medium">Mood tracking:</span> Fast daily check-ins with trends and helpful insights.</li>
          <li><span className="font-medium">Reports:</span> Professional, printable summaries with suggestions and next steps.</li>
          <li><span className="font-medium">Privacy:</span> User-centered controls and security best practices.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Printable Report Templates</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          If you prefer standardized forms to complement MHMS reports, you can download and print
          mental health report templates from reputable libraries. These resources may be useful for
          clinical handoffs or personal record-keeping.
        </p>
        <a
          href="https://www.templateroller.com/search.html?q=Mental%20Health%20Report"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Explore Mental Health Report Templates
        </a>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          External templates are provided by third-party sources and may be subject to their terms.
          Use professional judgment when selecting and completing forms.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Version & Technology</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">Version 1.0.0</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">Built with React, TypeScript, Tailwind CSS, and a secure backend API.</p>
      </section>
    </div>
  );
}



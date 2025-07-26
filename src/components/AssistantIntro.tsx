import React from 'react';
import { CustomIcon } from './CustomIcon';

const assistantIntro = `
Awesome! I'd love to help you build your SaaS for market research. Let's take it step by step:

1. Idea Validation: Who exactly are you building this for? What problems are they facing right now with market research? And why do current tools not cut it for them? Your unique value proposition will come from answering those questions.

2. MVP Planning: Once we're confident in the idea, let's map out a simple version of the product that solves their biggest pain. What features are absolutely essential for launch?

3. Lean Canvas: This is your one-page business model. We'll quickly sketch your customer segments, key problems, solution, value prop, and how you'll reach people.

4. Launch Strategy: How will you get your first users? What's your plan to collect feedback fast and iterate?

5. Product-Market Fit: This part never really ends. We'll continuously improve based on real user needs.

6. Customer Discovery: Let's dig into what your audience cares about most — and shape your SaaS around that.

Ready to dive in? Start by telling me a bit about your target audience and the problem you're solving.
`;

const AssistantIntro = () => {
  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <CustomIcon className="w-8 h-8" />
        <h2 className="text-xl font-semibold">Bizactly.AI Assistant</h2>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
        {assistantIntro}
      </pre>
    </div>
  );
};

export default AssistantIntro;
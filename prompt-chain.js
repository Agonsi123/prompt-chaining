import 'dotenv/config';
import fetch from "node-fetch";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;

// Helper function
async function callWithPrompt(prompt) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "minimax/minimax-m2:free",
            messages: [{role: "user", content: prompt}],
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter API error: ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Five step prompt chain
export async function runPromptChain(customerQuery) {
    const outputs = [];

    // Step1 Interpret customer Intent
    const prompt1 = `The following is a customer message to a bank’s support chatbot.
Analyze the message carefully and summarize the customer’s intent in one or two sentences.
Focus on what the customer is asking for or complaining about.

Customer Message:
"${customerQuery}"

Output:
-Intent summary:
`;
const step1 = await callWithPrompt(prompt1);
outputs.push(step1);

// step2 Map to possible categories
const prompt2 = `prompt: Based on the following intent summary, list the possible support categories this query may fall under. Choose from these categories:
Account Opening
Billing Issue
Account Access
Transaction Inquiry
Card Services
Account Statement
Loan Inquiry
General Information

Intent Summary:
${step1}

Output:
-Possible categories:
`;
const step2 = await callWithPrompt(prompt2);
outputs.push(step2);

// step3 choose the most appropriate category
const prompt3 = `From the following possible categories, choose the single category that best fits the customer’s issue. Provide a one-line justification for your choice

Possible Categories:
${step2}

Intent Summary:
${step1}

Output:
-Selected Category:
-Reason:
`;
const step3 = await callWithPrompt(prompt3);
outputs.push(step3);

// step4 Extract additional details
const prompt4 = `Review the customer’s original message and extract any useful details (if present) related to the selected category. Also, list any details that are still missing and would be needed to resolve the issue.

Selected Category:
${step3}

Customer Message:
"${customerQuery}"

Output:
-Extracted details:
-Missing details:
`;
const step4 = await callWithPrompt(prompt4);
outputs.push(step4);

// step5 Generate a short response
const prompt5 = `Using the selected category, extracted details, and missing information, write a short, polite, and helpful response to the customer. Keep it under 100 words.

Selected Category:
${step3}

Extracted Details:
${step4}

Output:
-Response:
`;
const step5 = await callWithPrompt(prompt5);
outputs.push(step5);

return outputs;
}

// To test prompt chain
(async () => {
    const results = await runPromptChain(
        "Hi, I just saw a 500 Naira charge I don't recognise on my account. Can you help me check it?"
    );
    console.log(results);
})();
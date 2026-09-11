/**
 * Groq AI Complaint Classifier Service
 * With graceful smart heuristic fallback
 */

const VALID_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Cleaning',
  'Civil & Painting',
  'Appliances',
  'Security',
  'General',
];

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

export async function classifyComplaint(text) {
  if (!text || typeof text !== 'string') {
    return {
      category: 'General',
      priority: 'Medium',
      summary: 'General maintenance request reported.',
      source: 'smart-heuristic',
      confidence: 0.7,
    };
  }

  const groqApiKey = process.env.GROQ_API_KEY;

  // 1. Try Groq Cloud API if key is available
  if (groqApiKey && groqApiKey.trim().length > 10) {
    const candidateModels = [
      process.env.GROQ_MODEL,
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'qwen/qwen3.8-27b',
    ].filter(Boolean);

    // Deduplicate models
    const uniqueModels = [...new Set(candidateModels)];

    for (const model of uniqueModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey.trim()}`,
          },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            model,
            temperature: 0.1,
            messages: [
              {
                role: 'system',
                content: `You are an AI assistant for a residential society management platform named Nivasa.
Your job is to analyze a resident maintenance complaint description and output ONLY a valid JSON object with:
- "category": Must be one of ["Plumbing", "Electrical", "Carpentry", "Cleaning", "Civil & Painting", "Appliances", "Security", "General"]
- "priority": Must be one of ["Low", "Medium", "High", "Emergency"] (Use Emergency for water flooding, sparking wires, fire hazards, or severe leaks)
- "summary": A concise 1-sentence summary of the core issue.
- "confidence": A number between 0.8 and 0.99.

Example input: "Water is leaking from my bathroom ceiling."
Example output:
{
  "category": "Plumbing",
  "priority": "High",
  "summary": "Water leakage reported from bathroom ceiling.",
  "confidence": 0.96
}
Output strictly the JSON object, nothing else.`,
              },
              {
                role: 'user',
                content: text,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawContent = data.choices?.[0]?.message?.content;
          if (rawContent) {
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (VALID_CATEGORIES.includes(parsed.category) && VALID_PRIORITIES.includes(parsed.priority)) {
                return {
                  category: parsed.category,
                  priority: parsed.priority,
                  summary: parsed.summary || text.slice(0, 100),
                  source: 'groq-ai',
                  model,
                  confidence: parsed.confidence || 0.95,
                };
              }
            }
          }
        } else {
          const errBody = await response.text();
          console.warn(`Groq API (${model}) returned HTTP ${response.status}: ${errBody}`);
        }
      } catch (err) {
        console.warn(`Groq API (${model}) failed: ${err.message}. Trying fallback...`);
      }
    }
  }

  // 2. Smart Resilient Heuristic Fallback
  return fallbackHeuristicClassifier(text);
}

function fallbackHeuristicClassifier(text) {
  const lower = text.toLowerCase();

  // Category determination
  let category = 'General';
  let priority = 'Medium';

  const plumbingKeywords = ['leak', 'pipe', 'tap', 'water', 'flush', 'drain', 'sink', 'basin', 'plumbing', 'faucet', 'sewage', 'clog', 'commode', 'overflow', 'geyser'];
  const electricalKeywords = ['spark', 'light', 'wire', 'switch', 'mcb', 'power', 'fluctuation', 'short circuit', 'socket', 'fuse', 'fan', 'bulb', 'shock', 'voltage'];
  const carpentryKeywords = ['door', 'hinge', 'window', 'wood', 'lock', 'handle', 'cabinet', 'wardrobe', 'drawer', 'latch', 'shutter'];
  const civilKeywords = ['seepage', 'crack', 'wall', 'plaster', 'tile', 'paint', 'ceiling', 'balcony', 'cement', 'damp', 'leakage'];
  const cleaningKeywords = ['garbage', 'smell', 'pest', 'cockroach', 'termite', 'clean', 'dustbin', 'rodent', 'mosquito', 'hygiene'];
  const appliancesKeywords = ['ac', 'air conditioner', 'refrigerator', 'fridge', 'washing machine', 'microwave', 'chimney', 'inverter'];
  const securityKeywords = ['cctv', 'guard', 'gate', 'intercom', 'intruder', 'theft', 'unauthorized', 'parking dispute'];

  if (plumbingKeywords.some(k => lower.includes(k))) {
    category = 'Plumbing';
  } else if (electricalKeywords.some(k => lower.includes(k))) {
    category = 'Electrical';
  } else if (civilKeywords.some(k => lower.includes(k))) {
    category = 'Civil & Painting';
  } else if (carpentryKeywords.some(k => lower.includes(k))) {
    category = 'Carpentry';
  } else if (appliancesKeywords.some(k => lower.includes(k))) {
    category = 'Appliances';
  } else if (cleaningKeywords.some(k => lower.includes(k))) {
    category = 'Cleaning';
  } else if (securityKeywords.some(k => lower.includes(k))) {
    category = 'Security';
  }

  // Priority determination
  const emergencyKeywords = ['emergency', 'flooding', 'sparking', 'fire', 'shock', 'danger', 'burst', 'collapsed', 'gas leak'];
  const highKeywords = ['heavy leak', 'leaking from ceiling', 'no power', 'power outage', 'main switch', 'short circuit', 'blocked', 'overflowing', 'urgent', 'asap'];
  const lowKeywords = ['creaking', 'loose', 'minor', 'cosmetic', 'paint chip', 'slow drip', 'aesthetic'];

  if (emergencyKeywords.some(k => lower.includes(k))) {
    priority = 'Emergency';
  } else if (highKeywords.some(k => lower.includes(k)) || (category === 'Plumbing' && lower.includes('ceiling'))) {
    priority = 'High';
  } else if (lowKeywords.some(k => lower.includes(k))) {
    priority = 'Low';
  }

  // Generate clean 1-sentence summary
  let summary = text.trim();
  if (summary.length > 80) {
    summary = summary.slice(0, 77) + '...';
  }
  if (!summary.endsWith('.')) {
    summary += '.';
  }

  if (lower.includes('water') && lower.includes('ceiling')) {
    summary = 'Water leakage reported from bathroom/room ceiling.';
  } else if (lower.includes('power') || lower.includes('fluctuation')) {
    summary = 'Electrical power fluctuation and circuit instability reported.';
  } else if (lower.includes('sink') || lower.includes('drain')) {
    summary = 'Drainage blockage and wastewater flow issue reported.';
  }

  return {
    category,
    priority,
    summary,
    source: 'smart-heuristic',
    confidence: 0.91,
  };
}

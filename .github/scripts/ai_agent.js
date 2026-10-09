const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'Dev3550/RedHub';

async function postGithubComment(message) {
  if (!GITHUB_TOKEN || !ISSUE_NUMBER) return;
  try {
    await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${ISSUE_NUMBER}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: message })
    });
  } catch (err) {
    console.error('Failed to post GitHub comment:', err);
  }
}

async function runMobileAgent() {
  console.log('🤖 Starting Gemini Mobile AI Agent...');

  const prompt = process.env.MANUAL_INSTRUCTION || process.env.COMMENT_BODY || process.env.ISSUE_BODY || process.env.ISSUE_TITLE;
  if (!prompt || prompt.trim().length === 0) {
    console.log('No prompt found. Exiting.');
    return;
  }

  console.log(`Prompt received: "${prompt.trim()}"`);

  if (!GEMINI_API_KEY) {
    const missingKeyMsg = `⚠️ **GEMINI_API_KEY Required for Mobile AI Agent**\n\nTo enable 100% automatic AI code editing from your phone:\n1. Go to your GitHub Repo: **Settings** -> **Secrets and variables** -> **Actions**\n2. Click **New repository secret**\n3. Name: \`GEMINI_API_KEY\`\n4. Value: Paste your Google Gemini API Key\n\nOnce added, reply to this Issue or create a new Issue on your phone and I will edit the code & push to main automatically! 🚀`;
    console.log(missingKeyMsg);
    await postGithubComment(missingKeyMsg);
    return;
  }

  // Gather key files context
  const filesToRead = ['index.html', 'watch.html', 'watch.js', 'app.js', 'style.css'];
  const codeContext = {};

  for (const file of filesToRead) {
    const fullPath = path.join(__dirname, '../../', file);
    if (fs.existsSync(fullPath)) {
      codeContext[file] = fs.readFileSync(fullPath, 'utf-8');
    }
  }

  const systemInstruction = `You are an expert web developer AI assistant. The user is requesting code modifications to their website repository (RedHub).
Given the user's prompt and current file contents, output ONLY a valid JSON object with the files to create/update in the following format:
{
  "summary": "Brief summary of changes made",
  "files": [
    {
      "path": "watch.js",
      "content": "full updated content of file"
    }
  ]
}
Do NOT include markdown formatting or extra text outside the JSON object.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemInstruction },
          { text: `Current Code Context:\n` + JSON.stringify(codeContext, null, 2) },
          { text: `User Instruction: ${prompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini API');

    const result = JSON.parse(rawText);
    console.log('Gemini Summary:', result.summary);

    if (Array.isArray(result.files)) {
      for (const fileObj of result.files) {
        if (fileObj.path && fileObj.content) {
          const targetPath = path.join(__dirname, '../../', fileObj.path);
          fs.writeFileSync(targetPath, fileObj.content, 'utf-8');
          console.log(`✅ Updated file: ${fileObj.path}`);
        }
      }
    }

    const successMsg = `🎉 **Gemini Mobile AI Agent Completed Your Request!**\n\n**Summary of Changes:**\n${result.summary || 'Code files updated successfully.'}\n\nAll changes have been committed and pushed live to \`main\`! 🚀`;
    await postGithubComment(successMsg);

  } catch (err) {
    console.error('AI Agent Execution Error:', err);
    await postGithubComment(`❌ **Mobile AI Agent Failed**: ${err.message}`);
  }
}

runMobileAgent();

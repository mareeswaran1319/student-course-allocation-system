const { pool } = require('../config/database');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── FETCH CONTEXT DATA ───────────────────────────────────────────────────────
const getContextData = async () => {
  const [courses, allocStats, categoryStats, rejectionStats] = await Promise.all([
    pool.query(`
      SELECT c.course_code, c.course_name, c.total_seats,
        COALESCE(COUNT(a.id), 0) AS allocated,
        c.total_seats - COALESCE(COUNT(a.id), 0) AS available
      FROM courses c LEFT JOIN allocations a ON c.id = a.course_id
      GROUP BY c.id ORDER BY c.course_code
    `),
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM allocations) AS total_allocated,
        (SELECT COUNT(*) FROM allocations WHERE preference_rank = 1) AS got_first,
        (SELECT COUNT(*) FROM allocations WHERE preference_rank = 2) AS got_second,
        (SELECT COUNT(*) FROM allocations WHERE preference_rank = 3) AS got_third,
        (SELECT COUNT(*) FROM students WHERE NOT EXISTS (SELECT 1 FROM allocations WHERE student_id = students.id)) AS unallocated
    `),
    pool.query(`
      SELECT a.category_slot AS category, COUNT(*) AS count
      FROM allocations a GROUP BY a.category_slot
    `),
    pool.query(`
      SELECT c.course_code, c.course_name,
        (SELECT COUNT(*) FROM students WHERE pref1_course_id = c.id) AS first_pref_apps,
        COUNT(a.id) AS allocated
      FROM courses c LEFT JOIN allocations a ON c.id = a.course_id AND a.preference_rank = 1
      GROUP BY c.id, c.course_code, c.course_name
      ORDER BY (SELECT COUNT(*) FROM students WHERE pref1_course_id = c.id) - COUNT(a.id) DESC
    `),
  ]);

  return {
    courses: courses.rows,
    stats: allocStats.rows[0],
    categoryStats: categoryStats.rows,
    rejectionStats: rejectionStats.rows,
  };
};

// ─── AI QUERY HANDLER ─────────────────────────────────────────────────────────
const aiQuery = async (req, res) => {
  const { question } = req.body;
  if (!question)
    return res.status(400).json({ success: false, error: 'Question is required' });

  try {
    const context = await getContextData();

    const systemPrompt = `You are an intelligent AI assistant for a University Student Course Allocation System.
You have access to real-time data from the allocation system. Answer questions accurately, concisely, and helpfully.
Format your responses with clear structure using bullet points, tables (as markdown), and bold text where appropriate.

CURRENT SYSTEM DATA:
=== OVERALL STATISTICS ===
- Total Students Registered: ${context.stats.total_students}
- Total Allocated: ${context.stats.total_allocated}
- Total Unallocated: ${context.stats.unallocated}
- Got 1st Preference: ${context.stats.got_first}
- Got 2nd Preference: ${context.stats.got_second}
- Got 3rd Preference: ${context.stats.got_third}

=== COURSE ALLOCATION DETAILS ===
${context.courses.map(c => `- ${c.course_name} (${c.course_code}): ${c.allocated}/${c.total_seats} seats filled, ${c.available} available`).join('\n')}

=== CATEGORY-WISE ALLOCATION ===
${context.categoryStats.map(c => `- ${c.category}: ${c.count} students`).join('\n')}

=== COURSE REJECTION RATES ===
${context.rejectionStats.map(c => {
  const rejected = parseInt(c.first_pref_apps) - parseInt(c.allocated);
  const rate = c.first_pref_apps > 0 ? Math.round(rejected / c.first_pref_apps * 100) : 0;
  return `- ${c.course_name} (${c.course_code}): ${c.first_pref_apps} applications, ${c.allocated} got it, ${rejected} rejected (${rate}% rejection rate)`;
}).join('\n')}

Note: If allocation hasn't been run yet, most stats will show 0. Encourage running allocation first if needed.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const answer = completion.choices[0].message.content;

    // Save to conversation log (optional: can store in DB)
    res.json({
      success: true,
      data: {
        question,
        answer,
        model: 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
        context_snapshot: {
          total_students: context.stats.total_students,
          total_allocated: context.stats.total_allocated,
        }
      }
    });
  } catch (err) {
    console.error('AI Error:', err.message);

    // Fallback rule-based responses if OpenAI fails
    const fallbackAnswer = generateFallbackAnswer(question, await getContextData());
    res.json({
      success: true,
      data: {
        question,
        answer: fallbackAnswer,
        model: 'rule-based-fallback',
        timestamp: new Date().toISOString(),
      }
    });
  }
};

// ─── FALLBACK RULE-BASED RESPONSES ───────────────────────────────────────────
const generateFallbackAnswer = (question, context) => {
  const q = question.toLowerCase();

  if (q.includes('allocated') && q.includes('course')) {
    const lines = context.courses.map(c =>
      `- **${c.course_name}** (${c.course_code}): **${c.allocated}** students allocated`
    ).join('\n');
    return `### Students Allocated per Course:\n\n${lines}\n\n**Total Allocated: ${context.stats.total_allocated}** out of **${context.stats.total_students}** students.`;
  }

  if (q.includes('first preference') || q.includes('1st preference')) {
    return `### First Preference Statistics:\n\n- ✅ Got 1st preference: **${context.stats.got_first}** students\n- ⚠️ Got 2nd preference: **${context.stats.got_second}** students\n- ⚠️ Got 3rd preference: **${context.stats.got_third}** students\n- ❌ Unallocated: **${context.stats.unallocated}** students`;
  }

  if (q.includes('rejection')) {
    const highest = context.rejectionStats[0];
    if (highest) {
      const rejected = parseInt(highest.first_pref_apps) - parseInt(highest.allocated);
      const rate = highest.first_pref_apps > 0 ? Math.round(rejected / highest.first_pref_apps * 100) : 0;
      return `### Highest Rejection Rate:\n\n**${highest.course_name}** (${highest.course_code}) has the highest rejection rate:\n- Applications: **${highest.first_pref_apps}**\n- Allocated: **${highest.allocated}**\n- Rejected: **${rejected}** (**${rate}%** rejection rate)`;
    }
  }

  if (q.includes('category') || q.includes('general') || q.includes('obc') || q.includes('sc') || q.includes('st')) {
    const lines = context.categoryStats.map(c => `- **${c.category}**: ${c.count} students`).join('\n');
    return `### Category-wise Allocation Summary:\n\n${lines || 'No allocations found yet. Please run the allocation process first.'}`;
  }

  return `I can help you with:\n- 📊 How many students were allocated to each course\n- 🎯 Which students did not receive their first preference\n- 📉 Which course had the highest rejection rate\n- 📋 Category-wise allocation summary\n\nPlease ask one of these questions or similar queries!`;
};

module.exports = { aiQuery };

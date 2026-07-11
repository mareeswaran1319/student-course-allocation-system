const { pool } = require('../config/database');

/**
 * ALLOCATION ALGORITHM:
 * 1. Sort students by marks DESC, application_date ASC (tie-breaking)
 * 2. For each student try pref1 → pref2 → pref3
 * 3. Check reserved seats first, then overflow to general seats
 * 4. SC/ST can use SC/ST reserved → then General overflow
 * 5. OBC can use OBC reserved → then General overflow
 * 6. General can use General seats only
 */

const runAllocation = async (req, res) => {
  const io = req.app.get('io');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing allocations
    await client.query('DELETE FROM allocations');

    // Fetch all students sorted by merit
    const students = await client.query(`
      SELECT s.id, s.student_id, s.name, s.marks, s.category, s.application_date,
             s.pref1_course_id, s.pref2_course_id, s.pref3_course_id
      FROM students s
      ORDER BY s.marks DESC, s.application_date ASC
    `);

    // Fetch all courses with seat info
    const courses = await client.query('SELECT * FROM courses');
    
    // Build seat tracker in memory
    const seatTracker = {};
    courses.rows.forEach(c => {
      seatTracker[c.id] = {
        general: c.general_seats,
        obc: c.obc_seats,
        sc: c.sc_seats,
        st: c.st_seats,
        total: c.total_seats,
      };
    });

    const allocations = [];
    const unallocated = [];

    for (const student of students.rows) {
      const prefs = [student.pref1_course_id, student.pref2_course_id, student.pref3_course_id].filter(Boolean);
      let allocated = false;

      for (let rank = 0; rank < prefs.length; rank++) {
        const courseId = prefs[rank];
        if (!seatTracker[courseId]) continue;

        const seats = seatTracker[courseId];
        const cat = student.category;
        let categorySlot = null;

        if (cat === 'General') {
          if (seats.general > 0) {
            seats.general--;
            categorySlot = 'General';
          }
        } else if (cat === 'OBC') {
          if (seats.obc > 0) {
            seats.obc--;
            categorySlot = 'OBC';
          } else if (seats.general > 0) {
            // OBC can overflow to general
            seats.general--;
            categorySlot = 'General';
          }
        } else if (cat === 'SC') {
          if (seats.sc > 0) {
            seats.sc--;
            categorySlot = 'SC';
          } else if (seats.general > 0) {
            seats.general--;
            categorySlot = 'General';
          }
        } else if (cat === 'ST') {
          if (seats.st > 0) {
            seats.st--;
            categorySlot = 'ST';
          } else if (seats.general > 0) {
            seats.general--;
            categorySlot = 'General';
          }
        }

        if (categorySlot) {
          allocations.push({
            student_id: student.id,
            course_id: courseId,
            preference_rank: rank + 1,
            category_slot: categorySlot,
          });
          allocated = true;
          // Emit progress in real-time
          io.emit('allocation:progress', {
            student_id: student.student_id,
            name: student.name,
            course_id: courseId,
            preference_rank: rank + 1,
          });
          break;
        }
      }

      if (!allocated) {
        unallocated.push({ student_id: student.student_id, name: student.name });
      }
    }

    // Bulk insert allocations
    for (const alloc of allocations) {
      await client.query(
        `INSERT INTO allocations (student_id, course_id, preference_rank, category_slot)
         VALUES ($1, $2, $3, $4)`,
        [alloc.student_id, alloc.course_id, alloc.preference_rank, alloc.category_slot]
      );
    }

    await client.query('COMMIT');

    const summary = {
      total_students: students.rows.length,
      total_allocated: allocations.length,
      total_unallocated: unallocated.length,
      got_first_pref: allocations.filter(a => a.preference_rank === 1).length,
      got_second_pref: allocations.filter(a => a.preference_rank === 2).length,
      got_third_pref: allocations.filter(a => a.preference_rank === 3).length,
      unallocated_students: unallocated,
    };

    io.emit('allocation:complete', summary);
    res.json({ success: true, data: summary, message: 'Allocation completed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    io.emit('allocation:error', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
};

// ─── GET ALL ALLOCATIONS ──────────────────────────────────────────────────────
const getAllAllocations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, s.student_id, s.name, s.marks, s.category,
             c.course_name, c.course_code,
             c1.course_name AS pref1_name, c1.course_code AS pref1_code
      FROM allocations a
      JOIN students s ON a.student_id = s.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN courses c1 ON s.pref1_course_id = c1.id
      ORDER BY s.marks DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET ALLOCATION STATISTICS ────────────────────────────────────────────────
const getAllocationStats = async (req, res) => {
  try {
    // Overall stats
    const overall = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM allocations) AS total_allocated,
        (SELECT COUNT(*) FROM students s WHERE NOT EXISTS (SELECT 1 FROM allocations a WHERE a.student_id = s.id)) AS total_unallocated,
        (SELECT COUNT(*) FROM allocations WHERE preference_rank = 1) AS got_first_pref,
        (SELECT COUNT(*) FROM allocations WHERE preference_rank = 2) AS got_second_pref,
        (SELECT COUNT(*) FROM allocations WHERE preference_rank = 3) AS got_third_pref
    `);

    // Per-course stats
    const perCourse = await pool.query(`
      SELECT c.course_code, c.course_name, c.total_seats,
        COUNT(a.id) AS allocated,
        c.total_seats - COUNT(a.id) AS available,
        ROUND(COUNT(a.id)::DECIMAL / NULLIF(c.total_seats, 0) * 100, 1) AS fill_rate
      FROM courses c
      LEFT JOIN allocations a ON c.id = a.course_id
      GROUP BY c.id, c.course_code, c.course_name, c.total_seats
      ORDER BY fill_rate DESC
    `);

    // Category-wise stats
    const categoryWise = await pool.query(`
      SELECT category_slot AS category, COUNT(*) AS count
      FROM allocations
      GROUP BY category_slot
    `);

    // Students not allocated their first preference
    const notFirstPref = await pool.query(`
      SELECT s.student_id, s.name, s.marks, s.category,
             c1.course_name AS first_pref, c1.course_code AS first_pref_code,
             ac.course_name AS allocated_to, a.preference_rank
      FROM students s
      LEFT JOIN allocations a ON s.id = a.student_id
      LEFT JOIN courses c1 ON s.pref1_course_id = c1.id
      LEFT JOIN courses ac ON a.course_id = ac.id
      WHERE a.preference_rank > 1 OR a.student_id IS NULL
      ORDER BY s.marks DESC
    `);

    // Course rejection rate (applications vs allocations)
    const rejectionRate = await pool.query(`
      SELECT c.course_code, c.course_name,
        (SELECT COUNT(*) FROM students s WHERE s.pref1_course_id = c.id) AS first_pref_applicants,
        COUNT(a.id) AS allocated,
        (SELECT COUNT(*) FROM students s WHERE s.pref1_course_id = c.id) - COUNT(a.id) AS rejected,
        CASE WHEN (SELECT COUNT(*) FROM students s WHERE s.pref1_course_id = c.id) = 0 THEN 0
          ELSE ROUND(((SELECT COUNT(*) FROM students s WHERE s.pref1_course_id = c.id) - COUNT(a.id))::DECIMAL /
            (SELECT COUNT(*) FROM students s WHERE s.pref1_course_id = c.id) * 100, 1)
        END AS rejection_rate
      FROM courses c
      LEFT JOIN allocations a ON c.id = a.course_id AND a.preference_rank = 1
      GROUP BY c.id, c.course_code, c.course_name
      ORDER BY rejection_rate DESC
    `);

    res.json({
      success: true,
      data: {
        overall: overall.rows[0],
        perCourse: perCourse.rows,
        categoryWise: categoryWise.rows,
        notFirstPref: notFirstPref.rows,
        rejectionRate: rejectionRate.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── RESET ALLOCATIONS ────────────────────────────────────────────────────────
const resetAllocations = async (req, res) => {
  try {
    await pool.query('DELETE FROM allocations');
    const io = req.app.get('io');
    io.emit('allocation:reset', {});
    res.json({ success: true, message: 'All allocations have been reset' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { runAllocation, getAllAllocations, getAllocationStats, resetAllocations };

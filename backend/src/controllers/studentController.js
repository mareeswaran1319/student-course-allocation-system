const { pool } = require('../config/database');

// ─── GET ALL STUDENTS ─────────────────────────────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*,
        c1.course_name AS pref1_name, c1.course_code AS pref1_code,
        c2.course_name AS pref2_name, c2.course_code AS pref2_code,
        c3.course_name AS pref3_name, c3.course_code AS pref3_code,
        a.course_id AS allocated_course_id, ac.course_name AS allocated_course_name,
        ac.course_code AS allocated_course_code, a.preference_rank, a.category_slot
      FROM students s
      LEFT JOIN courses c1 ON s.pref1_course_id = c1.id
      LEFT JOIN courses c2 ON s.pref2_course_id = c2.id
      LEFT JOIN courses c3 ON s.pref3_course_id = c3.id
      LEFT JOIN allocations a ON s.id = a.student_id
      LEFT JOIN courses ac ON a.course_id = ac.id
      ORDER BY s.marks DESC, s.application_date ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET STUDENT BY ID ────────────────────────────────────────────────────────
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*,
        c1.course_name AS pref1_name, c1.course_code AS pref1_code,
        c2.course_name AS pref2_name, c2.course_code AS pref2_code,
        c3.course_name AS pref3_name, c3.course_code AS pref3_code,
        a.course_id AS allocated_course_id, ac.course_name AS allocated_course_name,
        ac.course_code AS allocated_course_code, a.preference_rank, a.category_slot
      FROM students s
      LEFT JOIN courses c1 ON s.pref1_course_id = c1.id
      LEFT JOIN courses c2 ON s.pref2_course_id = c2.id
      LEFT JOIN courses c3 ON s.pref3_course_id = c3.id
      LEFT JOIN allocations a ON s.id = a.student_id
      LEFT JOIN courses ac ON a.course_id = ac.id
      WHERE s.id = $1
    `, [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── REGISTER STUDENT ─────────────────────────────────────────────────────────
const createStudent = async (req, res) => {
  const { student_id, name, marks, category, application_date, pref1_course_id, pref2_course_id, pref3_course_id } = req.body;
  try {
    if (!student_id || !name || marks === undefined || !category || !pref1_course_id)
      return res.status(400).json({ success: false, error: 'student_id, name, marks, category, and pref1_course_id are required' });

    if (parseFloat(marks) < 0 || parseFloat(marks) > 100)
      return res.status(400).json({ success: false, error: 'Marks must be between 0 and 100' });

    if (!['General', 'OBC', 'SC', 'ST'].includes(category))
      return res.status(400).json({ success: false, error: 'Category must be General, OBC, SC, or ST' });

    const result = await pool.query(
      `INSERT INTO students (student_id, name, marks, category, application_date, pref1_course_id, pref2_course_id, pref3_course_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        student_id.toUpperCase(),
        name,
        parseFloat(marks),
        category,
        application_date || new Date(),
        pref1_course_id,
        pref2_course_id || null,
        pref3_course_id || null
      ]
    );
    const io = req.app.get('io');
    io.emit('student:created', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Student registered successfully' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, error: 'Student ID already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── UPDATE STUDENT ───────────────────────────────────────────────────────────
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, marks, category, application_date, pref1_course_id, pref2_course_id, pref3_course_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE students SET name=$1, marks=$2, category=$3, application_date=$4,
       pref1_course_id=$5, pref2_course_id=$6, pref3_course_id=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, parseFloat(marks), category, application_date || new Date(), pref1_course_id, pref2_course_id || null, pref3_course_id || null, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Student not found' });
    const io = req.app.get('io');
    io.emit('student:updated', result.rows[0]);
    res.json({ success: true, data: result.rows[0], message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE STUDENT ───────────────────────────────────────────────────────────
const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM students WHERE id=$1 RETURNING student_id', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Student not found' });
    const io = req.app.get('io');
    io.emit('student:deleted', { id: parseInt(id) });
    res.json({ success: true, message: `Student ${result.rows[0].student_id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent };

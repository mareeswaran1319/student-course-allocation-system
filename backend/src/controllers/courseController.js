const { pool } = require('../config/database');

// ─── GET ALL COURSES ─────────────────────────────────────────────────────────
const getAllCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
        COALESCE(COUNT(a.id), 0) AS total_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'General' THEN 1 ELSE 0 END), 0) AS general_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'OBC' THEN 1 ELSE 0 END), 0) AS obc_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'SC' THEN 1 ELSE 0 END), 0) AS sc_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'ST' THEN 1 ELSE 0 END), 0) AS st_allocated,
        c.total_seats - COALESCE(COUNT(a.id), 0) AS available_seats
      FROM courses c
      LEFT JOIN allocations a ON c.id = a.course_id
      GROUP BY c.id
      ORDER BY c.course_code
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET COURSE BY ID ─────────────────────────────────────────────────────────
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM seat_availability WHERE id = $1', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Course not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── CREATE COURSE ────────────────────────────────────────────────────────────
const createCourse = async (req, res) => {
  const { course_code, course_name, description, total_seats, general_seats, obc_seats, sc_seats, st_seats } = req.body;
  try {
    if (!course_code || !course_name || !total_seats)
      return res.status(400).json({ success: false, error: 'course_code, course_name, and total_seats are required' });

    const gs = parseInt(general_seats) || 0;
    const ob = parseInt(obc_seats) || 0;
    const sc = parseInt(sc_seats) || 0;
    const st = parseInt(st_seats) || 0;
    const total = parseInt(total_seats);

    if (gs + ob + sc + st !== total)
      return res.status(400).json({ success: false, error: 'Sum of category seats must equal total_seats' });

    const result = await pool.query(
      `INSERT INTO courses (course_code, course_name, description, total_seats, general_seats, obc_seats, sc_seats, st_seats)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [course_code.toUpperCase(), course_name, description || '', total, gs, ob, sc, st]
    );
    const io = req.app.get('io');
    io.emit('course:created', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Course created successfully' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, error: 'Course code already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── UPDATE COURSE ────────────────────────────────────────────────────────────
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { course_name, description, total_seats, general_seats, obc_seats, sc_seats, st_seats } = req.body;
  try {
    const gs = parseInt(general_seats) || 0;
    const ob = parseInt(obc_seats) || 0;
    const sc = parseInt(sc_seats) || 0;
    const st = parseInt(st_seats) || 0;
    const total = parseInt(total_seats);

    if (gs + ob + sc + st !== total)
      return res.status(400).json({ success: false, error: 'Sum of category seats must equal total_seats' });

    const result = await pool.query(
      `UPDATE courses SET course_name=$1, description=$2, total_seats=$3, general_seats=$4,
       obc_seats=$5, sc_seats=$6, st_seats=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [course_name, description, total, gs, ob, sc, st, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Course not found' });

    const io = req.app.get('io');
    io.emit('course:updated', result.rows[0]);
    res.json({ success: true, data: result.rows[0], message: 'Course updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE COURSE ────────────────────────────────────────────────────────────
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM courses WHERE id=$1 RETURNING course_code', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Course not found' });
    const io = req.app.get('io');
    io.emit('course:deleted', { id: parseInt(id) });
    res.json({ success: true, message: `Course ${result.rows[0].course_code} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse };

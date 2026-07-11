const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create ENUM types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE category_type AS ENUM ('General', 'OBC', 'SC', 'ST');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE allocation_status AS ENUM ('Allocated', 'Waitlisted', 'Not Allocated');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        description TEXT,
        total_seats INT NOT NULL DEFAULT 0,
        general_seats INT NOT NULL DEFAULT 0,
        obc_seats INT NOT NULL DEFAULT 0,
        sc_seats INT NOT NULL DEFAULT 0,
        st_seats INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        marks DECIMAL(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
        category category_type NOT NULL DEFAULT 'General',
        application_date TIMESTAMP NOT NULL DEFAULT NOW(),
        pref1_course_id INT REFERENCES courses(id) ON DELETE SET NULL,
        pref2_course_id INT REFERENCES courses(id) ON DELETE SET NULL,
        pref3_course_id INT REFERENCES courses(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create allocations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS allocations (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        course_id INT REFERENCES courses(id) ON DELETE CASCADE,
        preference_rank INT CHECK (preference_rank BETWEEN 1 AND 3),
        category_slot category_type NOT NULL,
        status allocation_status NOT NULL DEFAULT 'Allocated',
        allocated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(student_id)
      );
    `);

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create seat availability view
    await client.query(`
      CREATE OR REPLACE VIEW seat_availability AS
      SELECT
        c.id,
        c.course_code,
        c.course_name,
        c.total_seats,
        c.general_seats,
        c.obc_seats,
        c.sc_seats,
        c.st_seats,
        COALESCE(COUNT(a.id), 0) AS total_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'General' THEN 1 ELSE 0 END), 0) AS general_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'OBC' THEN 1 ELSE 0 END), 0) AS obc_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'SC' THEN 1 ELSE 0 END), 0) AS sc_allocated,
        COALESCE(SUM(CASE WHEN a.category_slot = 'ST' THEN 1 ELSE 0 END), 0) AS st_allocated,
        c.general_seats - COALESCE(SUM(CASE WHEN a.category_slot = 'General' THEN 1 ELSE 0 END), 0) AS general_available,
        c.obc_seats - COALESCE(SUM(CASE WHEN a.category_slot = 'OBC' THEN 1 ELSE 0 END), 0) AS obc_available,
        c.sc_seats - COALESCE(SUM(CASE WHEN a.category_slot = 'SC' THEN 1 ELSE 0 END), 0) AS sc_available,
        c.st_seats - COALESCE(SUM(CASE WHEN a.category_slot = 'ST' THEN 1 ELSE 0 END), 0) AS st_available,
        c.total_seats - COALESCE(COUNT(a.id), 0) AS total_available
      FROM courses c
      LEFT JOIN allocations a ON c.id = a.course_id
      GROUP BY c.id, c.course_code, c.course_name, c.total_seats, c.general_seats, c.obc_seats, c.sc_seats, c.st_seats;
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

const seedData = async () => {
  const client = await pool.connect();
  try {
    // Seed default admin if not exists
    const existingAdmin = await client.query('SELECT COUNT(*) FROM admins');
    if (parseInt(existingAdmin.rows[0].count) === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        ['admin', hash]
      );
      console.log('✅ Default admin seeded (username: admin, password: admin123)');
    }

    // Check if course data already exists
    const existingCourses = await client.query('SELECT COUNT(*) FROM courses');
    if (parseInt(existingCourses.rows[0].count) > 0) {
      console.log('ℹ️  Seed data already exists, skipping...');
      return;
    }

    await client.query('BEGIN');

    // Seed courses
    const courses = await client.query(`
      INSERT INTO courses (course_code, course_name, description, total_seats, general_seats, obc_seats, sc_seats, st_seats) VALUES
      ('CS101', 'Computer Science Engineering', 'Core CS program covering algorithms, data structures, and software engineering.', 60, 30, 16, 9, 5),
      ('ME201', 'Mechanical Engineering', 'Comprehensive mechanical engineering with focus on design and manufacturing.', 60, 30, 16, 9, 5),
      ('EE301', 'Electrical Engineering', 'Advanced electrical systems, power electronics, and circuit design.', 45, 23, 12, 7, 3),
      ('CE401', 'Civil Engineering', 'Infrastructure and construction engineering with modern CAD tools.', 45, 23, 12, 7, 3),
      ('BT501', 'Biotechnology', 'Cutting-edge biotech program with lab-based learning.', 30, 15, 8, 5, 2),
      ('AI601', 'Artificial Intelligence & ML', 'Specialized AI/ML program with industry-standard tools and frameworks.', 30, 15, 8, 5, 2)
      RETURNING id, course_code;
    `);

    const courseMap = {};
    courses.rows.forEach(c => courseMap[c.course_code] = c.id);

    // Seed students
    await client.query(`
      INSERT INTO students (student_id, name, marks, category, application_date, pref1_course_id, pref2_course_id, pref3_course_id) VALUES
      ('STU001', 'Aarav Sharma', 95.5, 'General', '2026-01-05 10:00:00', $1, $2, $3),
      ('STU002', 'Priya Patel', 92.0, 'OBC', '2026-01-06 09:30:00', $1, $4, $2),
      ('STU003', 'Rohan Kumar', 88.5, 'SC', '2026-01-07 11:00:00', $3, $1, $2),
      ('STU004', 'Sneha Reddy', 91.0, 'General', '2026-01-05 14:00:00', $1, $6, $3),
      ('STU005', 'Vikram Singh', 85.0, 'ST', '2026-01-08 10:30:00', $2, $1, $4),
      ('STU006', 'Anjali Nair', 93.5, 'General', '2026-01-04 09:00:00', $6, $1, $3),
      ('STU007', 'Kiran Mehta', 89.0, 'OBC', '2026-01-06 15:00:00', $1, $3, $5),
      ('STU008', 'Deepa Thomas', 87.5, 'SC', '2026-01-09 10:00:00', $5, $3, $1),
      ('STU009', 'Arjun Gupta', 90.0, 'General', '2026-01-05 16:00:00', $1, $2, $6),
      ('STU010', 'Meera Joshi', 94.0, 'General', '2026-01-03 08:30:00', $6, $1, $2),
      ('STU011', 'Suresh Pillai', 86.0, 'OBC', '2026-01-10 09:00:00', $2, $4, $1),
      ('STU012', 'Lakshmi Rao', 91.5, 'ST', '2026-01-07 13:00:00', $3, $1, $4),
      ('STU013', 'Nikhil Agarwal', 88.0, 'General', '2026-01-08 11:30:00', $1, $6, $3),
      ('STU014', 'Pooja Verma', 92.5, 'SC', '2026-01-06 10:30:00', $1, $3, $5),
      ('STU015', 'Rahul Desai', 84.0, 'General', '2026-01-11 09:00:00', $4, $2, $1)
    `, [
      courseMap['CS101'], courseMap['ME201'], courseMap['EE301'],
      courseMap['CE401'], courseMap['BT501'], courseMap['AI601']
    ]);

    await client.query('COMMIT');
    console.log('✅ Seed data inserted successfully (6 courses, 15 students)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed data failed:', err.message);
  } finally {
    client.release();
  }
};

module.exports = { initializeDatabase, seedData };

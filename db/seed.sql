-- Seed data for first-time local desktop runs.
-- The Electron wrapper requests this seed only when the target DB file does not exist yet.

BEGIN TRANSACTION;

INSERT INTO profiles (
  first_name,
  last_name,
  email,
  phone,
  city,
  state,
  linkedin_url,
  github_url,
  portfolio_url,
  professional_summary
) VALUES (
  'Sawyer',
  'Brown',
  'sawyer.brown@example.com',
  '931-555-0142',
  'Cookeville',
  'TN',
  'https://www.linkedin.com/in/sawyer-brown',
  'https://github.com/Alpha-SB',
  'https://portfolio.example.com',
  'Senior Computer Science student focused on full-stack web development, accessible UI, and practical project delivery.'
);

INSERT INTO education (
  school_name,
  degree,
  major,
  location,
  start_date,
  end_date,
  gpa,
  details
) VALUES (
  'Tennessee Tech University',
  'Bachelor of Science',
  'Computer Science',
  'Cookeville, TN',
  '2022-08',
  '2026-05',
  '3.7',
  'Relevant coursework: Web Development, Database Systems, Software Engineering.'
);

INSERT INTO experiences (
  job_title,
  company_name,
  location,
  start_date,
  end_date,
  is_current,
  description
) VALUES
(
  'Web Development Intern',
  'Upper Cumberland Tech Solutions',
  'Cookeville, TN',
  '2025-05',
  '2025-08',
  0,
  'Built internal tools and improved user-facing web workflows.'
),
(
  'Computer Science Tutor',
  'Tennessee Tech University',
  'Cookeville, TN',
  '2024-01',
  '2026-05',
  1,
  'Supported students in programming fundamentals, debugging, and project planning.'
);

INSERT INTO experience_bullets (experience_id, bullet_text, sort_order)
VALUES
(
  (SELECT id FROM experiences WHERE job_title = 'Web Development Intern' AND company_name = 'Upper Cumberland Tech Solutions' LIMIT 1),
  'Implemented reusable frontend modules that reduced duplicate code and improved maintainability.',
  1
),
(
  (SELECT id FROM experiences WHERE job_title = 'Web Development Intern' AND company_name = 'Upper Cumberland Tech Solutions' LIMIT 1),
  'Collaborated with teammates to debug REST API integration issues and improve request error handling.',
  2
),
(
  (SELECT id FROM experiences WHERE job_title = 'Computer Science Tutor' AND company_name = 'Tennessee Tech University' LIMIT 1),
  'Mentored students in JavaScript and SQL by guiding them through hands-on debugging sessions.',
  1
);

INSERT INTO skill_categories (category_name, sort_order)
VALUES
('Languages', 1),
('Frontend', 2),
('Backend and Data', 3);

INSERT INTO skills (skill_category_id, skill_name, sort_order)
VALUES
(
  (SELECT id FROM skill_categories WHERE category_name = 'Languages' LIMIT 1),
  'JavaScript',
  1
),
(
  (SELECT id FROM skill_categories WHERE category_name = 'Languages' LIMIT 1),
  'SQL',
  2
),
(
  (SELECT id FROM skill_categories WHERE category_name = 'Frontend' LIMIT 1),
  'HTML5',
  1
),
(
  (SELECT id FROM skill_categories WHERE category_name = 'Frontend' LIMIT 1),
  'Bootstrap',
  2
),
(
  (SELECT id FROM skill_categories WHERE category_name = 'Backend and Data' LIMIT 1),
  'Node.js',
  1
),
(
  (SELECT id FROM skill_categories WHERE category_name = 'Backend and Data' LIMIT 1),
  'SQLite',
  2
);

INSERT INTO certifications (
  certification_name,
  issuing_organization,
  issue_date,
  expiration_date,
  credential_url
) VALUES (
  'Google Data Analytics Certificate',
  'Google',
  '2025-02',
  '',
  'https://www.coursera.org/account/accomplishments/professional-cert/example'
);

INSERT INTO awards (
  award_name,
  issuing_organization,
  award_date,
  description
) VALUES (
  'Outstanding Web Project',
  'Tennessee Tech University',
  '2025-12',
  'Recognized for strong accessibility and user-centered design in a class project.'
);

INSERT INTO resumes (
  resume_name,
  target_job_title,
  target_company,
  target_job_description
) VALUES (
  'Software Developer Resume',
  'Junior Software Developer',
  'Sample Company',
  'Entry-level developer role focused on JavaScript, APIs, and collaborative development.'
);

INSERT INTO resume_items (resume_id, item_type, item_id, sort_order)
VALUES
(
  (SELECT id FROM resumes WHERE resume_name = 'Software Developer Resume' LIMIT 1),
  'education',
  (SELECT id FROM education WHERE school_name = 'Tennessee Tech University' LIMIT 1),
  1
),
(
  (SELECT id FROM resumes WHERE resume_name = 'Software Developer Resume' LIMIT 1),
  'experience',
  (SELECT id FROM experiences WHERE job_title = 'Web Development Intern' AND company_name = 'Upper Cumberland Tech Solutions' LIMIT 1),
  2
),
(
  (SELECT id FROM resumes WHERE resume_name = 'Software Developer Resume' LIMIT 1),
  'experience',
  (SELECT id FROM experiences WHERE job_title = 'Computer Science Tutor' AND company_name = 'Tennessee Tech University' LIMIT 1),
  3
),
(
  (SELECT id FROM resumes WHERE resume_name = 'Software Developer Resume' LIMIT 1),
  'skill',
  (SELECT id FROM skills WHERE skill_name = 'JavaScript' LIMIT 1),
  4
),
(
  (SELECT id FROM resumes WHERE resume_name = 'Software Developer Resume' LIMIT 1),
  'skill',
  (SELECT id FROM skills WHERE skill_name = 'Node.js' LIMIT 1),
  5
),
(
  (SELECT id FROM resumes WHERE resume_name = 'Software Developer Resume' LIMIT 1),
  'certification',
  (SELECT id FROM certifications WHERE certification_name = 'Google Data Analytics Certificate' LIMIT 1),
  6
),
(
  (SELECT id FROM resumes WHERE resume_name = 'Software Developer Resume' LIMIT 1),
  'award',
  (SELECT id FROM awards WHERE award_name = 'Outstanding Web Project' LIMIT 1),
  7
);

COMMIT;

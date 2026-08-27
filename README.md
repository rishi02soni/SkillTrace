# SkillTrace


> Map your skills. Find your path.

SkillTrace is a graph-based career exploration application that helps students understand how their current skills connect to jobs, companies, and learning resources.

The application uses **CognoDB** as the graph database and the official **Neo4j JavaScript driver** to work with connected career data.

Live Link :- https://trace-skill2-0.vercel.app/
---

##  Overview

Students often know the skills they have, but it can be difficult to understand:

- Which jobs match their current skills
- Which skills are missing for a target role
- Which courses can help fill those gaps
- Which companies offer relevant opportunities

SkillTrace models these entities and their relationships as a graph, making it easier to explore career paths through connected data.

---

##  Features

- Student skill profiles
- Career and job matching
- Skill-gap analysis
- Recommended learning resources
- Job and company exploration
- Graph relationship visualization
- Multi-hop graph traversal
- Search and filtering
- Loading, empty, and error states
- Responsive user interface

---

##  Why a Graph Database?

The core of SkillTrace is based on relationships between entities rather than isolated records.

```
Student
   |
   | HAS_SKILL
   ↓
Skill
   |
   | REQUIRED_FOR
   ↓
Job
   |
   | OFFERED_BY
   ↓
Company
````

A student can have multiple skills, a skill can be required by multiple jobs, and each job can be associated with a company.

This makes graph traversal a natural fit for queries such as:

```
Student → Skill → Job
```

and:

```
Student → Skill → Job → Company
```

These relationship-based queries can require more complex joins and query logic in a relational database.

---

##  Architecture

```
                    ┌───────────────────┐
                    │       User        │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  React Frontend   │
                    │   Tailwind CSS    │
                    └─────────┬─────────┘
                              │ REST API
                              ▼
                    ┌───────────────────┐
                    │ Node.js + Express │
                    └─────────┬─────────┘
                              │
                              │ Neo4j Driver
                              ▼
                    ┌───────────────────┐
                    │      CognoDB      │
                    │  Graph Database   │
                    └───────────────────┘
```

---

##  Graph Data Model

### Nodes

* **Student** — `name`, `college`, `experience`
* **Skill** — `name`, `category`, `level`
* **Course** — `title`, `level`, `description`
* **Job** — `title`, `location`, `experienceRequired`
* **Company** — `name`, `industry`, `location`

### Relationships

```
(Student)-[:HAS_SKILL]->(Skill)
(Student)-[:COMPLETED]->(Course)
(Course)-[:TEACHES]->(Skill)
(Skill)-[:REQUIRED_FOR]->(Job)
(Job)-[:OFFERED_BY]->(Company)
```

### Graph Diagram

```
                         ┌──────────────┐
                         │   Company    │
                         └──────▲───────┘
                                │
                           OFFERED_BY
                                │
┌──────────────┐          ┌─────┴──────┐
│   Student    │          │     Job    │
└──────┬───────┘          └─────▲──────┘
       │                         │
   HAS_SKILL                REQUIRED_FOR
       │                         │
       ▼                         │
┌──────────────┐                 │
│    Skill     │─────────────────┘
└──────▲───────┘
       │
     TEACHES
       │
       ▼
┌──────────────┐
│    Course    │
└──────────────┘
```

---

##  Tech Stack

### Frontend

* React
* Tailwind CSS
* JavaScript

### Backend

* Node.js
* Express.js
* Official Neo4j JavaScript Driver

### Database

* CognoDB
* openCypher
* Bolt protocol

### Deployment

* Vercel
* Render / Railway
* CognoDB Cloud

---

##  Project Structure

```
SkillTrace/
│
├── frontend/
├── backend/
├── scripts/
│   └── seed.js
├── cypher/
│   ├── career-match.cypher
│   ├── skill-gap.cypher
│   └── graph-traversal.cypher
├── screenshots/
├── .env.example
├── .gitignore
├── README.md
└── package.json
```
Future Updation 

---

##  Environment Variables

Create a `.env` file in the backend:

```
COGNODB_URI=bolt+s://your-instance.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your_password
```

Never commit the `.env` file to GitHub.

Use `.env.example`:

```
COGNODB_URI=
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=
```

---

##  CognoDB Setup

1. Create an account on CognoDB Cloud.
2. Create a free `c0` instance.
3. Copy the Bolt connection URI.
4. Save the generated password.
5. Add the credentials to `.env`.
6. Start the backend.
7. Run the seed script.

---

##  Local Setup

### Clone the repository

```
git clone https://github.com/YOUR_USERNAME/SkillTrace.git
cd SkillTrace
```

### Install backend dependencies

```
cd backend
npm install
```

### Install frontend dependencies

```
cd ../frontend
npm install
```

### Seed the database

From the project root:

```
node scripts/seed.js
```

Or, if configured:

```
npm run seed
```

### Start the backend

```
cd backend
npm run dev
```

### Start the frontend

Open another terminal:

```
cd frontend
npm run dev
```

Then open the local URL shown in the terminal.

---

##  Main Graph Queries

### Find jobs based on a student's skills

```
MATCH (s:Student)-[:HAS_SKILL]->(skill:Skill)-[:REQUIRED_FOR]->(job:Job)
WHERE s.name = $studentName
RETURN DISTINCT job;
```

This is a multi-hop traversal:

```
Student → Skill → Job
```

### Find companies connected to a student's skills

```
MATCH (s:Student)-[:HAS_SKILL]->(skill:Skill)
      -[:REQUIRED_FOR]->(job:Job)
      -[:OFFERED_BY]->(company:Company)
WHERE s.name = $studentName
RETURN DISTINCT company;
```

This traversal is:

```
Student → Skill → Job → Company
```

### Skill-gap analysis

The application compares the skills a student currently has with the skills required for a selected job to identify missing skills.

Keep the exact query used in the application inside:

```
cypher/skill-gap.cypher
```

---

##  Query Safety

All database queries use parameters instead of string concatenation.

Example:

```
const query = `
  MATCH (s:Student {name: $name})
  RETURN s
`;

await session.run(query, {
  name: studentName
});
```

User input is never directly concatenated into Cypher queries.

---

##  Core User Flow

```
Select Student
      ↓
View Current Skills
      ↓
Select Target Job
      ↓
Calculate Career Match
      ↓
View Matched Skills
      ↓
View Missing Skills
      ↓
Explore Recommended Courses
      ↓
Explore Graph Connections
```

---

##  Screenshots

### Dashboard

![Dashboard](screenshots/01-dashboard.png)

### Career Match

![Career Match](screenshots/02-career-match.png)

### Skill Gap

![Skill Gap](screenshots/03-skill-gap.png)

### Graph Explorer

![Graph Explorer](screenshots/04-graph.png)

---

##  Live Demo

**Hosted Application:**
[https://YOUR-LIVE-DEMO-URL](https://YOUR-LIVE-DEMO-URL)

---

##  Demo Video

**Screen Recording:**
YOUR-DEMO-VIDEO-LINK

The demo covers:

1. Student selection
2. Skill exploration
3. Career matching
4. Skill-gap analysis
5. Graph traversal
6. Connected companies and learning resources

---

##  Deployment

### Frontend

Deploy the React frontend using Vercel.

Set:

```
VITE_API_URL=https://your-backend-url.com
```

### Backend

Deploy the Node.js backend using Render or Railway.

Add:

```
COGNODB_URI=
COGNODB_USERNAME=
COGNODB_PASSWORD=
```

---

##  Error Handling

SkillTrace handles common failures such as:

* Database unavailable
* API request failures
* Empty search results
* Loading states
* Invalid selections

Example:

```
Unable to connect to the career database.

Please try again.
```

---

##  Future Improvements

* Detailed career paths
* Skill proficiency tracking
* User authentication
* Real job-market data
* Company-specific career paths
* Advanced graph analytics
* Personalized learning paths

---

##  Assignment Context

This project was built as part of the **Wexa AI – CognoDB Take-Home Assignment**.

The application demonstrates:

* Graph data modeling
* Realistic seed data
* Multi-hop Cypher queries
* Parameterized database queries
* A functional web application
* Clean UI/UX
* Error handling
* CognoDB integration

---

##  Author

**Rishi Soni**

GitHub: [https://github.com/YOUR_USERNAME](https://github.com/YOUR_USERNAME)

LinkedIn: [https://www.linkedin.com/in/YOUR_LINKEDIN_USERNAME/](https://www.linkedin.com/in/rishi-soni-28986923b/)

---

# ⭐ SkillTrace

**Map your skills. Find your path.**

```
```

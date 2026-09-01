// ==========================================
// SkillPath - Main Client JavaScript
// ==========================================

// ------------------------------------------
// State Variables 
// ------------------------------------------

let currentStudentId = 'std_1';
let currentTargetJobId = 'job_be';
let activeTab = 'dashboard';
let isDbConnected = true;
let selectedCodeFile = 'README.md';


// ------------------------------------------
// Student Skills
// ------------------------------------------

function getStudentSkills(studentId) {
    const edges = INITIAL_GRAPH_EDGES.filter(
        e => e.from === studentId && e.type === 'HAS_SKILL'
    );

    return edges.map(edge => {
        const sk = INITIAL_SKILLS.find(s => s.id === edge.to);

        return {
            ...sk,
            level: edge.level || sk.level
        };
    });
}


// ------------------------------------------
// Career Match Calculation
// ------------------------------------------

function calculateMatch(studentId, jobId) {

    const reqEdges = INITIAL_GRAPH_EDGES.filter(
        e => e.to === jobId && e.type === 'REQUIRED_FOR'
    );

    const reqSkills = reqEdges
        .map(e => INITIAL_SKILLS.find(s => s.id === e.from))
        .filter(Boolean);

    const stEdges = INITIAL_GRAPH_EDGES.filter(
        e => e.from === studentId && e.type === 'HAS_SKILL'
    );

    const stSkillIds = new Set(
        stEdges.map(e => e.to)
    );

    const matched = reqSkills.filter(
        sk => stSkillIds.has(sk.id)
    );

    const missing = reqSkills.filter(
        sk => !stSkillIds.has(sk.id)
    );

    const matchPercent =
        reqSkills.length > 0
            ? Math.round((matched.length / reqSkills.length) * 100)
            : 0;

    // Find courses that teach missing skills
    const missingIds = new Set(
        missing.map(m => m.id)
    );

    const courseEdges = INITIAL_GRAPH_EDGES.filter(
        e =>
            e.type === 'TEACHES' &&
            missingIds.has(e.to)
    );

    const recommendedCourses = courseEdges
        .map(edge => ({
            course: INITIAL_COURSES.find(
                c => c.id === edge.from
            ),
            skill: INITIAL_SKILLS.find(
                s => s.id === edge.to
            )
        }))
        .filter(i => i.course);

    return {
        matchPercent,
        requiredSkills: reqSkills,
        matchedSkills: matched,
        missingSkills: missing,
        recommendedCourses
    };
}


// ------------------------------------------
// Dashboard Rendering
// ------------------------------------------

function renderDashboard() {

    const student = INITIAL_STUDENTS.find(
        s => s.id === currentStudentId
    );

    const studentSkills =
        getStudentSkills(currentStudentId);

    const targetJob = INITIAL_JOBS.find(
        j => j.id === currentTargetJobId
    );

    const match =
        calculateMatch(
            currentStudentId,
            currentTargetJobId
        );


    // Metrics

    document.getElementById(
        'metric-skills-count'
    ).innerText = studentSkills.length;

    document.getElementById(
        'metric-skills-adv'
    ).innerText =
        `${studentSkills.filter(
            s => s.level === 'Advanced'
        ).length} Advanced level`;


    const suitableJobsCount =
        INITIAL_JOBS.filter(
            j =>
                calculateMatch(
                    currentStudentId,
                    j.id
                ).matchPercent >= 70
        ).length;

    document.getElementById(
        'metric-jobs-count'
    ).innerText =
        `${suitableJobsCount} Roles`;


    document.getElementById(
        'metric-gaps-count'
    ).innerText =
        `${match.missingSkills.length} Skills`;

    document.getElementById(
        'metric-target-role'
    ).innerText =
        `For target: ${targetJob.title}`;


    document.getElementById(
        'metric-courses-count'
    ).innerText =
        `${match.recommendedCourses.length} Courses`;


    document.getElementById(
        'active-student-name-label'
    ).innerText = student.name;


    // Career Options

    const optionsGrid =
        document.getElementById(
            'career-options-grid'
        );

    optionsGrid.innerHTML = '';


    INITIAL_JOBS.forEach(job => {

        const jobMatch =
            calculateMatch(
                currentStudentId,
                job.id
            );

        const comp =
            INITIAL_COMPANIES.find(
                c => c.id === job.companyId
            );


        const cardHtml = `
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">

                <div>

                    <div class="flex items-start justify-between">

                        <div>

                            <h3 class="font-bold text-slate-900 text-base">
                                ${job.title}
                            </h3>

                            <p class="text-xs text-slate-500 flex items-center mt-0.5">

                                <i
                                    data-lucide="building-2"
                                    class="w-3.5 h-3.5 mr-1 text-slate-400">
                                </i>

                                ${comp ? comp.name : ''}
                                • ${job.location}

                            </p>

                        </div>


                        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                            jobMatch.matchPercent >= 80
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : jobMatch.matchPercent >= 60
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }">

                            Match:
                            ${jobMatch.matchPercent}%

                        </span>

                    </div>


                    <div class="mt-4">

                        <span class="text-xs text-slate-400 font-semibold block uppercase mb-2">
                            Required Skills:
                        </span>

                        <div class="flex flex-wrap gap-1.5">

                            ${jobMatch.requiredSkills.map(sk => {

                                const isOwned =
                                    studentSkills.some(
                                        s => s.id === sk.id
                                    );

                                return `
                                    <span class="text-xs px-2 py-0.5 rounded border ${
                                        isOwned
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }">

                                        ${sk.name}

                                    </span>
                                `;

                            }).join('')}

                        </div>

                    </div>

                </div>


                <div class="pt-3 border-t border-slate-100 flex items-center justify-between">

                    <span class="text-xs text-slate-500 font-medium">
                        ${job.baseSalary}
                    </span>

                    <button
                        onclick="selectJobAndMatch('${job.id}')"
                        class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors">

                        <span>View Match</span>

                        <i
                            data-lucide="chevron-right"
                            class="w-3.5 h-3.5">
                        </i>

                    </button>

                </div>

            </div>
        `;

        optionsGrid.innerHTML += cardHtml;

    });


    lucide.createIcons();
}


// ------------------------------------------
// Student Profile
// ------------------------------------------

function renderProfile() {

    const student =
        INITIAL_STUDENTS.find(
            s => s.id === currentStudentId
        );

    const skills =
        getStudentSkills(currentStudentId);


    document.getElementById(
        'profile-avatar'
    ).innerText =
        student.name
            .split(' ')
            .map(n => n[0])
            .join('');


    document.getElementById(
        'profile-name'
    ).innerText =
        student.name;


    document.getElementById(
        'profile-college'
    ).innerText =
        student.college;


    document.getElementById(
        'profile-exp'
    ).innerText =
        student.experience;


    document.getElementById(
        'profile-target'
    ).innerText =
        `Targeting: ${student.targetRole}`;


    document.getElementById(
        'profile-node-id'
    ).innerText =
        `(s:Student {id: "${student.id}"})`;


    document.getElementById(
        'profile-skill-count-badge'
    ).innerText =
        `${skills.length} Total Skills`;


    const skillsList =
        document.getElementById(
            'profile-skills-list'
        );


    skillsList.innerHTML =
        skills.map(sk => `

            <div class="py-3 flex items-center justify-between">

                <div>

                    <span class="font-semibold text-slate-800 text-sm block">
                        ${sk.name}
                    </span>

                    <span class="text-xs text-slate-500">
                        ${sk.category}
                    </span>

                </div>


                <span class="text-xs px-2.5 py-1 rounded-full font-medium ${
                    sk.level === 'Advanced'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : sk.level === 'Intermediate'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                }">

                    ${sk.level}

                </span>

            </div>

        `).join('');


    // Completed Courses

    const completedEdges =
        INITIAL_GRAPH_EDGES.filter(
            e =>
                e.from === currentStudentId &&
                e.type === 'COMPLETED'
        );


    const courses =
        completedEdges
            .map(
                e =>
                    INITIAL_COURSES.find(
                        c => c.id === e.to
                    )
            )
            .filter(Boolean);


    const coursesList =
        document.getElementById(
            'profile-courses-list'
        );


    if (courses.length > 0) {

        coursesList.innerHTML =
            courses.map(c => `

                <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">

                    <div class="flex items-center justify-between">

                        <span class="text-xs font-semibold text-slate-800">
                            ${c.title}
                        </span>

                        <i
                            data-lucide="check-circle-2"
                            class="w-4 h-4 text-emerald-600 flex-shrink-0">
                        </i>

                    </div>

                    <p class="text-xs text-slate-500 mt-1">
                        ${c.provider} • ${c.duration}
                    </p>

                </div>

            `).join('');

    } else {

        coursesList.innerHTML = `
            <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">

                No completed courses recorded yet.

            </div>
        `;
    }


    lucide.createIcons();
}


// ------------------------------------------
// Career Match Page
// ------------------------------------------

function renderMatch() {

    const student =
        INITIAL_STUDENTS.find(
            s => s.id === currentStudentId
        );

    const job =
        INITIAL_JOBS.find(
            j => j.id === currentTargetJobId
        );

    const comp =
        INITIAL_COMPANIES.find(
            c => c.id === job.companyId
        );

    const match =
        calculateMatch(
            currentStudentId,
            currentTargetJobId
        );


    document.getElementById(
        'match-job-title'
    ).innerText =
        job.title;


    document.getElementById(
        'match-job-meta'
    ).innerText =
        `${comp ? comp.name : ''} • ${job.location}`;


    document.getElementById(
        'match-score-text'
    ).innerText =
        `${match.matchPercent}%`;


    document.getElementById(
        'match-score-circle'
    ).innerText =
        `${match.matchPercent}%`;


    // Matched Skills

    document.getElementById(
        'matched-count-badge'
    ).innerText =
        `${match.matchedSkills.length} Matched`;


    document.getElementById(
        'matched-skills-list'
    ).innerHTML =

        match.matchedSkills
            .map(sk => `

                <div class="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between">

                    <div class="flex items-center space-x-2">

                        <span class="text-emerald-600 font-bold">
                            ✓
                        </span>

                        <span class="font-semibold text-slate-800 text-sm">
                            ${sk.name}
                        </span>

                    </div>

                    <span class="text-xs text-slate-500">
                        ${sk.category}
                    </span>

                </div>

            `).join('')

        ||

        `<p class="text-xs text-slate-500 italic py-2">
            No matching skills found.
        </p>`;


    // Missing Skills

    document.getElementById(
        'missing-count-badge'
    ).innerText =
        `${match.missingSkills.length} Required Gaps`;


    document.getElementById(
        'missing-skills-list'
    ).innerHTML =

        match.missingSkills
            .map(sk => `

                <div class="p-3 bg-amber-50/40 rounded-lg border border-amber-200/60 flex items-center justify-between">

                    <div class="flex items-center space-x-2">

                        <span class="text-amber-600 font-bold">
                            •
                        </span>

                        <span class="font-semibold text-slate-800 text-sm">
                            ${sk.name}
                        </span>

                    </div>

                    <span class="text-xs text-slate-500">
                        ${sk.category}
                    </span>

                </div>

            `).join('')

        ||

        `
        <div class="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 font-medium">

            100% core skills fulfilled!

        </div>
        `;


    // Recommended Courses

    document.getElementById(
        'recommended-courses-grid'
    ).innerHTML =

        match.recommendedCourses
            .map(({ course, skill }) => `

                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">

                    <div>

                        <div class="flex items-center justify-between">

                            <span class="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">

                                Teaches:
                                ${skill.name}

                            </span>

                            <span class="text-xs text-slate-500">
                                ${course.level}
                            </span>

                        </div>


                        <h4 class="font-bold text-slate-900 text-sm mt-2">
                            ${course.title}
                        </h4>


                        <p class="text-xs text-slate-500 mt-1">
                            ${course.provider} • ${course.duration}
                        </p>

                    </div>

                </div>

            `).join('')

        ||

        `
        <div class="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200">

            No additional courses required.

        </div>
        `;


    // Explanation

    document.getElementById(
        'match-explanation-banner'
    ).innerHTML = `

        <p>

            “${student.name} already possesses
            ${match.matchedSkills.length}
            of the
            ${match.requiredSkills.length}
            core skills required for
            ${job.title}.

            ${
                match.missingSkills.length > 0
                    ? `Learning ${match.missingSkills
                        .map(s => s.name)
                        .join(' and ')}
                       would achieve 100% match.`
                    : 'Fully qualified role.'
            }”

        </p>

    `;


    // Cypher Query

    document.getElementById(
        'cypher-trace-code'
    ).innerText =

`MATCH (s:Student {id: "${student.id}"})
MATCH (j:Job {id: "${job.id}"})-[:OFFERED_BY]->(cmp:Company)
MATCH (reqSkill:Skill)-[:REQUIRED_FOR]->(j)
OPTIONAL MATCH (s)-[:HAS_SKILL]->(hasSkill:Skill)
WITH s, j, cmp, collect(reqSkill) AS required, collect(hasSkill) AS owned
RETURN required, [sk IN required WHERE sk IN owned] AS matchedSkills;`;


    lucide.createIcons();
}


// ------------------------------------------
// Graph View
// ------------------------------------------

function renderGraph() {

    const student =
        INITIAL_STUDENTS.find(
            s => s.id === currentStudentId
        );

    const studentSkills =
        getStudentSkills(currentStudentId);

    const job =
        INITIAL_JOBS.find(
            j => j.id === currentTargetJobId
        );

    const company =
        INITIAL_COMPANIES.find(
            c => c.id === job.companyId
        );


    const container =
        document.getElementById(
            'graph-canvas-container'
        );


    container.innerHTML = `

        <div class="w-full max-w-4xl space-y-12">


            <!-- Student -->

            <div class="flex justify-center">

                <div class="p-4 bg-white border-2 border-blue-500 rounded-xl shadow-md flex items-center space-x-3 text-slate-900">

                    <div class="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">

                        <i
                            data-lucide="users"
                            class="w-5 h-5">
                        </i>

                    </div>


                    <div>

                        <span class="text-xs text-blue-600 font-bold uppercase tracking-wider block">

                            Student

                        </span>

                        <span class="font-bold text-sm">

                            ${student.name}
                            (${student.college})

                        </span>

                    </div>

                </div>

            </div>


            <!-- Relationship -->

            <div class="flex justify-center -my-6">

                <span class="text-xs font-mono font-bold bg-white text-slate-500 px-3 py-1 rounded-full border border-slate-300 shadow-sm">

                    ↓ HAS_SKILL

                </span>

            </div>


            <!-- Skills -->

            <div class="flex flex-wrap justify-center gap-4">

                ${studentSkills.map(sk => `

                    <div class="p-3 bg-white border-2 border-emerald-500 rounded-lg shadow-sm flex items-center space-x-2">

                        <i
                            data-lucide="award"
                            class="w-4 h-4 text-emerald-600">
                        </i>

                        <div>

                            <span class="text-[10px] text-emerald-600 font-bold block uppercase">

                                Skill

                            </span>

                            <span class="text-xs font-bold text-slate-800">

                                ${sk.name}

                            </span>

                        </div>

                    </div>

                `).join('')}

            </div>


            <!-- Relationship -->

            <div class="flex justify-center -my-6">

                <span class="text-xs font-mono font-bold bg-white text-slate-500 px-3 py-1 rounded-full border border-slate-300 shadow-sm">

                    ↓ REQUIRED_FOR

                </span>

            </div>


            <!-- Job + Company -->

            <div class="flex flex-wrap justify-center gap-6">


                <!-- Job -->

                <div class="p-4 bg-white border-2 border-amber-500 rounded-xl shadow-md flex items-center space-x-3">

                    <div class="w-9 h-9 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold">

                        <i
                            data-lucide="briefcase"
                            class="w-4 h-4">
                        </i>

                    </div>


                    <div>

                        <span class="text-xs text-amber-600 font-bold uppercase tracking-wider block">

                            Job

                        </span>

                        <span class="font-bold text-sm text-slate-900">

                            ${job.title}

                        </span>

                    </div>

                </div>


                <!-- Relationship -->

                <div class="hidden sm:flex items-center text-slate-400 font-mono text-xs">

                    ────── OFFERED_BY ──────►

                </div>


                <!-- Company -->

                <div class="p-4 bg-white border-2 border-purple-500 rounded-xl shadow-md flex items-center space-x-3">

                    <div class="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold">

                        <i
                            data-lucide="building-2"
                            class="w-4 h-4">
                        </i>

                    </div>


                    <div>

                        <span class="text-xs text-purple-600 font-bold uppercase tracking-wider block">

                            Company

                        </span>

                        <span class="font-bold text-sm text-slate-900">

                            ${company ? company.name : ''}

                        </span>

                    </div>

                </div>


            </div>

        </div>

    `;


    lucide.createIcons();
}


// ------------------------------------------
// Skills Catalog
// ------------------------------------------

function renderSkills() {

    const searchVal =
        document.getElementById(
            'skills-search-input'
        ).value.toLowerCase();


    const catVal =
        document.getElementById(
            'skills-category-select'
        ).value;


    const filtered =
        INITIAL_SKILLS.filter(sk => {

            const matchesSearch =
                sk.name
                    .toLowerCase()
                    .includes(searchVal);

            const matchesCat =
                catVal === 'All' ||
                sk.category === catVal;

            return matchesSearch && matchesCat;

        });


    const tableBody =
        document.getElementById(
            'skills-table-body'
        );


    tableBody.innerHTML =
        filtered.map(sk => {

            const jobsCount =
                INITIAL_GRAPH_EDGES.filter(
                    e =>
                        e.from === sk.id &&
                        e.type === 'REQUIRED_FOR'
                ).length;


            const courseCount =
                INITIAL_GRAPH_EDGES.filter(
                    e =>
                        e.to === sk.id &&
                        e.type === 'TEACHES'
                ).length;


            return `

                <tr class="hover:bg-slate-50 transition-colors">

                    <td class="px-6 py-4 font-bold text-slate-900">

                        ${sk.name}

                    </td>


                    <td class="px-6 py-4">

                        <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-medium border border-slate-200">

                            ${sk.category}

                        </span>

                    </td>


                    <td class="px-6 py-4">

                        <span class="text-xs px-2.5 py-1 rounded-full font-medium ${
                            sk.level === 'Advanced'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sk.level === 'Intermediate'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }">

                            ${sk.level}

                        </span>

                    </td>


                    <td class="px-6 py-4 font-semibold text-slate-800">

                        ${jobsCount} Jobs

                    </td>


                    <td class="px-6 py-4 font-semibold text-slate-800">

                        ${courseCount} Courses

                    </td>

                </tr>

            `;

        }).join('');
}


// ------------------------------------------
// Code Viewer
// ------------------------------------------

function renderCodeViewer() {

    const selectorList =
        document.getElementById(
            'file-selector-list'
        );


    selectorList.innerHTML =
        Object.keys(CODE_FILES)
            .map(fileName => `

                <button
                    onclick="selectCodeFile('${fileName}')"
                    class="w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center space-x-2 transition-colors ${
                        selectedCodeFile === fileName
                            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                            : 'text-slate-600 hover:bg-slate-100'
                    }">

                    <i
                        data-lucide="file-text"
                        class="w-3.5 h-3.5 flex-shrink-0 text-slate-400">
                    </i>

                    <span class="truncate">

                        ${fileName}

                    </span>

                </button>

            `)
            .join('');


    document.getElementById(
        'code-file-title'
    ).innerText =
        selectedCodeFile;


    document.getElementById(
        'code-content-block'
    ).innerText =
        CODE_FILES[selectedCodeFile];


    lucide.createIcons();
}


// ------------------------------------------
// Tab Switching
// ------------------------------------------

function switchTab(tabName) {

    activeTab = tabName;


    document
        .querySelectorAll('.tab-content')
        .forEach(el =>
            el.classList.remove('active')
        );


    document
        .querySelectorAll('.nav-btn')
        .forEach(el =>
            el.classList.remove('active')
        );


    document
        .getElementById(`tab-${tabName}`)
        .classList.add('active');


    const navBtn =
        document.getElementById(
            `nav-${tabName}`
        );


    if (navBtn) {
        navBtn.classList.add('active');
    }


    if (tabName === 'dashboard')
        renderDashboard();

    if (tabName === 'profile')
        renderProfile();

    if (tabName === 'match')
        renderMatch();

    if (tabName === 'graph')
        renderGraph();

    if (tabName === 'skills')
        renderSkills();

    if (tabName === 'code')
        renderCodeViewer();
}


// ------------------------------------------
// Student Selectors
// ------------------------------------------

function handleStudentChange(stdId) {

    currentStudentId = stdId;

    document.getElementById(
        'match-student-select'
    ).value = stdId;

    renderDashboard();
}


function handleMatchStudentChange(stdId) {

    currentStudentId = stdId;

    document.getElementById(
        'student-select'
    ).value = stdId;

    renderMatch();
}


// ------------------------------------------
// Job Selector
// ------------------------------------------

function handleMatchJobChange(jobId) {

    currentTargetJobId = jobId;

    renderMatch();
}


function selectJobAndMatch(jobId) {

    currentTargetJobId = jobId;

    document.getElementById(
        'match-job-select'
    ).value = jobId;

    switchTab('match');
}


// ------------------------------------------
// Skills Filter
// ------------------------------------------

function handleSkillsFilter() {

    renderSkills();
}


// ------------------------------------------
// Code File Selector
// ------------------------------------------

function selectCodeFile(fileName) {

    selectedCodeFile = fileName;

    renderCodeViewer();
}


// ------------------------------------------
// Copy Code
// ------------------------------------------

function copyActiveFileCode() {

    const text =
        CODE_FILES[selectedCodeFile];


    if (navigator.clipboard && text) {

        navigator.clipboard.writeText(text);


        const btnLabel =
            document.getElementById(
                'copy-btn-label'
            );


        btnLabel.innerText = 'Copied!';


        setTimeout(() => {

            btnLabel.innerText =
                'Copy File Content';

        }, 2000);
    }
}


// ------------------------------------------
// Database Connection Simulator
// ------------------------------------------

function toggleDbConnection() {

    isDbConnected =
        !isDbConnected;


    const banner =
        document.getElementById(
            'db-error-banner'
        );


    const btn =
        document.getElementById(
            'db-status-btn'
        );


    const dot =
        document.getElementById(
            'db-status-dot'
        );


    const text =
        document.getElementById(
            'db-status-text'
        );


    if (isDbConnected) {

        banner.classList.add('hidden');


        btn.className =
            'px-2.5 py-1 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';


        dot.className =
            'w-2 h-2 rounded-full bg-emerald-500';


        text.innerText =
            'CognoDB Connected';

    } else {

        banner.classList.remove('hidden');


        btn.className =
            'px-2.5 py-1 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';


        dot.className =
            'w-2 h-2 rounded-full bg-rose-500';


        text.innerText =
            'Simulate DB Error';
    }
}


// ------------------------------------------
// Retry Database Connection
// ------------------------------------------

function retryDbConnection() {

    setTimeout(() => {

        isDbConnected = true;

        // Original code toggles the state,
        // so force UI to connected state here.

        const banner =
            document.getElementById(
                'db-error-banner'
            );

        const btn =
            document.getElementById(
                'db-status-btn'
            );

        const dot =
            document.getElementById(
                'db-status-dot'
            );

        const text =
            document.getElementById(
                'db-status-text'
            );

        banner.classList.add('hidden');

        btn.className =
            'px-2.5 py-1 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';

        dot.className =
            'w-2 h-2 rounded-full bg-emerald-500';

        text.innerText =
            'CognoDB Connected';

    }, 500);
}


// ------------------------------------------
// Application Initialization
// ------------------------------------------

window.onload = function () {

    console.log(
        'SkillPath loaded successfully.'
    );


    // Student Selectors

    const studentSelect =
        document.getElementById(
            'student-select'
        );


    const matchStudentSelect =
        document.getElementById(
            'match-student-select'
        );


    const studentOptions =
        INITIAL_STUDENTS
            .map(s => `

                <option value="${s.id}">

                    ${s.name}
                    (${s.college})

                </option>

            `)
            .join('');


    studentSelect.innerHTML =
        studentOptions;


    matchStudentSelect.innerHTML =
        studentOptions;


    // Job Selector

    const matchJobSelect =
        document.getElementById(
            'match-job-select'
        );


    matchJobSelect.innerHTML =
        INITIAL_JOBS
            .map(j => {

                const comp =
                    INITIAL_COMPANIES.find(
                        c =>
                            c.id === j.companyId
                    );


                return `

                    <option value="${j.id}">

                        ${j.title}
                        at
                        ${comp ? comp.name : ''}

                    </option>

                `;

            })
            .join('');


    // Initial Dashboard

    renderDashboard();


    // Lucide Icons

    lucide.createIcons();
};


// ------------------------------------------
// Console Message
// ------------------------------------------

console.log(
    'SkillPath JavaScript application loaded.'
);

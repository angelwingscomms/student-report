// src/lib/store.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// --- Helper Functions ---
function calculateGrade(score) {
    if (score === null || score === undefined || isNaN(score)) return ''; // Handle null/undefined scores
	if (score >= 90) return 'A+';
	if (score >= 80) return 'A';
	if (score >= 70) return 'B+';
	if (score >= 60) return 'B';
	if (score >= 50) return 'C';
	if (score >= 40) return 'D';
	return 'E';
}

// Calculate Overall Remark based on GRADE (not average score directly)
function getOverallRemark(grade) {
	switch (grade) {
		case 'A+': return 'Excellent'; // Or Distinction? Image footer shows Excellent for A+
		case 'A': return 'Excellent';
		case 'B+': return 'Very Good';
		case 'B': return 'Good';
		case 'C': return 'Fair'; // Assuming
		case 'D': return 'Pass'; // Assuming
		case 'E': return 'Fail'; // Assuming
		default: return '';
	}
}


// --- Default Structures ---
const defaultCognitiveSubjects = [
    // Add 'remark: null' to each subject
    { subject: 'MATHEMATICS', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'ENGLISH STUDIES', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'BASIC SCIENCE', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'PHY. AND HEALTH EDU.', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'PREVOCATIONAL STUDIES', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'NATIONAL VALUES', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'CUL. AND CREATIVE ART', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'COMPUTER SCIENCE', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'FRENCH', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'HISTORY', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
    { subject: 'MUSIC', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null },
];

// Keep these as they are
const defaultPsychomotorSkills = {
    WRITING: 'A', READING: 'A', FLUENCY: 'A', GAME: 'A', SPORT: 'A', CREATIVITY: 'A', 'MUSICAL SKILLS': 'A', 'LANGUAGE SKILLS': 'A'
};

const defaultAffectiveSkills = {
    PUNCTUALITY: 'A', ATTENDANCE: 'A', RELIABILITY: 'A', NEATNESS: 'A', POLITENESS: 'A', HONESTY: 'A', 'RELATIONSHIP WITH STAFF MEMBERS': 'A', 'RELATIONSHIP WITH FELLOW STUDENTS': 'A', 'SELF-CONTROL': 'A', 'CO-OPERATION': 'A', 'SENSE OF RESPONSIBILITY': 'A', ATTENTIVENESS: 'A', INITIATIVE: 'A', 'ORGANIZATIONAL ABILITY': 'A', PERSEVERANCE: 'A', 'PHYSICAL DEVELOPMENT': 'A'
};

function createNewStudent() {
    // Deep copy default structures
    return {
        id: Date.now().toString(), // Simple unique ID
        fullName: '',
        // dob: '', // REMOVED
        class: 'GRADE ONE',
        department: 'PRIMARY',
        // admissionNo: '', // REMOVED
        session: '2024/2025',
        // gender: 'FEMALE', // REMOVED
        // Performance Summary
        daysPresent: null,
        daysAbsent: null,
        daysSchoolOpened: null,
        totalPupils: null,
        classAverage: null,
        // Scores
        cognitive: JSON.parse(JSON.stringify(defaultCognitiveSubjects)), // Ensure deep copy includes new remark field
        // Skills
        psychomotor: { ...defaultPsychomotorSkills },
        affective: { ...defaultAffectiveSkills },
        // Remarks
        teacherRemark: '',
        resumptionDate: 'January 8th, 2025',
    };
}


// --- Store Logic ---
const initialStudentData = [createNewStudent()];

// Function to load from localStorage
const loadStudents = () => {
    if (!browser) return initialStudentData;
    const stored = localStorage.getItem('studentReports');
    try {
        const parsed = stored ? JSON.parse(stored) : initialStudentData;
        // Ensure data structure consistency
        return parsed.map(student => {
             // Remove potentially stored old fields explicitly if needed,
             // otherwise spread operator (...) handles extra fields okay.
             delete student.dob;
             delete student.gender;
             delete student.admissionNo;

            return {
                ...createNewStudent(), // Start with defaults (including null remarks)
                ...student, // Override with stored data
                // Ensure cognitive subjects have the remark field, even if loaded from older data
                 cognitive: (student.cognitive || defaultCognitiveSubjects).map((subj, i) => ({
                    ...(defaultCognitiveSubjects[i] || { subject: 'UNKNOWN', project: null, ca1: null, ca2: null, ca3: null, exam: null, remark: null }), // Default structure
                    ...(subj || {}), // Override with stored subject data
                    remark: subj?.remark !== undefined ? subj.remark : null // Ensure remark exists, default to null if missing
                })),
                psychomotor: { ...defaultPsychomotorSkills, ...(student.psychomotor || {}) },
                affective: { ...defaultAffectiveSkills, ...(student.affective || {}) },
            };
        });
    } catch (e) {
        console.error("Error parsing student data from localStorage:", e);
        localStorage.removeItem('studentReports'); // Clear corrupted data
        return initialStudentData;
    }
};

// Create the writable store
const { subscribe, set, update } = writable(loadStudents());

// Subscribe to changes and save to localStorage
if (browser) {
    subscribe(value => {
        try {
            // Add a check for empty array before stringifying
            if (value && value.length > 0) {
                 localStorage.setItem('studentReports', JSON.stringify(value));
            } else {
                localStorage.removeItem('studentReports'); // Clear storage if array is empty
            }
        } catch (e) {
             console.error("Error saving student data to localStorage:", e);
        }
    });
}

// Export store functions and helpers
export const studentReports = {
    subscribe,
    set,
    update,
    addStudent: () => update(students => [...students, createNewStudent()]),
    removeStudent: (id) => update(students => students.filter(s => s.id !== id)),
};

// Export only needed helpers
export { calculateGrade, getOverallRemark };
<script>
	import { studentReports, calculateGrade, getOverallRemark } from '$lib/store.js';
	import { browser } from '$app/environment';
    import logo from '$lib/logo.jpg';

	// State for View/Edit mode
	let viewMode = false; // Start in Edit Mode

	// State to manage which student report is currently active
	let activeStudentId = $studentReports[0]?.id || null;
	let activeStudentIndex = 0;

	// Grade options for dropdowns
	const gradeOptions = ['A', 'B', 'C', 'D', 'E'];
	// Remark options for cognitive subjects
	const remarkOptions = ["Distinction", "Excellent", "Very Good", "Good"];

	// Reactive statement to find the index of the active student
	$: {
		if (browser) {
			activeStudentIndex = $studentReports.findIndex(s => s.id === activeStudentId);
			if (activeStudentIndex === -1 && $studentReports.length > 0) {
				activeStudentId = $studentReports[0].id;
				activeStudentIndex = 0;
			} else if ($studentReports.length === 0) {
				activeStudentId = null;
				activeStudentIndex = -1;
			}
            // If switching student, reset to Edit mode? Optional, maybe keep mode persistent.
            // viewMode = false;
		}
	}

	// --- Calculation Helpers (Reactive) ---
    let cognitiveTotals = { caTotalSum: 0, examTotalSum: 0, grandTotalSum: 0 };
    let studentAverage = 0;
    let studentOverallGrade = '';
    let studentOverallRemark = ''; // New state for overall remark

    $: {
        if (activeStudentIndex !== -1 && $studentReports[activeStudentIndex]) {
            const currentStudent = $studentReports[activeStudentIndex];
            let caSum = 0;
            let examSum = 0;
            let totalSum = 0;
            let validSubjectCount = 0;

            currentStudent.cognitive.forEach(subj => {
                const ca = (Number(subj.project) || 0) + (Number(subj.ca1) || 0) + (Number(subj.ca2) || 0) + (Number(subj.ca3) || 0);
                const ex = Number(subj.exam) || 0;
                const subjTotal = ca + ex;

                 // Ensure scores are treated as numbers for calculation
                const projectScore = Number(subj.project) || 0;
                const ca1Score = Number(subj.ca1) || 0;
                const ca2Score = Number(subj.ca2) || 0;
                const ca3Score = Number(subj.ca3) || 0;
                const examScore = Number(subj.exam) || 0;
                const currentCaTotal = projectScore + ca1Score + ca2Score + ca3Score;
                const currentTotalScore = currentCaTotal + examScore;

                // Check if the subject has *any* score input to be counted for average
                if (subj.project !== null || subj.ca1 !== null || subj.ca2 !== null || subj.ca3 !== null || subj.exam !== null) {
                     validSubjectCount++;
                     caSum += currentCaTotal;
                     examSum += examScore;
                     totalSum += currentTotalScore;
                }
            });

            cognitiveTotals = {
                caTotalSum: caSum,
                examTotalSum: examSum,
                grandTotalSum: totalSum
            };

            studentAverage = validSubjectCount > 0 ? (totalSum / validSubjectCount) : 0;
            studentOverallGrade = calculateGrade(studentAverage); // Calculate grade from average
            studentOverallRemark = getOverallRemark(studentOverallGrade); // Calculate overall remark from overall grade

        } else {
            cognitiveTotals = { caTotalSum: 0, examTotalSum: 0, grandTotalSum: 0 };
            studentAverage = 0;
            studentOverallGrade = '';
            studentOverallRemark = '';
        }
    }

    // --- Input Handlers ---
    function handleStoreUpdate() {
        // Helper to explicitly trigger store update for localStorage persistence
        studentReports.update(s => s);
    }

    function handleNumberInput(event, studentIndex, subjectIndex, field) {
        const value = event.target.value === '' ? null : Number(event.target.value);
        if (value !== null && isNaN(value)) return;
        $studentReports[studentIndex].cognitive[subjectIndex][field] = value;
        handleStoreUpdate();
    }

     function handleGenericInput(event, studentIndex, field) {
        const value = event.target.value;
        $studentReports[studentIndex][field] = value;
        handleStoreUpdate();
    }

     function handleNumberInputDirect(event, studentIndex, field) {
        const value = event.target.value === '' ? null : Number(event.target.value);
        if (value !== null && isNaN(value)) return;
        $studentReports[studentIndex][field] = value;
        handleStoreUpdate();
    }

	 function handleSkillChange(event, studentIndex, skillType, skillName) {
		 $studentReports[studentIndex][skillType][skillName] = event.target.value;
		 handleStoreUpdate();
	 }

     function handleCognitiveRemarkChange(event, studentIndex, subjectIndex) {
         $studentReports[studentIndex].cognitive[subjectIndex].remark = event.target.value || null; // Store selected remark or null if empty
         handleStoreUpdate();
     }

	 // --- Report Management ---
	 function addNewReport() {
		 studentReports.addStudent();
		 // Automatically select the newly added student and ensure Edit mode
		 activeStudentId = $studentReports[$studentReports.length - 1].id;
         viewMode = false;
	 }

	 function deleteCurrentReport() {
		 if (activeStudentId && confirm(`Are you sure you want to delete the report for ${$studentReports[activeStudentIndex]?.fullName || 'this student'}?`)) {
			 studentReports.removeStudent(activeStudentId);
             // activeStudentId and activeStudentIndex will update reactively
             // If last student was deleted, handle gracefully (already done by reactive block)
		 }
	 }

     // Helper to display value or placeholder
     function displayValue(value, placeholder = '---') {
         return (value !== null && value !== undefined && value !== '') ? value : placeholder;
     }

</script>

<div class="container mx-auto p-4 bg-gray-100 min-h-screen">
	<!-- Controls: Student Selector, Add/Delete, View/Edit Toggle -->
    <div class="mb-4 flex flex-wrap justify-between items-center gap-4">
		<div class="flex items-center gap-2">
			<label for="studentSelect" class="font-semibold">Select Student:</label>
			<select id="studentSelect" bind:value={activeStudentId} class="p-2 border rounded bg-white">
				{#each $studentReports as student (student.id)}
					<option value={student.id}>
						{student.fullName || `Report ${student.id.slice(-4)}`}
					</option>
				{/each}
                {#if $studentReports.length === 0}
                 <option value={null} disabled>No reports available</option>
                {/if}
			</select>
		</div>
		<div class="flex items-center gap-2">
            <button on:click={() => viewMode = !viewMode} class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
				{viewMode ? 'Switch to Edit Mode' : 'Switch to View Mode'}
			</button>
			<button on:click={addNewReport} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
				Add New
			</button>
			{#if activeStudentId}
				<button on:click={deleteCurrentReport} class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
					Delete Current
				</button>
			{/if}
		</div>
	</div>

	{#if activeStudentIndex !== -1 && $studentReports[activeStudentIndex]}
		{@const student = $studentReports[activeStudentIndex]}
		<!-- Report Card Structure with Double Border -->
        <div class="border-4 border-blue-700 p-1"> <!-- Outer border -->
            <div class="border-4 border-blue-700 p-5 bg-white shadow-lg font-sans"> <!-- Inner border -->

                <!-- Header -->
                <div class="text-center mb-4">
                    <!-- Placeholder for Logo -->
                    <div class="flex justify-center mb-2">
                        <img src={logo} alt="School Logo" class="h-20 w-auto"/>
                    </div>
                    <h1 class="text-[13pt] font-bold text-blue-800 uppercase">
                        ANGELWINGS COMPREHENSIVE COLLEGE, MAROKO, PW, KUBWA, ABUJA
                    </h1>
                    <h2 class="text-[13pt] font-semibold text-blue-700">
                        SECOND TERM {student.session || 'YYYY/YYYY'} REPORT
                    </h2>
                </div>

                <!-- Student Info and Performance Summary -->
                <!-- Applied text-[8pt] -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mb-4 text-[8pt]">
                    <!-- Left Side: Student Details -->
                    <div>
                        <div class="flex mb-1 items-center">
                            <span class="font-bold w-24 inline-block shrink-0">FULL NAME:</span>
                            {#if !viewMode}
                                <input type="text" class="border-b border-gray-400 flex-grow px-1 text-[8pt]" bind:value={student.fullName} on:input={(e) => handleGenericInput(e, activeStudentIndex, 'fullName')}/>
                            {:else}
                                <span class="font-semibold pl-1">{displayValue(student.fullName)}</span>
                            {/if}
                        </div>
                         <div class="flex mb-1 items-center">
                            <span class="font-bold w-24 inline-block shrink-0">CLASS:</span>
                             {#if !viewMode}
                                <input type="text" class="border-b border-gray-400 flex-grow px-1 text-[8pt]" bind:value={student.class} on:input={(e) => handleGenericInput(e, activeStudentIndex, 'class')}/>
                             {:else}
                                <span class="font-semibold pl-1">{displayValue(student.class)}</span>
                             {/if}
                        </div>
                        <div class="flex mb-1 items-center">
                            <span class="font-bold w-24 inline-block shrink-0">DEPARTMENT:</span>
                             {#if !viewMode}
                                <input type="text" class="border-b border-gray-400 flex-grow px-1 text-[8pt]" bind:value={student.department} on:input={(e) => handleGenericInput(e, activeStudentIndex, 'department')}/>
                             {:else}
                                <span class="font-semibold pl-1">{displayValue(student.department)}</span>
                             {/if}
                        </div>
                         <div class="flex mb-1 items-center">
                            <span class="font-bold w-24 inline-block shrink-0">SESSION:</span>
                             {#if !viewMode}
                                 <input type="text" class="border-b border-gray-400 flex-grow px-1 text-[8pt]" bind:value={student.session} on:input={(e) => handleGenericInput(e, activeStudentIndex, 'session')}/>
                             {:else}
                                <span class="font-semibold pl-1">{displayValue(student.session)}</span>
                             {/if}
                        </div>
                        <!-- REMOVED D.O.B, GENDER, ADMISSION NO -->
                    </div>
                    <!-- Right Side: Performance Summary -->
                    <!-- text-[8pt] applied to parent -->
                    <div class="text-right md:text-left">
                        <div class="flex justify-end md:justify-start mb-1 items-center">
                            <span class="font-bold w-36 inline-block text-left shrink-0">AVERAGE:</span>
                            <span class="font-bold text-red-600 w-20 text-right md:text-left">{studentAverage.toFixed(1)}</span>
                        </div>
                        <div class="flex justify-end md:justify-start mb-1 items-center">
                            <span class="font-bold w-36 inline-block text-left shrink-0">GRADE:</span>
                            <span class="font-bold text-red-600 w-20 text-right md:text-left">{studentOverallGrade}</span>
                        </div>
                        <div class="flex justify-end md:justify-start mb-1 items-center">
                            <span class="font-bold w-36 inline-block text-left shrink-0">CLASS AVERAGE:</span>
                             {#if !viewMode}
                                <input type="number" step="0.1" class="border-b border-gray-400 w-20 px-1 text-right md:text-left text-[8pt]" bind:value={student.classAverage} on:input={(e) => handleNumberInputDirect(e, activeStudentIndex, 'classAverage')}/>
                             {:else}
                                <span class="font-semibold w-20 text-right md:text-left pl-1">{displayValue(student.classAverage)}</span>
                             {/if}
                        </div>
                        <div class="flex justify-end md:justify-start mb-1 items-center">
                            <span class="font-bold w-36 inline-block text-left shrink-0">DAYS PRESENT:</span>
                             {#if !viewMode}
                                <input type="number" class="border-b border-gray-400 w-20 px-1 text-right md:text-left text-[8pt]" bind:value={student.daysPresent} on:input={(e) => handleNumberInputDirect(e, activeStudentIndex, 'daysPresent')}/>
                             {:else}
                                <span class="font-semibold w-20 text-right md:text-left pl-1">{displayValue(student.daysPresent)}</span>
                             {/if}
                        </div>
                        <div class="flex justify-end md:justify-start mb-1 items-center">
                            <span class="font-bold w-36 inline-block text-left shrink-0">DAYS ABSENT:</span>
                             {#if !viewMode}
                                <input type="number" class="border-b border-gray-400 w-20 px-1 text-right md:text-left text-[8pt]" bind:value={student.daysAbsent} on:input={(e) => handleNumberInputDirect(e, activeStudentIndex, 'daysAbsent')}/>
                             {:else}
                                <span class="font-semibold w-20 text-right md:text-left pl-1">{displayValue(student.daysAbsent)}</span>
                             {/if}
                        </div>
                        <div class="flex justify-end md:justify-start mb-1 items-center">
                            <span class="font-bold w-36 inline-block text-left shrink-0">DAYS SCHOOL OPENED:</span>
                             {#if !viewMode}
                                <input type="number" class="border-b border-gray-400 w-20 px-1 text-right md:text-left text-[8pt]" bind:value={student.daysSchoolOpened} on:input={(e) => handleNumberInputDirect(e, activeStudentIndex, 'daysSchoolOpened')}/>
                             {:else}
                                <span class="font-semibold w-20 text-right md:text-left pl-1">{displayValue(student.daysSchoolOpened)}</span>
                             {/if}
                        </div>
                        <div class="flex justify-end md:justify-start mb-1 items-center">
                            <span class="font-bold w-36 inline-block text-left shrink-0">TOTAL PUPILS IN CLASS:</span>
                             {#if !viewMode}
                                <input type="number" class="border-b border-gray-400 w-20 px-1 text-right md:text-left text-[8pt]" bind:value={student.totalPupils} on:input={(e) => handleNumberInputDirect(e, activeStudentIndex, 'totalPupils')}/>
                             {:else}
                                <span class="font-semibold w-20 text-right md:text-left pl-1">{displayValue(student.totalPupils)}</span>
                             {/if}
                        </div>
                    </div>
                </div>

                <!-- Cognitive Ability Table -->
                <!-- Applied text-[9pt] -->
                <div class="mb-4 overflow-x-auto text-[9pt]">
                    <table class="w-full border-collapse border border-black">
                        <thead class="bg-blue-900 text-white font-bold text-center align-middle">
                            <tr>
                                <th class="border border-black p-1 align-middle" rowspan="2">COGNITIVE ABILITY</th>
                                <th class="border border-black p-1 align-middle">PROJECT</th>
                                <th class="border border-black p-1 align-middle">1<sup>st</sup> C.A</th>
                                <th class="border border-black p-1 align-middle">2<sup>nd</sup> C.A</th>
                                <th class="border border-black p-1 align-middle">3<sup>rd</sup> C.A</th>
                                <th class="border border-black p-1 align-middle">C.A TOTAL</th>
                                <th class="border border-black p-1 align-middle">EXAM SCORES</th>
                                <th class="border border-black p-1 align-middle" rowspan="2">TOTAL</th>
                                <th class="border border-black p-1 align-middle" rowspan="2">GRADE</th>
                                <th class="border border-black p-1 align-middle" rowspan="2">REMARKS</th>
                            </tr>
                            <tr>
                                <th class="border border-black p-1">10%</th>
                                <th class="border border-black p-1">5%</th>
                                <th class="border border-black p-1">20%</th>
                                <th class="border border-black p-1">5%</th>
                                <th class="border border-black p-1">40%</th>
                                <th class="border border-black p-1">60%</th>
                            </tr>
                        </thead>
                        <tbody class="text-center align-middle">
                            {#each student.cognitive as subject, i (subject.subject)}
                                {@const caTotal = (Number(subject.project) || 0) + (Number(subject.ca1) || 0) + (Number(subject.ca2) || 0) + (Number(subject.ca3) || 0)}
                                {@const examScore = Number(subject.exam) || 0}
                                {@const totalScore = caTotal + examScore}
                                {@const grade = calculateGrade(totalScore)}
                                <!-- Subject remark is now from selection, not calculation -->
                                {@const subjectRemark = subject.remark}
                                <tr>
                                    <td class="border border-black p-1 text-left font-semibold">{subject.subject}</td>
                                    <td class="border border-black p-1">
                                        {#if !viewMode}
                                            <input type="number" min="0" max="10" class="w-10 md:w-12 p-1 border rounded text-center text-[9pt]" value={subject.project} on:input={(e) => handleNumberInput(e, activeStudentIndex, i, 'project')}>
                                        {:else}
                                            <span class="block w-10 md:w-12 text-center">{displayValue(subject.project)}</span>
                                        {/if}
                                    </td>
                                    <td class="border border-black p-1">
                                         {#if !viewMode}
                                            <input type="number" min="0" max="5" class="w-10 md:w-12 p-1 border rounded text-center text-[9pt]" value={subject.ca1} on:input={(e) => handleNumberInput(e, activeStudentIndex, i, 'ca1')}>
                                        {:else}
                                            <span class="block w-10 md:w-12 text-center">{displayValue(subject.ca1)}</span>
                                        {/if}
                                    </td>
                                    <td class="border border-black p-1">
                                         {#if !viewMode}
                                            <input type="number" min="0" max="20" class="w-10 md:w-12 p-1 border rounded text-center text-[9pt]" value={subject.ca2} on:input={(e) => handleNumberInput(e, activeStudentIndex, i, 'ca2')}>
                                        {:else}
                                            <span class="block w-10 md:w-12 text-center">{displayValue(subject.ca2)}</span>
                                        {/if}
                                    </td>
                                    <td class="border border-black p-1">
                                         {#if !viewMode}
                                            <input type="number" min="0" max="5" class="w-10 md:w-12 p-1 border rounded text-center text-[9pt]" value={subject.ca3} on:input={(e) => handleNumberInput(e, activeStudentIndex, i, 'ca3')}>
                                        {:else}
                                            <span class="block w-10 md:w-12 text-center">{displayValue(subject.ca3)}</span>
                                        {/if}
                                    </td>
                                    <td class="border border-black p-1 font-semibold">{caTotal}</td>
                                    <td class="border border-black p-1">
                                        {#if !viewMode}
                                            <input type="number" min="0" max="60" class="w-10 md:w-12 p-1 border rounded text-center text-[9pt]" value={subject.exam} on:input={(e) => handleNumberInput(e, activeStudentIndex, i, 'exam')}>
                                        {:else}
                                            <span class="block w-10 md:w-12 text-center">{displayValue(subject.exam)}</span>
                                        {/if}
                                    </td>
                                    <td class="border border-black p-1 font-semibold">{totalScore}</td>
                                    <td class="border border-black p-1 font-semibold">{grade}</td>
                                    <td class="border border-black p-1 font-semibold">
                                        {#if !viewMode}
                                            <select
                                                class="w-full p-1 border rounded text-[9pt] min-w-[80px]"
                                                value={subjectRemark}
                                                on:change={(e) => handleCognitiveRemarkChange(e, activeStudentIndex, i)} >
                                                <option value={null}>Select...</option>
                                                {#each remarkOptions as option}
                                                    <option value={option}>{option}</option>
                                                {/each}
                                            </select>
                                        {:else}
                                            <span>{displayValue(subjectRemark)}</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                        <!-- Footer - text-[9pt] -->
                        <tfoot class="font-bold text-center bg-gray-100 text-[9pt]">
                            <tr>
                                <td class="border border-black p-1 text-right" colspan="5">TOTAL</td>
                                <td class="border border-black p-1">{cognitiveTotals.caTotalSum}</td>
                                <td class="border border-black p-1">{cognitiveTotals.examTotalSum}</td>
                                <td class="border border-black p-1">{cognitiveTotals.grandTotalSum}</td>
                                <td class="border border-black p-1">{studentOverallGrade}</td>
                                <td class="border border-black p-1">{studentOverallRemark}</td> <!-- Use calculated overall remark -->
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Grade Details Key -->
                <div class="text-center font-semibold text-xs mb-4 p-2 bg-gray-200 rounded">
                    GRADE DETAILS: A+=90-100; A=80-89; B+=70-79; B=60-69; C=50-59; D=40-49; E=0-39
                </div>

                <!-- Psychomotor and Affective Skills -->
                <!-- Applied text-[9pt] -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4 text-[9pt]">
                    <!-- Psychomotor Skills -->
                    <div>
                        <h3 class="font-bold text-center bg-blue-200 p-1 mb-1 border border-black text-sm">PSYCHOMOTOR SKILLS+</h3>
                        <table class="w-full border-collapse border border-black">
                            <tbody>
                                {#each Object.entries(student.psychomotor) as [skill, grade]}
                                    <tr>
                                        <td class="border border-black p-1 font-semibold w-3/5">{skill}</td>
                                        <td class="border border-black p-1 text-center w-2/5">
                                            {#if !viewMode}
                                                <select class="w-full p-1 border rounded text-[9pt]" value={grade} on:change={(e) => handleSkillChange(e, activeStudentIndex, 'psychomotor', skill)}>
                                                    {#each gradeOptions as option}
                                                        <option value={option}>{option}</option>
                                                    {/each}
                                                </select>
                                            {:else}
                                                <span>{displayValue(grade)}</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>

                    <!-- Affective Ability -->
                     <div>
                        <h3 class="font-bold text-center bg-blue-200 p-1 mb-1 border border-black text-sm">AFFECTIVE ABILITY</h3>
                         <table class="w-full border-collapse border border-black">
                            <tbody>
                                {#each Object.entries(student.affective) as [skill, grade]}
                                    <tr>
                                        <td class="border border-black p-1 font-semibold w-3/5">{skill}</td>
                                        <td class="border border-black p-1 text-center w-2/5">
                                             {#if !viewMode}
                                                <select class="w-full p-1 border rounded text-[9pt]" value={grade} on:change={(e) => handleSkillChange(e, activeStudentIndex, 'affective', skill)}>
                                                    {#each gradeOptions as option}
                                                        <option value={option}>{option}</option>
                                                    {/each}
                                                </select>
                                             {:else}
                                                <span>{displayValue(grade)}</span>
                                             {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Remarks and Resumption -->
                <!-- Font size defaults to base or inherited, adjust if needed -->
                <div class="mb-4">
                    <div class="flex items-start mb-2">
                        <span class="font-bold w-48 inline-block pt-1 shrink-0">CLASS TEACHER'S REMARK:</span>
                        {#if !viewMode}
                            <textarea rows="2" class="border border-gray-400 flex-grow p-1 rounded" bind:value={student.teacherRemark} on:input={(e) => handleGenericInput(e, activeStudentIndex, 'teacherRemark')}></textarea>
                        {:else}
                            <p class="flex-grow p-1">{displayValue(student.teacherRemark, 'No remarks.')}</p>
                        {/if}
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold w-48 inline-block shrink-0">DATE OF RESUMPTION:</span>
                         {#if !viewMode}
                            <input type="text" class="border-b border-gray-400 flex-grow px-1" bind:value={student.resumptionDate} on:input={(e) => handleGenericInput(e, activeStudentIndex, 'resumptionDate')} />
                         {:else}
                            <span class="font-semibold pl-1">{displayValue(student.resumptionDate)}</span>
                         {/if}
                    </div>
                </div>

                <!-- Signature and Date -->
                <div class="flex justify-between mt-8">
                    <div>
                        <span class="font-bold">SIGNATURE & STAMP:</span>
                        <span class="inline-block border-b border-black w-48 ml-2 align-bottom"></span>
                    </div>
                    <div>
                        <span class="font-bold">DATE:</span>
                        <span class="inline-block border-b border-black w-32 ml-2 align-bottom"></span>
                    </div>
                </div>

            </div> <!-- End Inner Border -->
        </div> <!-- End Outer Border -->

	{:else}
		 <div class="text-center p-10 text-gray-500">
			<p>No student report selected or available.</p>
			 <p>Click "Add New Report" to get started.</p>
		</div>
	{/if}

</div>

<style>
	/* Optional: Hide number input spinners */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
	  -webkit-appearance: none;
	  margin: 0;
	}
	input[type='number'] {
	  -moz-appearance: textfield; /* Firefox */
	}
    /* Ensure view mode spans take similar space as inputs */
    span[class*="w-10"], span[class*="w-12"], span[class*="w-20"] {
        display: inline-block; /* Or block depending on context */
        min-height: 1.5rem; /* Adjust to match input height */
        padding: 0.25rem; /* Adjust to match input padding */
    }
    /* Ensure text aligns similarly in view vs edit */
     td > span { vertical-align: middle; }
</style>
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { COURSE_CATALOG_VERSION, initialCourses } from './data/courses';
import { STORAGE_SCHEMA_VERSION, migrateStoredCourses } from './data/courseStorage';
import { getSemesterStatus, summarizeProgress } from './data/progress';

const CATEGORY_COLUMNS = {
  methods: { title: 'Methods' },
  digitalTechnology: { title: 'Digital Technology' },
  managementSpecialization: { title: 'Management Specialization' },
  managementElectives: { title: 'Management Electives' },
  thesis: { title: "Master's Thesis" },
};

const COLUMN_ORDER = [
  'coursePool',
  'methods',
  'digitalTechnology',
  'managementSpecialization',
  'managementElectives',
  'thesis',
];

const STORAGE_KEY = 'mmdt-two-tier-courses';
const STORAGE_SCHEMA_VERSION_KEY = 'mmdt-storage-schema-version';
const CATALOG_VERSION_STORAGE_KEY = 'mmdt-course-catalog-version';
const SEMESTERS_STORAGE_KEY = 'mmdt-semesters';
const CURRENT_SEMESTER_STORAGE_KEY = 'mmdt-current-semester';
const GERMAN_A1_STORAGE_KEY = 'mmdt-has-german-a1';
const PROGRAMMING_STORAGE_KEY = 'mmdt-has-programming';
const CATEGORY_OPTIONS = [
  'methods',
  'digitalTechnology',
  'managementSpecialization',
  'managementElectives',
  'thesis',
];
const BOARD_COLUMN_WIDTH = 'var(--board-column-width)';
const COURSE_POOL_COLUMN_WIDTH = 'var(--course-pool-column-width)';
const LAST_REQUIRED_SEMESTER = 4;

const ProgressRing = ({ label, progress, target, color }) => {
  const svgRef = useRef();
  const pathRef = useRef(null);

  useEffect(() => {
    const width = 140;
    const height = 140;
    const radius = Math.min(width, height) / 2 - 10;
    const ringProgress = Math.min(progress.total / target, 1);
    const svg = d3.select(svgRef.current);

    if (svg.select('g').empty()) {
      const group = svg
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const arc = d3.arc().innerRadius(radius - 15).outerRadius(radius).startAngle(0);

      group.append('path').datum({ endAngle: 2 * Math.PI }).style('fill', '#e2e8f0').attr('d', arc);

      pathRef.current = group
        .append('path')
        .datum({ endAngle: 0 })
        .style('fill', color)
        .attr('d', arc);

      group
        .append('text')
        .attr('class', 'credits-text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.1em')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .style('fill', '#1e293b');

      group
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .style('font-size', '11px')
        .style('fill', '#64748b')
        .text(label);
    }

    const group = svg.select('g');
    const arc = d3.arc().innerRadius(radius - 15).outerRadius(radius).startAngle(0);

    pathRef.current
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate(d.endAngle, ringProgress * 2 * Math.PI);
        return function (t) {
          d.endAngle = interpolate(t);
          return arc(d);
        };
      });

    group.select('.credits-text').text(`${progress.total}/${target}`);
  }, [progress.total, target, label, color]);

  return (
    <div className="progress-ring">
      <svg ref={svgRef}></svg>
      <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.45, minHeight: '34px' }}>
        {progress.earned === null
          ? 'Set current semester for status breakdown'
          : `${progress.earned} earned · ${progress.inProgress} current · ${progress.future} future`}
      </div>
    </div>
  );
};

const CourseCard = ({ course }) => {
  const isLegacy = course.isLegacy === true;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: course.id,
    disabled: isLegacy,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        flexShrink: 0,
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #dbe5f0',
        background: '#ffffff',
        cursor: isLegacy ? 'default' : isDragging ? 'grabbing' : 'grab',
        touchAction: 'auto',
        boxShadow: isDragging ? '0 10px 28px rgba(15, 23, 42, 0.16)' : '0 2px 8px rgba(15, 23, 42, 0.08)',
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      {...(isLegacy ? {} : listeners)}
      {...(isLegacy ? {} : attributes)}
    >
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
        {course.name}
      </div>
      {isLegacy && (
        <div style={{ fontSize: '12px', color: '#9f1239', fontWeight: 700, marginBottom: '4px' }}>
          Historical course — no longer in the current catalog
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#475569' }}>{course.credits} ECTS</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', overflowWrap: 'anywhere' }}>{course.categories.join(' • ')}</div>
    </div>
  );
};

const CoursePreview = ({ course }) => {
  if (!course) return null;

  return (
    <div
      style={{
        width: '100%',
        minWidth: 0,
        height: '100%',
        boxSizing: 'border-box',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #22c55e',
        background: '#f0fdf4',
        boxShadow: '0 12px 24px rgba(22, 163, 74, 0.22)',
      }}
    >
      <div style={{ fontWeight: 700, color: '#14532d', marginBottom: '6px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
        {course.name}
      </div>
      <div style={{ fontSize: '12px', color: '#166534' }}>{course.credits} ECTS</div>
      <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px', overflowWrap: 'anywhere' }}>
        {course.categories.join(' · ')}
      </div>
    </div>
  );
};

const DropColumn = ({ title, columnId, courses, highlightValid, isActivePool, headerActions }) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  const borderColor = isOver ? '#15803d' : highlightValid ? '#22c55e' : '#d2dbe6';
  const background = highlightValid ? '#f0fdf4' : isActivePool ? '#f8fafc' : '#fdfefe';
  const columnWidth = isActivePool ? COURSE_POOL_COLUMN_WIDTH : BOARD_COLUMN_WIDTH;

  return (
    <div
      style={{
        width: columnWidth,
        minWidth: columnWidth,
        maxWidth: columnWidth,
        flex: `0 0 ${columnWidth}`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px 10px', minWidth: 0 }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>{title}</h3>
        {headerActions || null}
      </div>
      <div
        ref={setNodeRef}
        style={{
          border: `2px solid ${borderColor}`,
          background,
          borderRadius: '14px',
          height: 'clamp(360px, 55vh, 500px)',
          width: '100%',
          minWidth: 0,
          padding: '12px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarGutter: 'stable',
          transition: 'all 0.2s ease',
        }}
      >
        {courses.length === 0 && <div style={{ color: '#94a3b8', fontSize: '13px' }}>Drop courses here</div>}
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

function App() {
  const targets = {
    methods: 12,
    digitalTechnology: 30,
    managementSpecialization: 30,
    managementElectives: 18,
  };

  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return initialCourses.map((course) => ({ ...course, semester: null, assignedCategory: null }));
    }

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error('Invalid saved data');
      const savedSchemaVersion = Number(localStorage.getItem(STORAGE_SCHEMA_VERSION_KEY) ?? 1);
      if (!Number.isInteger(savedSchemaVersion) || savedSchemaVersion < 1 || savedSchemaVersion > STORAGE_SCHEMA_VERSION) {
        throw new Error('Unsupported saved-data schema');
      }

      return migrateStoredCourses(parsed, initialCourses);
    } catch {
      return initialCourses.map((course) => ({ ...course, semester: null, assignedCategory: null }));
    }
  });

  const [semesters, setSemesters] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(SEMESTERS_STORAGE_KEY));
      if (!Array.isArray(parsed) || parsed.length === 0) return [1, 2, 3, 4];

      const normalized = parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
        .sort((a, b) => a - b);

      if (normalized.length === 0) return [1, 2, 3, 4];
      return Array.from(new Set(normalized));
    } catch {
      return [1, 2, 3, 4];
    }
  });
  const [activeSemester, setActiveSemester] = useState(1);
  const [currentSemester, setCurrentSemester] = useState(() => {
    const storedValue = localStorage.getItem(CURRENT_SEMESTER_STORAGE_KEY);
    if (storedValue === null) return null;

    const parsed = Number(storedValue);
    return Number.isInteger(parsed) && parsed > 0 && semesters.includes(parsed) ? parsed : null;
  });
  const [hasGermanA1, setHasGermanA1] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(GERMAN_A1_STORAGE_KEY)) === true;
    } catch {
      return false;
    }
  });
  const [hasProgramming, setHasProgramming] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PROGRAMMING_STORAGE_KEY)) === true;
    } catch {
      return false;
    }
  });
  const [poolFilter, setPoolFilter] = useState('All');
  const [poolSearch, setPoolSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(6);
  const [newCourseCategories, setNewCourseCategories] = useState([]);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    })
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    localStorage.setItem(STORAGE_SCHEMA_VERSION_KEY, String(STORAGE_SCHEMA_VERSION));
    localStorage.setItem(CATALOG_VERSION_STORAGE_KEY, COURSE_CATALOG_VERSION);
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(SEMESTERS_STORAGE_KEY, JSON.stringify(semesters));
  }, [semesters]);

  useEffect(() => {
    if (currentSemester === null) {
      localStorage.removeItem(CURRENT_SEMESTER_STORAGE_KEY);
      return;
    }

    localStorage.setItem(CURRENT_SEMESTER_STORAGE_KEY, String(currentSemester));
  }, [currentSemester]);

  useEffect(() => {
    if (!semesters.includes(activeSemester)) {
      setActiveSemester(semesters[0]);
    }
  }, [activeSemester, semesters]);

  useEffect(() => {
    if (currentSemester !== null && !semesters.includes(currentSemester)) {
      setCurrentSemester(null);
    }
  }, [currentSemester, semesters]);

  useEffect(() => {
    localStorage.setItem(GERMAN_A1_STORAGE_KEY, JSON.stringify(hasGermanA1));
  }, [hasGermanA1]);

  useEffect(() => {
    localStorage.setItem(PROGRAMMING_STORAGE_KEY, JSON.stringify(hasProgramming));
  }, [hasProgramming]);

  const globalProgress = summarizeProgress(courses, currentSemester);
  const categoryProgress = Object.fromEntries(
    Object.keys(CATEGORY_COLUMNS).map((category) => [
      category,
      summarizeProgress(courses, currentSemester, category),
    ])
  );

  const qualifyingSeminars = courses.filter(
    (course) =>
      course.semester !== null &&
      course.assignedCategory === 'managementSpecialization' &&
      course.curriculumBranches?.includes('SA')
  );
  const seminarStatuses = qualifyingSeminars.map((course) =>
    getSemesterStatus(course.semester, currentSemester)
  );
  const seminarStatus = currentSemester === null
    ? (qualifyingSeminars.length > 0 ? 'In degree plan' : 'Not in plan')
    : seminarStatuses.includes('completed')
      ? 'Completed'
      : seminarStatuses.includes('current')
        ? 'In progress'
        : seminarStatuses.includes('planned')
          ? 'Planned'
          : 'Not in plan';

  const meetsThesisThreshold = (total, technology, methods) =>
    total >= 48 && technology >= 18 && methods >= 6;
  const degreePlanMeetsThesisThreshold = meetsThesisThreshold(
    globalProgress.total,
    categoryProgress.digitalTechnology.total,
    categoryProgress.methods.total
  );
  const earnedMeetsThesisThreshold = currentSemester !== null && meetsThesisThreshold(
    globalProgress.earned,
    categoryProgress.digitalTechnology.earned,
    categoryProgress.methods.earned
  );
  const throughCurrentMeetsThesisThreshold = currentSemester !== null && meetsThesisThreshold(
    globalProgress.earned + globalProgress.inProgress,
    categoryProgress.digitalTechnology.earned + categoryProgress.digitalTechnology.inProgress,
    categoryProgress.methods.earned + categoryProgress.methods.inProgress
  );
  const thesisThresholdState = earnedMeetsThesisThreshold
    ? 'earned'
    : throughCurrentMeetsThesisThreshold
      ? 'throughCurrent'
      : degreePlanMeetsThesisThreshold
        ? 'degreePlan'
        : 'unmet';
  const thesisThresholdMessage = thesisThresholdState === 'earned'
    ? 'Earned progress meets the configured thesis threshold.'
    : thesisThresholdState === 'throughCurrent'
      ? 'On successful completion of your current-semester courses, you reach the configured thesis threshold.'
      : thesisThresholdState === 'degreePlan'
        ? currentSemester === null
          ? 'Your degree plan reaches the configured thesis threshold.'
          : 'Your future degree plan reaches the configured thesis threshold.'
        : 'Your degree plan does not yet reach the configured thesis threshold.';

  const semesterSummaries = semesters.map((semester) => {
    const semesterCourses = courses.filter((course) => course.semester === semester);
    const semesterCredits = semesterCourses.reduce((sum, course) => sum + Number(course.credits || 0), 0);

    return {
      semester,
      courses: semesterCourses,
      credits: semesterCredits,
      status: getSemesterStatus(semester, currentSemester),
    };
  });

  const poolCourses = courses.filter(
    (course) =>
      course.isLegacy !== true &&
      course.semester === null &&
      (poolFilter === 'All' || course.categories.includes(poolFilter)) &&
      course.name.toLowerCase().includes(poolSearch.trim().toLowerCase())
  );
  const methodsCourses = courses.filter(
    (course) => course.semester === activeSemester && course.assignedCategory === 'methods'
  );
  const techCourses = courses.filter(
    (course) => course.semester === activeSemester && course.assignedCategory === 'digitalTechnology'
  );
  const specCourses = courses.filter(
    (course) => course.semester === activeSemester && course.assignedCategory === 'managementSpecialization'
  );
  const electiveCourses = courses.filter(
    (course) => course.semester === activeSemester && course.assignedCategory === 'managementElectives'
  );
  const thesisCourses = courses.filter(
    (course) => course.semester === activeSemester && course.assignedCategory === 'thesis'
  );

  const findCourse = (courseId) => courses.find((course) => String(course.id) === String(courseId));
  const activeCourse = activeCourseId ? findCourse(activeCourseId) : null;

  const getAllowedColumns = (course) => {
    if (!course || course.isLegacy === true) return [];
    return ['coursePool', ...course.categories];
  };

  const activeAllowedColumns = getAllowedColumns(activeCourse);

  const handleDragStart = (event) => {
    setActiveCourseId(String(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveCourseId(null);
  };

  const handleDragEnd = (event) => {
    const courseId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveCourseId(null);

    if (!overId) return;

    setCourses((prev) => {
      const target = prev.find((course) => String(course.id) === courseId);
      if (!target) return prev;

      const allowed = getAllowedColumns(target);
      if (!allowed.includes(overId)) return prev;

      if (overId === 'coursePool') {
        return prev.map((course) =>
          String(course.id) === courseId ? { ...course, semester: null, assignedCategory: null } : course
        );
      }

      return prev.map((course) =>
        String(course.id) === courseId
          ? { ...course, semester: activeSemester, assignedCategory: overId }
          : course
      );
    });
  };

  const handleResetData = () => {
    const confirmed = window.confirm(
      'This clears every semester and category assignment and removes historical courses that are no longer in the current catalog. Your current-semester setting and manual requirements will be kept. Continue?'
    );
    if (!confirmed) return;

    const resetCourses = courses
      .filter((course) => course.isLegacy !== true)
      .map((course) => ({
        ...course,
        semester: null,
        assignedCategory: null,
      }));

    setCourses(resetCourses);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleCategoryToggle = (category) => {
    setNewCourseCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }
      return [...prev, category];
    });
  };

  const handleAddSemester = () => {
    setSemesters((prev) => {
      const nextSemester = (prev[prev.length - 1] || 0) + 1;
      return [...prev, nextSemester];
    });
  };

  const handleRemoveSemester = (semester) => {
    const highestSemester = semesters[semesters.length - 1];

    if (semester <= LAST_REQUIRED_SEMESTER) {
      window.alert('Semesters 1–4 cannot be removed.');
      return;
    }

    if (semester !== highestSemester) {
      window.alert('Only the highest added semester can be removed.');
      return;
    }

    if (currentSemester === semester) {
      window.alert(`Select another current semester before removing Semester ${semester}.`);
      return;
    }

    if (courses.some((course) => course.semester === semester)) {
      window.alert(`Move or unassign the courses in Semester ${semester} before removing it.`);
      return;
    }

    if (!window.confirm(`Remove Semester ${semester}?`)) return;

    const nextHighestSemester = semesters[semesters.length - 2];
    setSemesters((prev) => prev.slice(0, -1));

    if (activeSemester === semester) {
      setActiveSemester(nextHighestSemester);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCourseName('');
    setNewCourseCredits(6);
    setNewCourseCategories([]);
  };

  const handleSaveCustomCourse = (event) => {
    event.preventDefault();

    const trimmedName = newCourseName.trim();
    const parsedCredits = Number(newCourseCredits);

    if (!trimmedName || !Number.isFinite(parsedCredits) || parsedCredits <= 0 || newCourseCategories.length === 0) {
      return;
    }

    const customCourse = {
      id: `custom-${Date.now()}`,
      moduleId: null,
      name: trimmedName,
      credits: parsedCredits,
      categories: newCourseCategories,
      curriculumBranches: [],
      isCustom: true,
      semester: null,
      assignedCategory: null,
    };

    setCourses((prev) => [...prev, customCourse]);
    closeModal();
  };

  return (
    <div
      className="app-shell min-h-screen bg-slate-50 text-slate-900"
      style={{ width: '100%', maxWidth: '100%', minWidth: 0, margin: '0 auto', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}
    >
      <h1 style={{ textAlign: 'center', color: '#0f172a', marginBottom: '12px' }}>MMDT Two-Tier Semester Planner</h1>

      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', margin: '-2px auto 12px', maxWidth: '760px' }}>
        Course eligibility is based on the current TUMOnline curriculum tree. Actual semester availability may vary; verify current offerings in TUMOnline.
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={handleResetData}
          style={{
            padding: '8px 12px',
            background: '#fff1f2',
            color: '#9f1239',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700,
            minHeight: '38px',
          }}
        >
          Reset Assignments
        </button>
      </div>

      <div
        className="current-semester-panel"
        style={{
          border: `1px solid ${currentSemester === null ? '#f59e0b' : '#bfdbfe'}`,
          borderRadius: '14px',
          padding: '9px 14px',
          marginBottom: '12px',
          background: currentSemester === null ? '#fffbeb' : '#eff6ff',
        }}
      >
        <div className="current-semester-copy" style={{ textAlign: 'left' }}>
          <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '14px' }}>
            {currentSemester === null
              ? 'Which semester are you currently studying?'
              : 'Current academic semester'}
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
            This determines which courses count as completed, in progress, or planned.
          </div>
        </div>
        <select
          className="current-semester-select"
          aria-label="Current academic semester"
          value={currentSemester ?? ''}
          onChange={(event) => {
            const selectedSemester = Number(event.target.value);
            setCurrentSemester(semesters.includes(selectedSemester) ? selectedSemester : null);
          }}
          style={{
            border: '1px solid #94a3b8',
            borderRadius: '9px',
            padding: '8px 10px',
            background: '#ffffff',
            color: '#0f172a',
            fontWeight: 700,
          }}
        >
          <option value="">Select semester</option>
          {semesters.map((semester) => (
            <option key={semester} value={semester}>Semester {semester}</option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: thesisThresholdState === 'earned' ? '#dcfce7' : thesisThresholdState === 'unmet' ? '#fee2e2' : '#eff6ff',
          border: `2px solid ${thesisThresholdState === 'earned' ? '#22c55e' : thesisThresholdState === 'unmet' ? '#ef4444' : '#60a5fa'}`,
          borderRadius: '14px',
          padding: '10px 14px',
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: '16px',
            color: thesisThresholdState === 'earned' ? '#166534' : thesisThresholdState === 'unmet' ? '#991b1b' : '#1e40af',
            marginBottom: '4px',
          }}
        >
          Thesis planning estimate
        </div>
        <div style={{ color: '#334155', fontSize: '14px' }}>{thesisThresholdMessage}</div>
        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>
          Configured thresholds: 48 total ECTS, 18 Digital Technology ECTS, and 6 Methods ECTS.
          Planning estimate only; verify official thesis registration requirements with TUM.
        </div>
      </div>

      <div
        style={{
          border: '1px solid #dbe5f0',
          borderRadius: '16px',
          padding: '12px 14px',
          marginBottom: '18px',
          background: '#ffffff',
        }}
      >
        <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 800, marginBottom: '4px' }}>
          Degree Plan: {globalProgress.total} / 120 ECTS
        </div>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
          {globalProgress.earned === null
            ? 'Choose your current semester to distinguish earned, in-progress, and future ECTS.'
            : `Earned ${globalProgress.earned} · In progress ${globalProgress.inProgress} · Future ${globalProgress.future}`}
        </div>
        <div className="progress-rings">
          <ProgressRing label="Methods" progress={categoryProgress.methods} target={targets.methods} color="#2563eb" />
          <ProgressRing label="DigiTech" progress={categoryProgress.digitalTechnology} target={targets.digitalTechnology} color="#0ea5e9" />
          <ProgressRing
            label="Mgmt Spec."
            progress={categoryProgress.managementSpecialization}
            target={targets.managementSpecialization}
            color="#f59e0b"
          />
          <ProgressRing
            label="Mgmt Electives"
            progress={categoryProgress.managementElectives}
            target={targets.managementElectives}
            color="#10b981"
          />
          <ProgressRing label="Thesis" progress={categoryProgress.thesis} target={30} color="#7c3aed" />
        </div>
      </div>

      <div
        style={{
          border: '1px solid #dbe5f0',
          borderRadius: '14px',
          background: '#ffffff',
          padding: '10px 14px',
          marginBottom: '14px',
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontSize: '14px' }}>
          Mandatory Graduation Requirements
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#334155', fontSize: '14px', textAlign: 'left' }}>
          <span>{seminarStatus === 'Completed' ? '✅' : seminarStatus === 'Not in plan' ? '❌' : '◷'}</span>
          <span>1x Advanced Seminar in Mgmt Spec. (6 ECTS) — <strong>{seminarStatus}</strong></span>
        </div>
        <button
          type="button"
          onClick={() => setHasGermanA1((prev) => !prev)}
          style={{
            marginTop: '8px',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#334155',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
            minHeight: '36px',
            textAlign: 'left',
          }}
        >
          <span>{hasGermanA1 ? '✅' : '⬜'}</span>
          <span>German A1 Requirement</span>
        </button>
        <button
          type="button"
          onClick={() => setHasProgramming((prev) => !prev)}
          style={{
            marginTop: '8px',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#334155',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
            minHeight: '36px',
            textAlign: 'left',
          }}
        >
          <span>{hasProgramming ? '✅' : '⬜'}</span>
          <span>Basic Programming Requirement</span>
        </button>
      </div>

      <div
        className="semester-list"
      >
        {semesterSummaries.map((summary) => {
          const isViewing = activeSemester === summary.semester;
          const isCurrent = summary.status === 'current';
          const canRemove =
            summary.semester > LAST_REQUIRED_SEMESTER &&
            summary.semester === semesters[semesters.length - 1];
          const statusLabel = summary.status === 'completed'
            ? 'Completed'
            : summary.status === 'current'
              ? 'Current'
              : summary.status === 'planned'
                ? 'Planned'
                : 'Status not set';
          const creditLabel = summary.status === 'completed'
            ? 'completed'
            : summary.status === 'current'
              ? 'in progress'
              : summary.status === 'planned'
                ? 'planned'
                : 'in plan';
          return (
            <div key={summary.semester} className="semester-card-wrapper">
              <button
                type="button"
                onClick={() => setActiveSemester(summary.semester)}
                style={{
                  width: '100%',
                  height: '100%',
                  textAlign: 'left',
                  borderRadius: '14px',
                  border: `2px solid ${isViewing ? '#0f172a' : isCurrent ? '#3b82f6' : '#dbe5f0'}`,
                  padding: canRemove ? '12px 12px 42px' : '12px',
                  background: isCurrent ? '#eff6ff' : isViewing ? '#f8fafc' : '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  minHeight: '140px',
                  boxShadow: isViewing ? '0 8px 20px rgba(15, 23, 42, 0.12)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '5px' }}>
                  <div style={{ fontWeight: 800 }}>Semester {summary.semester}</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span
                      style={{
                        borderRadius: '999px',
                        padding: '2px 7px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isCurrent ? '#1d4ed8' : '#475569',
                        background: isCurrent ? '#dbeafe' : '#e2e8f0',
                      }}
                    >
                      {statusLabel}
                    </span>
                    {isViewing && (
                      <span style={{ borderRadius: '999px', padding: '2px 7px', fontSize: '12px', fontWeight: 800, color: '#ffffff', background: '#0f172a' }}>
                        Viewing
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                  {summary.credits} ECTS {creditLabel}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {summary.courses.length === 0 && (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>No courses assigned</span>
                  )}
                  {summary.courses.map((course) => (
                    <span
                      key={course.id}
                      style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        border: '1px solid #dbe5f0',
                        background: '#ffffff',
                        color: '#334155',
                        maxWidth: '100%',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'normal',
                      }}
                    >
                      {course.isLegacy ? `Historical: ${course.name}` : course.name}
                    </span>
                  ))}
                </div>
              </button>
              {canRemove && (
                <button
                  type="button"
                  aria-label={`Remove Semester ${summary.semester}`}
                  onClick={() => handleRemoveSemester(summary.semester)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    bottom: '10px',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    background: '#fff1f2',
                    color: '#9f1239',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '36px',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
        <button
          className="semester-add-card"
          type="button"
          onClick={handleAddSemester}
          style={{
            textAlign: 'center',
            borderRadius: '14px',
            border: '2px dashed #0ea5e9',
            padding: '12px',
            background: 'linear-gradient(140deg, #ecfeff, #f0f9ff)',
            color: '#075985',
            cursor: 'pointer',
            minHeight: '140px',
            boxShadow: '0 8px 20px rgba(14, 165, 233, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          aria-label="Add semester"
        >
          <div style={{ fontSize: '38px', lineHeight: 1, fontWeight: 800 }}>+</div>
          <div style={{ fontWeight: 700 }}>Add Semester</div>
          <div style={{ fontSize: '12px', color: '#0c4a6e' }}>
            Add Semester {(semesters[semesters.length - 1] || 0) + 1}
          </div>
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div style={{ marginBottom: '10px', color: '#475569', fontSize: '14px' }}>
          Active board: Semester {activeSemester}. Drop in a category to assign both semester and category. Drop in Course Pool to unassign.
        </div>

        <div
          className="course-board-scroll"
        >
          <DropColumn
            title="Course Pool"
            columnId="coursePool"
            courses={poolCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('coursePool') : false}
            isActivePool
            headerActions={(
              <div
                className="course-pool-controls"
              >
                <select
                  value={poolFilter}
                  onChange={(event) => setPoolFilter(event.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '6px 8px',
                    color: '#0f172a',
                    background: '#ffffff',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="All">All</option>
                  <option value="methods">methods</option>
                  <option value="digitalTechnology">digitalTechnology</option>
                  <option value="managementSpecialization">managementSpecialization</option>
                  <option value="managementElectives">managementElectives</option>
                  <option value="thesis">thesis</option>
                </select>
                <input
                  type="text"
                  placeholder="Search..."
                  value={poolSearch}
                  onChange={(event) => setPoolSearch(event.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '6px 8px',
                    color: '#0f172a',
                    background: '#ffffff',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  className="course-pool-add-button"
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    border: '1px solid #0f172a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '6px 10px',
                    background: '#0f172a',
                    color: '#ffffff',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Add
                </button>
              </div>
            )}
          />
          <DropColumn
            title="Methods"
            columnId="methods"
            courses={methodsCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('methods') : false}
          />
          <DropColumn
            title="Digital Technology"
            columnId="digitalTechnology"
            courses={techCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('digitalTechnology') : false}
          />
          <DropColumn
            title="Management Specialization"
            columnId="managementSpecialization"
            courses={specCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('managementSpecialization') : false}
          />
          <DropColumn
            title="Management Electives"
            columnId="managementElectives"
            courses={electiveCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('managementElectives') : false}
          />
          <DropColumn
            title="Master's Thesis"
            columnId="thesis"
            courses={thesisCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('thesis') : false}
          />
        </div>

        <DragOverlay>
          <CoursePreview course={activeCourse} />
        </DragOverlay>
      </DndContext>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleSaveCustomCourse}
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: 'calc(100vh - 40px)',
              boxSizing: 'border-box',
              overflowY: 'auto',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid #dbe5f0',
              boxShadow: '0 20px 35px rgba(15, 23, 42, 0.2)',
              padding: '18px',
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', color: '#0f172a' }}>Add Custom Course</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Course Name
              </label>
              <input
                type="text"
                value={newCourseName}
                onChange={(event) => setNewCourseName(event.target.value)}
                placeholder="e.g., Strategy and Innovation Lab"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Credits
              </label>
              <input
                type="number"
                min="1"
                value={newCourseCredits}
                onChange={(event) => setNewCourseCredits(event.target.value)}
                style={{
                  width: '120px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Allowed Categories
              </div>
              <div className="custom-course-category-grid">
                {CATEGORY_OPTIONS.map((category) => (
                  <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', overflowWrap: 'anywhere' }}>
                    <input
                      type="checkbox"
                      checked={newCourseCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  border: '1px solid #0f172a',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;

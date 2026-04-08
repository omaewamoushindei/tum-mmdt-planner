import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { initialCourses } from './data/courses';

const CATEGORY_COLUMNS = {
  methods: { title: 'Methods' },
  digitalTechnology: { title: 'Digital Technology' },
  managementSpecialization: { title: 'Management Specialization' },
  managementElectives: { title: 'Management Electives' },
};

const COLUMN_ORDER = [
  'coursePool',
  'methods',
  'digitalTechnology',
  'managementSpecialization',
  'managementElectives',
];

const STORAGE_KEY = 'mmdt-two-tier-courses';
const CATEGORY_OPTIONS = [
  'methods',
  'digitalTechnology',
  'managementSpecialization',
  'managementElectives',
];

const isValidSemester = (value) => [1, 2, 3, 4].includes(value);

const normalizeCourse = (course) => {
  const semester = isValidSemester(course.semester) ? course.semester : null;
  const validAssignedCategory =
    course.assignedCategory &&
    Object.hasOwn(CATEGORY_COLUMNS, course.assignedCategory) &&
    course.categories.includes(course.assignedCategory)
      ? course.assignedCategory
      : null;

  if (!semester || !validAssignedCategory) {
    return {
      ...course,
      semester: null,
      assignedCategory: null,
    };
  }

  return {
    ...course,
    semester,
    assignedCategory: validAssignedCategory,
  };
};

const ProgressRing = ({ label, current, target, color }) => {
  const svgRef = useRef();
  const pathRef = useRef(null);

  useEffect(() => {
    const width = 140;
    const height = 140;
    const radius = Math.min(width, height) / 2 - 10;
    const progress = Math.min(current / target, 1);
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
        .style('font-size', '10px')
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
        const interpolate = d3.interpolate(d.endAngle, progress * 2 * Math.PI);
        return function (t) {
          d.endAngle = interpolate(t);
          return arc(d);
        };
      });

    group.select('.credits-text').text(`${current}/${target}`);
  }, [current, target, label, color]);

  return <svg ref={svgRef}></svg>;
};

const CourseCard = ({ course }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: course.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #dbe5f0',
        background: '#ffffff',
        cursor: 'grab',
        boxShadow: isDragging ? '0 10px 28px rgba(15, 23, 42, 0.16)' : '0 2px 8px rgba(15, 23, 42, 0.08)',
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      {...listeners}
      {...attributes}
    >
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', lineHeight: 1.35 }}>{course.name}</div>
      <div style={{ fontSize: '12px', color: '#475569' }}>{course.credits} ECTS</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{course.categories.join(' • ')}</div>
    </div>
  );
};

const CoursePreview = ({ course }) => {
  if (!course) return null;

  return (
    <div
      style={{
        width: '260px',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #22c55e',
        background: '#f0fdf4',
        boxShadow: '0 12px 24px rgba(22, 163, 74, 0.22)',
      }}
    >
      <div style={{ fontWeight: 700, color: '#14532d', marginBottom: '6px' }}>{course.name}</div>
      <div style={{ fontSize: '12px', color: '#166534' }}>{course.credits} ECTS</div>
    </div>
  );
};

const DropColumn = ({ title, columnId, courses, highlightValid, isActivePool, headerActions, minHeight }) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  const borderColor = isOver ? '#15803d' : highlightValid ? '#22c55e' : '#d2dbe6';
  const background = highlightValid ? '#f0fdf4' : isActivePool ? '#f8fafc' : '#fdfefe';

  return (
    <div style={{ minWidth: '300px', flexShrink: 0 }}>
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>{title}</h3>
        {headerActions || null}
      </div>
      <div
        ref={setNodeRef}
        style={{
          border: `2px solid ${borderColor}`,
          background,
          borderRadius: '14px',
          minHeight: minHeight || '390px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
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

      const defaultsById = initialCourses.reduce((acc, course) => {
        acc[course.id] = course;
        return acc;
      }, {});

      const merged = initialCourses.map((base) => {
        const persisted = parsed.find((item) => item.id === base.id);
        return normalizeCourse({
          ...base,
          semester: persisted?.semester ?? null,
          assignedCategory: persisted?.assignedCategory ?? null,
        });
      });

      parsed.forEach((course) => {
        if (!defaultsById[course.id]) {
          merged.push(normalizeCourse(course));
        }
      });

      return merged;
    } catch {
      return initialCourses.map((course) => ({ ...course, semester: null, assignedCategory: null }));
    }
  });

  const [activeSemester, setActiveSemester] = useState(1);
  const [poolFilter, setPoolFilter] = useState('All');
  const [poolSearch, setPoolSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(6);
  const [newCourseCategories, setNewCourseCategories] = useState([]);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const assignedCourses = courses.filter(
    (course) => course.assignedCategory !== null && course.semester !== null
  );
  const totalAssignedCredits = assignedCourses.reduce((sum, course) => sum + Number(course.credits || 0), 0);

  const calculateProgress = (category) => {
    return assignedCourses
      .filter((course) => course.assignedCategory === category)
      .reduce((sum, course) => sum + Number(course.credits || 0), 0);
  };

  const assignedMethodCredits = calculateProgress('methods');
  const assignedTechCredits = calculateProgress('digitalTechnology');
  const currentManagementSpecialization = calculateProgress('managementSpecialization');
  const currentManagementElectives = calculateProgress('managementElectives');
  const hasMandatorySeminar = courses.some(
    (course) =>
      course.semester !== null &&
      course.assignedCategory === 'managementSpecialization' &&
      course.isSeminar === true
  );

  const isThesisEligible =
    totalAssignedCredits >= 48 &&
    assignedTechCredits >= 18 &&
    assignedMethodCredits >= 6;

  const semesterSummaries = [1, 2, 3, 4].map((semester) => {
    const semesterCourses = courses.filter((course) => course.semester === semester);
    const semesterCredits = semesterCourses.reduce((sum, course) => sum + Number(course.credits || 0), 0);

    return {
      semester,
      courses: semesterCourses,
      credits: semesterCredits,
    };
  });

  const poolCourses = courses.filter(
    (course) =>
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

  const estimatedCardHeight = 84;
  const dynamicColumnHeight = `${Math.max(390, poolCourses.length * estimatedCardHeight + 120)}px`;

  const findCourse = (courseId) => courses.find((course) => String(course.id) === String(courseId));
  const activeCourse = activeCourseId ? findCourse(activeCourseId) : null;

  const getAllowedColumns = (course) => {
    if (!course) return [];
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
    const confirmed = window.confirm('This will clear all semester and category assignments. Continue?');
    if (!confirmed) return;

    const resetCourses = courses.map((course) => ({
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
      name: trimmedName,
      credits: parsedCredits,
      categories: newCourseCategories,
      semester: null,
      assignedCategory: null,
    };

    setCourses((prev) => [...prev, customCourse]);
    closeModal();
  };

  return (
    <div style={{ maxWidth: '1460px', margin: '0 auto', padding: '32px 28px 36px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#0f172a', marginBottom: '12px' }}>MMDT Two-Tier Semester Planner</h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={handleResetData}
          style={{
            padding: '9px 14px',
            background: '#fff1f2',
            color: '#9f1239',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Reset Assignments
        </button>
      </div>

      <div
        style={{
          background: isThesisEligible ? '#dcfce7' : '#fee2e2',
          border: `2px solid ${isThesisEligible ? '#22c55e' : '#ef4444'}`,
          borderRadius: '14px',
          padding: '14px 16px',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: '18px',
            color: isThesisEligible ? '#166534' : '#991b1b',
            marginBottom: '4px',
          }}
        >
          {isThesisEligible ? '🟢 Thesis Registration: UNLOCKED' : '🔒 Thesis Registration: LOCKED'}
        </div>
        {!isThesisEligible && (
          <div style={{ color: '#7f1d1d', fontSize: '14px' }}>
            Requires Total 48 ECTS (Current: {totalAssignedCredits}), Tech 18 ECTS (Current: {assignedTechCredits}), and Methods 6 ECTS (Current: {assignedMethodCredits}).
          </div>
        )}
      </div>

      <div
        style={{
          border: '1px solid #dbe5f0',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '26px',
          background: '#ffffff',
        }}
      >
        <div style={{ textAlign: 'center', color: '#334155', fontWeight: 600, marginBottom: '8px' }}>
          Global Planned ECTS: {totalAssignedCredits} / 120
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '8px' }}>
          <ProgressRing label="Methods" current={assignedMethodCredits} target={targets.methods} color="#2563eb" />
          <ProgressRing label="DigiTech" current={assignedTechCredits} target={targets.digitalTechnology} color="#0ea5e9" />
          <ProgressRing
            label="Mgmt Spec."
            current={currentManagementSpecialization}
            target={targets.managementSpecialization}
            color="#f59e0b"
          />
          <ProgressRing
            label="Mgmt Electives"
            current={currentManagementElectives}
            target={targets.managementElectives}
            color="#10b981"
          />
        </div>
      </div>

      <div
        style={{
          border: '1px solid #dbe5f0',
          borderRadius: '14px',
          background: '#ffffff',
          padding: '12px 14px',
          marginBottom: '18px',
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontSize: '14px' }}>
          Mandatory Graduation Requirements
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '14px' }}>
          <span>{hasMandatorySeminar ? '✅' : '❌'}</span>
          <span>1x Advanced Seminar in Mgmt Spec. (6 ECTS)</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px',
          marginBottom: '22px',
        }}
      >
        {semesterSummaries.map((summary) => {
          const isActive = activeSemester === summary.semester;
          return (
            <button
              key={summary.semester}
              type="button"
              onClick={() => setActiveSemester(summary.semester)}
              style={{
                textAlign: 'left',
                borderRadius: '14px',
                border: `2px solid ${isActive ? '#0f172a' : '#dbe5f0'}`,
                padding: '14px',
                background: isActive ? '#f8fafc' : '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                minHeight: '148px',
                boxShadow: isActive ? '0 8px 20px rgba(15, 23, 42, 0.12)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: '4px' }}>Semester {summary.semester}</div>
              <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>{summary.credits} ECTS planned</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {summary.courses.length === 0 && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>No courses assigned</span>
                )}
                {summary.courses.map((course) => (
                  <span
                    key={course.id}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '999px',
                      border: '1px solid #dbe5f0',
                      background: '#ffffff',
                      color: '#334155',
                    }}
                  >
                    {course.name}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
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
          style={{
            overflowX: 'auto',
            display: 'flex',
            gap: '20px',
            alignItems: 'start',
            paddingBottom: '8px',
          }}
        >
          <DropColumn
            title="Course Pool"
            columnId="coursePool"
            courses={poolCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('coursePool') : false}
            isActivePool
            minHeight={dynamicColumnHeight}
            headerActions={(
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  }}
                >
                  <option value="All">All</option>
                  <option value="methods">methods</option>
                  <option value="digitalTechnology">digitalTechnology</option>
                  <option value="managementSpecialization">managementSpecialization</option>
                  <option value="managementElectives">managementElectives</option>
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
                    width: '130px',
                  }}
                />
                <button
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
            minHeight={dynamicColumnHeight}
          />
          <DropColumn
            title="Digital Technology"
            columnId="digitalTechnology"
            courses={techCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('digitalTechnology') : false}
            minHeight={dynamicColumnHeight}
          />
          <DropColumn
            title="Management Specialization"
            columnId="managementSpecialization"
            courses={specCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('managementSpecialization') : false}
            minHeight={dynamicColumnHeight}
          />
          <DropColumn
            title="Management Electives"
            columnId="managementElectives"
            courses={electiveCourses}
            highlightValid={activeCourseId ? activeAllowedColumns.includes('managementElectives') : false}
            minHeight={dynamicColumnHeight}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CATEGORY_OPTIONS.map((category) => (
                  <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
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

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- Animated D3.js Visual Component ---
const ProgressRing = ({ label, current, target, color }) => {
  const svgRef = useRef();
  const pathRef = useRef(null); // Keep track of the previous progress for animation

  useEffect(() => {
    const width = 140;
    const height = 140;
    const radius = Math.min(width, height) / 2 - 10;
    const progress = Math.min(current / target, 1);

    const svg = d3.select(svgRef.current);

    // Only build the base SVG structure once
    if (svg.select('g').empty()) {
      const group = svg
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const arc = d3.arc()
        .innerRadius(radius - 15)
        .outerRadius(radius)
        .startAngle(0);

      // Gray background ring
      group.append('path')
        .datum({ endAngle: 2 * Math.PI })
        .style('fill', '#e2e8f0')
        .attr('d', arc);

      // Colored progress ring (initialize at 0)
      pathRef.current = group.append('path')
        .datum({ endAngle: 0 })
        .style('fill', color)
        .attr('d', arc);

      // Center Text (Credits)
      group.append('text')
        .attr('class', 'credits-text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.1em')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .style('fill', '#1e293b');

      // Center Text (Label)
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .style('font-size', '10px')
        .style('fill', '#64748b')
        .text(label);
    }

    // Update the dynamic parts (Animation)
    const group = svg.select('g');
    const arc = d3.arc()
      .innerRadius(radius - 15)
      .outerRadius(radius)
      .startAngle(0);

    // Animate the arc drawing
    pathRef.current.transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate(d.endAngle, progress * 2 * Math.PI);
        return function (t) {
          d.endAngle = interpolate(t);
          return arc(d);
        };
      });

    // Update text
    group.select('.credits-text').text(`${current}/${target}`);
  }, [current, target, label, color]);

  return <svg ref={svgRef}></svg>;
};

// --- Main Application ---
function App() {
  const targets = {
    methods: 12,
    digitalTechnology: 30,
    managementSpecialization: 30,
    managementElectives: 18,
    thesis: 30
  };

  // 1. Initialize state from LocalStorage
  const [courses, setCourses] = useState(() => {
    const savedCourses = localStorage.getItem('mmdt-tracker-data');
    if (savedCourses) {
      return JSON.parse(savedCourses);
    }
    return [
      { id: 1, name: 'Business Analytics with Python', credits: 6, category: 'methods' },
      { id: 2, name: 'Digital Finance', credits: 6, category: 'digitalTechnology' }
    ];
  });

  // 2. Save to LocalStorage whenever courses change
  useEffect(() => {
    localStorage.setItem('mmdt-tracker-data', JSON.stringify(courses));
  }, [courses]);

  // Form State
  const [courseName, setCourseName] = useState('');
  const [courseCredits, setCourseCredits] = useState(6);
  const [courseCategory, setCourseCategory] = useState('digitalTechnology');

  const calculateProgress = (category) => {
    return courses
      .filter(course => course.category === category)
      .reduce((sum, course) => sum + Number(course.credits), 0);
  };

  const currentMethods = calculateProgress('methods');
  const currentTech = calculateProgress('digitalTechnology');
  const totalCredits = courses.reduce((sum, course) => sum + Number(course.credits), 0);

  // Strict TUM MMDT Thesis Logic
  const isThesisEligible =
    totalCredits >= 48 &&
    currentTech >= 18 &&
    currentMethods >= 6;

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!courseName) return;

    const newCourse = {
      id: Date.now(),
      name: courseName,
      credits: Number(courseCredits),
      category: courseCategory
    };

    setCourses([...courses, newCourse]);
    setCourseName(''); // reset form
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter(course => course.id !== id));
  };

  const handleResetData = () => {
    const confirmed = window.confirm('This will delete your entire saved study plan. Continue?');
    if (!confirmed) return;

    localStorage.removeItem('mmdt-tracker-data');
    setCourses([]);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#0f172a' }}>MMDT Command Center</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={handleResetData}
          style={{
            padding: '8px 14px',
            background: '#fff1f2',
            color: '#9f1239',
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Reset Data
        </button>
      </div>

      {/* Thesis Status Banner */}
      <div style={{
        background: isThesisEligible ? '#dcfce7' : '#fee2e2',
        border: `1px solid ${isThesisEligible ? '#22c55e' : '#ef4444'}`,
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '30px',
        transition: 'all 0.5s ease'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: isThesisEligible ? '#166534' : '#991b1b' }}>
          {isThesisEligible ? '🟢 Thesis Registration: UNLOCKED' : '🔒 Thesis Registration: LOCKED'}
        </h2>
        <p style={{ margin: 0 }}>Total Degree Progress: {totalCredits} / 120 ECTS</p>
        {!isThesisEligible && (
          <p style={{ fontSize: '14px', color: '#7f1d1d', marginTop: '10px' }}>
            *Requires 48 Total ECTS (Current: {totalCredits}), 18 Tech ECTS (Current: {currentTech}), and 6 Method ECTS (Current: {currentMethods}).
          </p>
        )}
      </div>

      {/* D3 Visualizations */}
      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', marginBottom: '40px' }}>
        <ProgressRing label="Methods" current={currentMethods} target={targets.methods} color="#3b82f6" />
        <ProgressRing label="DigiTech" current={currentTech} target={targets.digitalTechnology} color="#8b5cf6" />
        <ProgressRing label="Mgmt Spec." current={calculateProgress('managementSpecialization')} target={targets.managementSpecialization} color="#f59e0b" />
        <ProgressRing label="Mgmt Electives" current={calculateProgress('managementElectives')} target={targets.managementElectives} color="#10b981" />
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>

        {/* Add Course Form */}
        <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
          <h3>Add a Course</h3>
          <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              placeholder="Course Name (e.g., Deep Reinforcement Learning)"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />

            <select
              value={courseCategory}
              onChange={(e) => setCourseCategory(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="methods">Methods</option>
              <option value="digitalTechnology">Digital Technology</option>
              <option value="managementSpecialization">Specialization in Management</option>
              <option value="managementElectives">Electives in Management</option>
            </select>

            <input
              type="number"
              value={courseCredits}
              onChange={(e) => setCourseCredits(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />

            <button type="submit" style={{ padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={(e) => e.target.style.background = '#334155'} onMouseOut={(e) => e.target.style.background = '#0f172a'}>
              + Add to Study Plan
            </button>
          </form>
        </div>

        {/* Course List */}
        <div style={{ flex: 1 }}>
          <h3>Your Plan</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {courses.length === 0 ? <p style={{ color: '#64748b' }}>No courses added yet.</p> : courses.map(course => (
              <li key={course.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
                <div>
                  <strong>{course.name}</strong>
                  <br />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{course.credits} ECTS • {course.category}</span>
                </div>
                <button onClick={() => deleteCourse(course.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.target.style.background = '#dc2626'} onMouseOut={(e) => e.target.style.background = '#ef4444'}>
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default App;

export const STORAGE_SCHEMA_VERSION = 3;

const VALID_CATEGORIES = new Set([
  'methods',
  'digitalTechnology',
  'managementSpecialization',
  'managementElectives',
  'thesis',
]);
const VALID_CURRICULUM_BRANCHES = new Set(['M', 'SA', 'SC', 'D', 'EF', 'ED', 'EO', 'T']);

const isValidSemester = (value) => Number.isInteger(value) && value > 0;

const isCustomCourse = (course) =>
  course?.isCustom === true || String(course?.id ?? '').startsWith('custom-');

const preserveCurriculumBranches = (course) =>
  Array.isArray(course.curriculumBranches)
    ? Array.from(new Set(course.curriculumBranches.filter((branch) => VALID_CURRICULUM_BRANCHES.has(branch))))
    : [];

export const normalizeCourse = (course) => {
  const categories = Array.isArray(course.categories)
    ? course.categories.filter((category) => VALID_CATEGORIES.has(category))
    : [];
  const semester = isValidSemester(course.semester) ? course.semester : null;
  const assignedCategory = categories.includes(course.assignedCategory)
    ? course.assignedCategory
    : null;

  if (!semester || !assignedCategory) {
    return {
      ...course,
      categories,
      semester: null,
      assignedCategory: null,
    };
  }

  return {
    ...course,
    categories,
    semester,
    assignedCategory,
  };
};

export const migrateStoredCourses = (savedCourses, currentCatalog) => {
  const currentIds = new Set(currentCatalog.map((course) => String(course.id)));
  const savedById = new Map(
    savedCourses
      .filter((course) => course && course.id !== undefined && course.id !== null)
      .map((course) => [String(course.id), course])
  );

  const currentCourses = currentCatalog.map((base) => {
    const persisted = savedById.get(String(base.id));
    return normalizeCourse({
      ...base,
      semester: persisted?.semester ?? null,
      assignedCategory: persisted?.assignedCategory ?? null,
    });
  });

  const retainedCourses = savedCourses.flatMap((savedCourse) => {
    if (!savedCourse || savedCourse.id === undefined || savedCourse.id === null) return [];
    if (currentIds.has(String(savedCourse.id))) return [];

    if (isCustomCourse(savedCourse)) {
      return [
        normalizeCourse({
          ...savedCourse,
          moduleId: savedCourse.moduleId ?? null,
          curriculumBranches: preserveCurriculumBranches(savedCourse),
          isCustom: true,
          isLegacy: false,
        }),
      ];
    }

    const legacyCourse = normalizeCourse({
      ...savedCourse,
      curriculumBranches: preserveCurriculumBranches(savedCourse),
      isLegacy: true,
    });

    // Unassigned retired built-ins are omitted. Assigned ones remain visible as history.
    return legacyCourse.semester !== null && legacyCourse.assignedCategory !== null
      ? [legacyCourse]
      : [];
  });

  return [...currentCourses, ...retainedCourses];
};

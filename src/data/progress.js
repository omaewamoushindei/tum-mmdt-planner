const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

export const getSemesterStatus = (semester, currentSemester) => {
  if (!isPositiveInteger(semester) || !isPositiveInteger(currentSemester)) {
    return 'unclassified';
  }

  if (semester < currentSemester) return 'completed';
  if (semester === currentSemester) return 'current';
  return 'planned';
};

export const summarizeProgress = (courses, currentSemester, category) => {
  const relevantCourses = courses.filter(
    (course) =>
      isPositiveInteger(course.semester) &&
      course.assignedCategory !== null &&
      course.assignedCategory !== undefined &&
      (category === undefined || course.assignedCategory === category)
  );

  const total = relevantCourses.reduce((sum, course) => sum + Number(course.credits || 0), 0);

  if (!isPositiveInteger(currentSemester)) {
    return {
      earned: null,
      inProgress: null,
      future: null,
      total,
    };
  }

  return relevantCourses.reduce(
    (summary, course) => {
      const credits = Number(course.credits || 0);
      const status = getSemesterStatus(course.semester, currentSemester);

      if (status === 'completed') summary.earned += credits;
      if (status === 'current') summary.inProgress += credits;
      if (status === 'planned') summary.future += credits;

      return summary;
    },
    {
      earned: 0,
      inProgress: 0,
      future: 0,
      total,
    }
  );
};

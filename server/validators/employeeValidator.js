export const validateEmployee = (req, res, next) => {
  const { name, employeeId, department, email, roleId, isEmployee } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (isEmployee) {
    if (!department || typeof department !== 'string' || department.trim() === '') {
      errors.push('Department is required and must be a non-empty string');
    }

    if (employeeId && typeof employeeId !== 'string') {
      errors.push('Employee ID must be a string');
    } else if (employeeId) {
      const formatted = employeeId.trim().padStart(4, '0');
      if (!/^\d{4}$/.test(formatted)) {
        errors.push('Employee ID must be a number up to 4 digits');
      }
    }
  }

  if (req.method === 'POST') {
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('A valid email is required');
    }
    if (!roleId) {
      errors.push('Role ID is required');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

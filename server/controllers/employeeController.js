import Employee from '../models/Employee.js';

export const createEmployee = async (req, res) => {
    try {
        const { name, employeeId, department, email } = req.body;
        const employeeExists = await Employee.findOne({ employeeId });

        if (employeeExists) {
            return res.status(400).json({ message: 'Employee with this ID already exists' });
        }

        const employee = await Employee.create({name, employeeId,department, email});
        res.status(201).json(employee);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({});
        res.json(employees);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            employee.name = req.body.name || employee.name;
            employee.employeeId = req.body.employeeId || employee.employeeId;
            employee.department = req.body.department || employee.department;
            employee.email = req.body.email || employee.email;
            const updatedEmployee = await employee.save();
            res.json(updatedEmployee);
        }
        else {
            res.status(404).json({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (employee) {
            await Employee.deleteOne({ _id: employee._id });
            res.json({ message: 'Employee removed' });
        }
        else {
            res.status(404).json({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
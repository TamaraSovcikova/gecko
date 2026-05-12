const request = require('supertest');
const express = require('express');

jest.mock('../../src/middleware/auth', () => (req, res, next) => {req.user = { uid: 'test' };next()});
jest.mock('../../src/models/Expense', () => ({aggregate: jest.fn(),find: jest.fn(),}));
jest.mock('../../src/models/MonthlyBudget', () => ({findOne: jest.fn(),}));
jest.mock('../../src/models/User', () => ({findById: jest.fn().mockResolvedValue(null)}));
jest.mock('../../src/services/adzunaCalculator', () => ({getAverageSalary: jest.fn().mockResolvedValue(null)}));
jest.mock('../../src/services/healthScoreService', () => ({computeHealthScoreBreakdown: jest.fn(() => ({ healthScore: 100 }))}));

//const authMiddleware = require("../../src/middleware/auth");
const Expense = require('../../src/models/Expense');
const MonthlyBudget = require('../../src/models/MonthlyBudget');
const dashboardRouter = require('../../src/routes/dashboard');
const app = express();


app.use(express.json());
app.use('/api/v1/dashboard', dashboardRouter);

describe('Backend (Jest): Expense score check', () => {

    test('GET /api/v1/dashboard - does not crash if no expenses exist', async () => {
        
        // GIVEN: A user exists in the database with no expenses or budget categories
        // AND a valid authentication token is provided

        MonthlyBudget.findOne.mockReturnValue({sort: jest.fn().mockResolvedValue({takeHomePay: 2500, categories: [],}),});
        
        Expense.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
          });

        Expense.aggregate.mockResolvedValue([]);

        // WHEN: A request is sent to /api/v1/dashboard

        const response = await request(app).get('/api/v1/dashboard');

        // THEN: the response should return default (100) dashboard value wihtout NaN error
        console.log(response.body);
        expect(response.body.healthScore).toBe(100);
        expect(Number.isNaN(response.body.healthScore)).toBe(false);
    });
});
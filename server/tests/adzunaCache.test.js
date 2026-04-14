jest.mock("axios", () => ({get: jest.fn()}));

describe("Backend: Adzuna cache hit", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env.ADZUNA_APP_ID = "test_id";
        process.env.ADZUNA_APP_KEY = "test_key";
    });

    test('mock layer for benchmark "software engineer intern"', async () => {
        // GIVEN: A valid Adzuna configuration and no cached salary for the first request
        const axios = require("axios");
        axios.get.mockResolvedValue({
            data: {
                results: [{ salary_max: 3000 }, { salary_max: 6000 }, { salary_max: 9000 }]
            }
        });
        const { getAverageSalary } = require("../src/services/adzunaCalculator");
        // WHEN: The benchmark is requested for the first time
        const firstResult = await getAverageSalary("software engineer intern", "Anywehere");

        // THEN: The Adzuna API should be called
        expect(firstResult).toBe(6000);
        expect(axios.get).toHaveBeenCalledTimes(1);

        // WHEN: The same benchmark is requested again immediately
        const secondResult = await getAverageSalary("software engineer intern", "anywehere");

        // THEN: cached value should be returned and no scond call to adzuna
        expect(secondResult).toBe(6000);
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});
// services/adzunaCalculator.js - Adzuna Jobs API integration
// Fetches average salary for a job title and location
// Caches results for 24 hours

const axios = require("axios");

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const BASE_URL = "https://api.adzuna.com/v1/api/jobs/gb/search";
const CATEGORIES_URL = "https://api.adzuna.com/v1/api/jobs/gb/categories";

// Simple in-memory cache with TTL
const cache = new Map();
const jobCache = new Map();

const getCacheKey = (jobTitle, location) => `${jobTitle}-${location}`.toLowerCase();
const getJobSearchCacheKey = (searchTerm) => `job-search-${searchTerm}`.toLowerCase();

const isCacheValid = (timestamp) => {
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return Date.now() - timestamp < CACHE_TTL;
};

// Search for job titles/categories
const searchJobTitles = async (searchTerm = "") => {
  try {
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      console.log("Adzuna API keys not configured");
      return [];
    }

    const cacheKey = getJobSearchCacheKey(searchTerm);
    
    // Check cache first
    if (jobCache.has(cacheKey) && isCacheValid(jobCache.get(cacheKey).timestamp)) {
      console.log(`Job cache hit for: ${cacheKey}`);
      return jobCache.get(cacheKey).jobs;
    }

    // If no search term provided, fetch popular categories
    if (!searchTerm || searchTerm.trim() === "") {
      const response = await axios.get(CATEGORIES_URL, {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
        },
        timeout: 5000,
      });

      if (response.data.categories) {
        const jobs = response.data.categories.map((cat) => ({
          title: cat.tag,
          label: cat.title || cat.tag,
          count: cat.count,
        }));

        // Cache the result
        jobCache.set(cacheKey, {
          jobs: jobs,
          timestamp: Date.now(),
        });

        return jobs;
      }
    }

    // Search for specific job titles
    const response = await axios.get(BASE_URL, {
      params: {
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        what: searchTerm,
        results_per_page: 50,
      },
      timeout: 5000,
    });

    if (response.data.results) {
      // Extract unique job titles from results
      const jobTitles = new Set();
      response.data.results.forEach((job) => {
        if (job.title) {
          jobTitles.add(job.title);
        }
      });

      const jobs = Array.from(jobTitles)
        .slice(0, 20) // Limit to 20 results
        .map((title) => ({
          title: title,
          label: title,
        }));

      // Cache the result
      jobCache.set(cacheKey, {
        jobs: jobs,
        timestamp: Date.now(),
      });

      console.log(`Job search returned ${jobs.length} results for: ${searchTerm}`);
      return jobs;
    }

    return [];
  } catch (error) {
    console.error("Error searching job titles from Adzuna API:", error.message);
    return [];
  }
};

// Search for locations
const searchLocations = async (searchTerm = "") => {
  try {
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      console.log("Adzuna API keys not configured");
      return [];
    }

    const cacheKey = `location-search-${searchTerm}`.toLowerCase();
    
    // Check cache first
    if (jobCache.has(cacheKey) && isCacheValid(jobCache.get(cacheKey).timestamp)) {
      console.log(`Location cache hit for: ${cacheKey}`);
      return jobCache.get(cacheKey).jobs;
    }

    // Popular UK locations if no search term
    if (!searchTerm || searchTerm.trim() === "") {
      const locations = [
        { title: "London", label: "London" },
        { title: "Manchester", label: "Manchester" },
        { title: "Birmingham", label: "Birmingham" },
        { title: "Leeds", label: "Leeds" },
        { title: "Bristol", label: "Bristol" },
        { title: "Edinburgh", label: "Edinburgh" },
        { title: "Glasgow", label: "Glasgow" },
        { title: "Cambridge", label: "Cambridge" },
        { title: "Oxford", label: "Oxford" },
        { title: "Liverpool", label: "Liverpool" },
        { title: "Reading", label: "Reading" },
        { title: "Cardiff", label: "Cardiff" },
        { title: "Southampton", label: "Southampton" },
        { title: "Nottingham", label: "Nottingham" },
        { title: "Newcastle", label: "Newcastle" },
      ];

      jobCache.set(cacheKey, {
        jobs: locations,
        timestamp: Date.now(),
      });

      return locations;
    }

    // Search for locations with jobs in that area
    const response = await axios.get(BASE_URL, {
      params: {
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        where: searchTerm,
        results_per_page: 50,
      },
      timeout: 5000,
    });

    if (response.data.results) {
      // Extract unique locations from results
      const locations = new Set();
      response.data.results.forEach((job) => {
        if (job.location && job.location.display_name) {
          locations.add(job.location.display_name);
        }
      });

      const locationList = Array.from(locations)
        .slice(0, 20) // Limit to 20 results
        .map((loc) => ({
          title: loc,
          label: loc,
        }));

      // Cache the result
      jobCache.set(cacheKey, {
        jobs: locationList,
        timestamp: Date.now(),
      });

      console.log(`Location search returned ${locationList.length} results for: ${searchTerm}`);
      return locationList;
    }

    return [];
  } catch (error) {
    console.error("Error searching locations from Adzuna API:", error.message);
    return [];
  }
};

const getAverageSalary = async (jobTitle, location) => {
  try {
    // Check if API keys are configured
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      console.log("Adzuna API keys not configured - skipping salary lookup");
      return null;
    }

    if (!jobTitle || !location) {
      return null;
    }

    const cacheKey = getCacheKey(jobTitle, location);

    // Check cache first
    if (cache.has(cacheKey) && isCacheValid(cache.get(cacheKey).timestamp)) {
      console.log(`Cache hit for: ${cacheKey}`);
      return cache.get(cacheKey).salary;
    }

    // Query Adzuna API
    const response = await axios.get(BASE_URL, {
      params: {
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        what: jobTitle,
        where: location,
        results_per_page: 10,
        sort_by: "relevance",
      },
      timeout: 5000,
    });

    if (response.data.results && response.data.results.length > 0) {
      // Calculate average salary from results
      const salaries = response.data.results
        .map((job) => job.salary_max || job.salary_min)
        .filter((salary) => salary > 0);

      if (salaries.length > 0) {
        const avgSalary = Math.round(
          salaries.reduce((a, b) => a + b, 0) / salaries.length
        );

        // Cache the result
        cache.set(cacheKey, {
          salary: avgSalary,
          timestamp: Date.now(),
        });

        console.log(`Adzuna API call successful for: ${cacheKey}`);
        return avgSalary;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching from Adzuna API:", error.message);
    return null;
  }
};

module.exports = {
  getAverageSalary,
  searchJobTitles,
  searchLocations,
};

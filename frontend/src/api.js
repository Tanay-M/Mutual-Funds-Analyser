import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const searchFunds = async (query, filterType) => {
    try {
        const params = { q: query };
        if (filterType) {
            params.filter = filterType;
        }
        const response = await api.get('/search', { params });
        return response.data;
    } catch (error) {
        console.error("Error searching funds:", error);
        return [];
    }
};

export const getComparison = async (codes, years, benchmark) => {
    try {
        const params = new URLSearchParams();
        codes.forEach(code => params.append('codes', code));
        params.append('years', years);
        params.append('benchmark', benchmark);

        const response = await api.get('/compare', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching comparison:", error);
        return null;
    }
};

export default api;

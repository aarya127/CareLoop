import { describe, it, expect } from 'jest';
import { initializeApp } from '../src/app';

describe('Application Initialization', () => {
    it('should initialize the application correctly', () => {
        const app = initializeApp();
        expect(app).toBeDefined();
        expect(app.status).toBe('running');
    });
});
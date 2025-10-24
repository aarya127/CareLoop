export type AppConfig = {
    port: number;
    env: 'development' | 'production';
};

export interface User {
    id: string;
    name: string;
    email: string;
}

export type ApiResponse<T> = {
    data: T;
    error?: string;
};
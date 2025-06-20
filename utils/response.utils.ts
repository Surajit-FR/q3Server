interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;

}

export function handleResponse<T>(res: any,status: 'success' | 'error',statusCode: number, data: T,  message?: string,): void {
    const response: ApiResponse<T> = {
        status: status,
        data: data,
        message: message,
    };
    res.status(statusCode).json(response);
}
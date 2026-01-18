import {post} from "./ApiService";

export interface LoginResponse {
    accessToken: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export const useLogin = async (email: string, password: string): Promise<void> => {
    const {accessToken} = await post<LoginResponse>('/auth/login', {username: email, password});
    localStorage.setItem('token', accessToken);
};

export const useLoginWithTelegram = async (initData: string): Promise<void> => {
    const {accessToken} = await post<LoginResponse>('/auth/login/telegram', {initData});
    localStorage.setItem('token', accessToken);
};

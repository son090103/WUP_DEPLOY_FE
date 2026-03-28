import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
interface UserState {
    user: null | {
        _id: number;
        name: string;
        phone: string;
        avatar: {
            url: string
        };
        role_id: string;
    };
}

const initialState: UserState = {
    user: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<UserState["user"]>) => {
            // cách viết trên là phá vỡ cấu trúc détructoring
            state.user = action.payload;
        },
        logout: (state) => {
            state.user = null;
        },
    },
});

export const { loginSuccess, logout } = userSlice.actions;
export default userSlice.reducer;

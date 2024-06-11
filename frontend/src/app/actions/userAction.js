import {
  loadUserFail,
  loadUserRequest,
  loadUserSuccess,
} from "../reducers/userAccountSlice.js";
import api from "../../utils/axiosClient.js";

export const loadUser = () => async (dispatch) => {
  try {
    dispatch(loadUserRequest());

    const { data } = await api.get(`/users/get-portfolio-as-owner`, {
      withCredentials: true,
    });
    dispatch(loadUserSuccess(data?.data));
  } catch (error) {
    dispatch(loadUserFail(error.response.data.message));
  }
};

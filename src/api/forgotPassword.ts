import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";

interface RegistrationResponse {
    email: string;
    user: string;
    type: string;
}
const csrfToken = localStorage.getItem("csrfToken") || "";
const authToken = localStorage.getItem("authToken") || "";

export const fetchUserByEmail = async (token: string) => {
    try {
        const response = await axios.get<RegistrationResponse>(
            `${siteConfig.apiEndpoint}/api/eperson/registrations/search/findByToken?token=${token}`
        );
        if (response.status === 200) {
            showToast("User fetched successfully!", "success");
        }
        return {
            email: response.data.email,
            epersonId: response.data.user
        };

    } catch (error: any) {
        const errorStatus = error.response?.status || 500;
        if (errorStatus === 400) {
            window.location.href = `/error-400`;
        } else if (errorStatus === 401) {
            window.location.href = `/error-401`;
        } else if (errorStatus === 403) {
            window.location.href = `/error-403`;
        } else if (errorStatus === 422) {
            window.location.href = `/error-422`;
        } else if (errorStatus === 500) {
            window.location.href = `/error-500`;
        } else {
            window.location.href = `/error-404`;
        }
        throw new Error("Invalid token or expired link.");
    }
};

export const resetPassword = async (epersonId: string, newPassword: string, token: string) => {
    try {
        const response = await axios.patch(
            `${siteConfig.apiEndpoint}/api/eperson/epersons/${epersonId}?token=${token}`,

            [
                { op: "add", path: "/password", value: { new_password: newPassword } }
            ],
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                },
                withCredentials: true,
            }
        );
        if (response.status === 201) {
            showToast(`An email has been sent to your email containing a special URL and further instructions.`, "success");
        }
        return response.data;
    } catch (error: any) {
        const errorStatus = error.response?.status || 500;
        if (errorStatus === 400) {
            window.location.href = `/error-400`;
        } else if (errorStatus === 401) {
            window.location.href = `/error-401`;
        } else if (errorStatus === 403) {
            window.location.href = `/error-403`;
        } else if (errorStatus === 422) {
            window.location.href = `/error-422`;
        } else if (errorStatus === 500) {
            window.location.href = `/error-500`;
        } else {
            window.location.href = `/error-404`;
        }
        throw error;
    }
};

export const userRegister = async (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
    token: string
) => {
    try {
        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/eperson/epersons?token=${token}`,
            {
                canLogIn: true,
                email: email,
                requireCertificate: false,
                password: password,
                metadata: {
                    "eperson.firstname": [{ value: firstName }],
                    "eperson.lastname": [{ value: lastName }],
                    "eperson.phone": [{ value: phone }],
                    "eperson.language": [{ value: "en" }],
                    "dspace.agreements.end-user": [{ value: "true" }],
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                },
                withCredentials: true,
            }
        );
        if (response.status === 201) {
            showToast("A confirmation mail send on your registered email.", "success");
        }
        return response.data;
    } catch (error: any) {
        const errorStatus = error.response?.status || 500;
        if (errorStatus === 400) {
            window.location.href = `/error-400`;
        } else if (errorStatus === 401) {
            window.location.href = `/error-401`;
        } else if (errorStatus === 403) {
            window.location.href = `/error-403`;
        } else if (errorStatus === 422) {
            window.location.href = `/error-422`;
        } else if (errorStatus === 500) {
            window.location.href = `/error-500`;
        } else {
            window.location.href = `/error-404`;
        }

    }
};


// http://localhost:8080/server/api/eperson/epersons/791863d2-a1ee-4441-bd4d-71bb289dd762

export const changePassword = async (epersonId: string, currentPassword: string, newPassword: string) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/eperson/epersons/${epersonId}`;
    try{
        const response = await axios.patch(apiUrl,
            [{op: "add", path: "/password", value: {new_password: `${newPassword}`, current_password: `${currentPassword}`}}],
            {
                headers:{
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials:true,
            }
        )
            return response;
    }catch(error){
        console.error('Failed to reset Password',error);
    }
}
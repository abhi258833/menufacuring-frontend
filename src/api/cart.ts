import { siteConfig } from "../data/data";
import axios from "axios";
export const updateUserCart = async (
    userID: string,
    bitstreamUUID: string,
): Promise<void> => {
    const authToken = localStorage.getItem("authToken") || "";
    const csrfToken = localStorage.getItem("csrfToken") || "";

    const payload = [
        {
            op: "add",
            path: "/metadata/eperson.cart",
            value: `${bitstreamUUID}`,
        },
    ];

    try {
        await axios.patch(
            `${siteConfig.apiEndpoint}/api/eperson/epersons/${userID}`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );
        console.log("Cart updated successfully.");
    } catch (error) {
        console.error("Failed to update user cart:", error);
        throw error;
    }
};


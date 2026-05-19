import { showToast } from "../contexts/ToastProvider";
import { siteConfig } from "../data/data"
import axios from "axios";

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";
export const CreateCommunity = async(
    title: string,
    discription:string,
) => {
   try{
    const response = await axios.post(`${siteConfig.apiEndpoint}/api/core/communities`, {
        metadata :{
            "dc.title":[{value:title}],
            "dc.description":[{value:discription}],
        }
    },
    {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          "Authorization": authToken 
        },
        withCredentials: true
      }
);
    if(response.status === 201){
        showToast("Community created successfully!", "success");
    }
   }catch(error: any){
    const errorStatus = error.response.status || 500;
    if(errorStatus === 400){
      window.location.href = `/error-400`;
    }else if(errorStatus === 401){
      window.location.href = `/error-401`;
    }else if(errorStatus === 403){
      window.location.href = `/error-403`;
    }else if(errorStatus === 422){
      window.location.href = `/error-422`;
    }else if(errorStatus === 500){
      window.location.href = `/error-500`;
    }else{
      window.location.href = `/error-404`;
    }
   }
}
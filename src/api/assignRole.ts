import axios from 'axios'
import { siteConfig } from '../data/data'
import { showToast } from '../contexts/ToastProvider'

export interface Group {
    id: string
    uuid: string
    name: string
    metadata?: {
        'dc.description'?: Array<{
            value: string
            language: null
            authority: null
            confidence: number
            place: number
        }>
    }
    _links?: {
        self: {
            href: string
        }
    }
}

const authToken = localStorage.getItem('authToken') || ''
const csrfToken = localStorage.getItem('csrfToken') || ''

const headers = {
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': csrfToken,
    Authorization: authToken,
}

// Submitter Role Functions
export const fetchSubmitterGroup = async (uuid: string): Promise<Group | null> => {
    try {
        const response = await axios.get<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/submittersGroup`,
            { headers, withCredentials: true }
        )
        return response.data
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null
        }
        console.error('Error fetching submitter group:', error)
        throw error
    }
}

export const createSubmitterGroup = async (
    uuid: string,
    description: string
): Promise<Group> => {
    try {
        const response = await axios.post<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/submittersGroup`,
            {
                metadata: {
                    'dc.description': [{ value: description }],
                },
            },
            { headers, withCredentials: true }
        )
        showToast('Submitter group created successfully', 'success')
        return response.data
    } catch (error: any) {
        console.error('Error creating submitter group:', error)
        showToast('Failed to create submitter group', 'error')
        throw error
    }
}

export const deleteSubmitterGroup = async (uuid: string): Promise<void> => {
    try {
        await axios.delete(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/submittersGroup`,
            { headers, withCredentials: true }
        )
        showToast('Submitter group deleted successfully', 'success')
    } catch (error: any) {
        console.error('Error deleting submitter group:', error)
        showToast('Failed to delete submitter group', 'error')
        throw error
    }
}

// Reviewer Role Functions
export const fetchReviewerGroup = async (uuid: string): Promise<Group | null> => {
    try {
        const response = await axios.get<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/reviewer`,
            { headers, withCredentials: true }
        )
        return response.data
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null
        }
        console.error('Error fetching reviewer group:', error)
        throw error
    }
}

export const createReviewerGroup = async (
    uuid: string,
    description: string
): Promise<Group> => {
    try {
        const response = await axios.post<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/reviewer`,
            {
                metadata: {
                    'dc.description': [{ value: description }],
                },
            },
            { headers, withCredentials: true }
        )
        showToast('Reviewer group created successfully', 'success')
        return response.data
    } catch (error: any) {
        console.error('Error creating reviewer group:', error)
        showToast('Failed to create reviewer group', 'error')
        throw error
    }
}

export const deleteReviewerGroup = async (uuid: string): Promise<void> => {
    try {
        await axios.delete(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/reviewer`,
            { headers, withCredentials: true }
        )
        showToast('Reviewer group deleted successfully', 'success')
    } catch (error: any) {
        console.error('Error deleting reviewer group:', error)
        showToast('Failed to delete reviewer group', 'error')
        throw error
    }
}

// Editor Role Functions
export const fetchEditorGroup = async (uuid: string): Promise<Group | null> => {
    try {
        const response = await axios.get<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/editor`,
            { headers, withCredentials: true }
        )
        return response.data
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null
        }
        console.error('Error fetching editor group:', error)
        throw error
    }
}

export const createEditorGroup = async (
    uuid: string,
    description: string
): Promise<Group> => {
    try {
        const response = await axios.post<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/editor`,
            {
                metadata: {
                    'dc.description': [{ value: description }],
                },
            },
            { headers, withCredentials: true }
        )
        showToast('Editor group created successfully', 'success')
        return response.data
    } catch (error: any) {
        console.error('Error creating editor group:', error)
        showToast('Failed to create editor group', 'error')
        throw error
    }
}

export const deleteEditorGroup = async (uuid: string): Promise<void> => {
    try {
        await axios.delete(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/editor`,
            { headers, withCredentials: true }
        )
        showToast('Editor group deleted successfully', 'success')
    } catch (error: any) {
        console.error('Error deleting editor group:', error)
        showToast('Failed to delete editor group', 'error')
        throw error
    }
}

// Final Editor Role Functions
export const fetchFinalEditorGroup = async (uuid: string): Promise<Group | null> => {
    try {
        const response = await axios.get<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/finaleditor`,
            { headers, withCredentials: true }
        )
        return response.data
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null
        }
        console.error('Error fetching final editor group:', error)
        throw error
    }
}

export const createFinalEditorGroup = async (
    uuid: string,
    description: string
): Promise<Group> => {
    try {
        const response = await axios.post<Group>(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/finaleditor`,
            {
                metadata: {
                    'dc.description': [{ value: description }],
                },
            },
            { headers, withCredentials: true }
        )
        showToast('Final Editor group created successfully', 'success')
        return response.data
    } catch (error: any) {
        console.error('Error creating final editor group:', error)
        showToast('Failed to create final editor group', 'error')
        throw error
    }
}

export const deleteFinalEditorGroup = async (uuid: string): Promise<void> => {
    try {
        await axios.delete(
            `${siteConfig.apiEndpoint}/api/core/collections/${uuid}/workflowGroups/finaleditor`,
            { headers, withCredentials: true }
        )
        showToast('Final Editor group deleted successfully', 'success')
    } catch (error: any) {
        console.error('Error deleting final editor group:', error)
        showToast('Failed to delete final editor group', 'error')
        throw error
    }
}

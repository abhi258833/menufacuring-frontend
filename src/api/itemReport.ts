import { siteConfig } from "../data/data";
import axios from "axios";
import type { ApiResponse, Community, Collection, Item } from "../data/itemReportData";

const getAuthToken = () => localStorage.getItem("authToken") || "";

export const itemReportApi = async (queryParams: string): Promise<ApiResponse> => {
  try {
    const authToken = getAuthToken();

    if (!authToken) {
      throw new Error("Authentication token not found. Please login.");
    }

    console.log("🚀 Calling /api/report/community endpoint...");
    
    // Parse only page and size params - ignore other filters (they'll be handled client-side)
    const params = new URLSearchParams(queryParams);
    const page = params.get("page") || "0";
    const size = params.get("size") || "10";
    
    // Only send page and size to backend
    const backendParams = `page=${page}&size=${size}`;
    const reportUrl = `${siteConfig.apiEndpoint}/api/report/community?${backendParams}`;
    console.log("📍 Report URL:", reportUrl);
    
    const response = await axios.get<any>(reportUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    console.log("✅ Raw API Response:", response.data);
    console.log("✅ Response Status:", response.status);
    
    // Handle different response formats
    let communities: Community[] = [];
    let rawItems: any[] = [];
    
    if (Array.isArray(response.data)) {
      console.log("📊 Response is an array");
      rawItems = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      console.log("📊 Response wrapped in .data property");
      rawItems = response.data.data;
    } else if (response.data?.communities && Array.isArray(response.data.communities)) {
      console.log("📊 Response wrapped in .communities property");
      communities = response.data.communities;
    } else {
      console.warn("⚠️ Unexpected response format. Raw data:", response.data);
      rawItems = [];
    }

    // DEBUG: Log first item/community structure
    if (rawItems.length > 0) {
      console.log("🔍 FIRST ITEM structure:", JSON.stringify(rawItems[0], null, 2));
      console.log("🔍 First item keys:", Object.keys(rawItems[0]));
    }

    // If response is a flat list of items, convert to Community/Collection/Item structure
    if (rawItems.length > 0 && rawItems[0].itemId && !rawItems[0].communityId) {
      console.log("🔄 Converting flat item list to Community/Collection/Item structure...");
      
      // Create a default collection with all items
      const items: Item[] = rawItems.map((item: any) => ({
        itemId: item.itemId || item.uuid,
        itemName: item.itemName || item.name || 'Untitled',
        metadata: normalizeMetadata(item.metadata || {}),
      }));

      // Wrap in a default collection and community
      communities = [
        {
          communityId: 'report-collection',
          communityName: 'Report Items',
          collections: [
            {
              collectionId: 'report-items',
              collectionName: 'All Items',
              availableMetadata: items.length > 0 ? Object.keys(items[0].metadata) : [],
              items,
            },
          ],
        },
      ];

      console.log("📊 Converted to Community structure with", items.length, 'items');
    } else if (communities.length === 0) {
      // Ensure all items have properly formatted metadata
      const processedItems: Item[] = rawItems.map((item: any) => ({
        itemId: item.itemId || item.uuid,
        itemName: item.itemName || item.name || 'Untitled',
        metadata: normalizeMetadata(item.metadata || {}),
      }));

      communities = [
        {
          communityId: 'report-collection',
          communityName: 'Report Items',
          collections: [
            {
              collectionId: 'report-items',
              collectionName: 'All Items',
              availableMetadata: processedItems.length > 0 ? Object.keys(processedItems[0].metadata) : [],
              items: processedItems,
            },
          ],
        },
      ];
    }

    // Ensure all items have properly formatted metadata
    const processedCommunities = communities.map(community => ({
      ...community,
      collections: (community.collections || []).map(collection => ({
        ...collection,
        items: (collection.items || []).map((item: any) => ({
          itemId: item.itemId || item.uuid,
          itemName: item.itemName || item.name || 'Untitled',
          metadata: normalizeMetadata(item.metadata || {}),
        })),
      })),
    }));

    console.log("📊 Processed Communities:", processedCommunities);
    console.log("📊 Communities count:", processedCommunities.length);
    console.log("📊 Total collections:", processedCommunities.reduce((sum, c) => sum + (c.collections?.length || 0), 0));
    console.log("📊 Total items:", processedCommunities.reduce((sum, c) => sum + (c.collections?.reduce((s, col) => s + (col.items?.length || 0), 0) || 0), 0));
    
    // Extract pagination info from response
    const totalItems = response.data?.totalItems || rawItems.length;
    const pageInfo = response.data;
    
    return {
      data: processedCommunities,
      totalCommunities: processedCommunities.length,
      totalItems: totalItems,
      page: pageInfo?.page || 0,
      size: pageInfo?.size || 10,
    };
  } catch (error: any) {
    console.error("❌ Error in itemReportApi:", error.message);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ Response data:", error.response?.data);
    throw error;
  }
};

// Helper function to normalize metadata values
function normalizeMetadata(metadata: any): Record<string, string[]> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return Object.entries(metadata).reduce((acc: Record<string, string[]>, [key, values]: [string, any]) => {
    if (Array.isArray(values)) {
      acc[key] = values.map(v => {
        if (typeof v === 'object' && v.value) {
          return v.value;
        }
        return String(v);
      });
    } else if (typeof values === 'object' && values.value) {
      acc[key] = [values.value];
    } else {
      acc[key] = [String(values)];
    }
    return acc;
  }, {});
}

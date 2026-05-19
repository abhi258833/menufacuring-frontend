export interface FormField {
    id: number;
    name: string;
    label: string;
    type: string;
    required: boolean;
}

export const formFields: FormField[] = [
    {
        id: 1,
        name: "dc.empid",
        label: "Employee ID",
        type: "text",
        required: true,
    },
    {
        id: 2,
        name: "dc.hrDocNo",
        label: "HR Document Number",
        type: "text",
        required: true,
    },
    {
        id: 3,
        name: "dc.DocType",
        label: "Document Type",
        type: "text",
        required: true,
    },
    {
        id: 4,
        name: "dc.EmpName",
        label: "Employee Name",
        type: "text",
        required: true,
    },
    {
        id: 5,
        name: "dc.date.issued",
        label: "Date Issued",
        type: "date",
        required: true,
    },
];




export interface PatchOperation {
    op: 'add' | 'remove' | 'replace';
    path: string;
    value?: any;
}

export interface ItemInfo {
    id: string;
    uuid: string;
    name: string;
    metadata: {
        [key: string]: { value: string }[];
    };
}

export interface CreateItemProps {
    collectionId: string;
}

export interface workspaceitemresponse {
    id: string;
    _links: {
        self: {
            href: string;
        };
    };
}

export interface Workspaceresponse {
    id: string;
}
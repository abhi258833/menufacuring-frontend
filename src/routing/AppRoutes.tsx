import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";

// Critical pages loaded eagerly for faster initial load
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import { useAuth } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastProvider";

// Lazy load all other pages for code splitting
const About = lazy(() => import("../pages/About/About"));
const Contact = lazy(() => import("../pages/Contact/Contact"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword/ForgotPassword"));
const SignUp = lazy(() => import("../pages/SignUp/SignUp"));
const Forgot = lazy(() => import("../pages/forgot/forgot"));
const Register = lazy(() => import("../pages/Register/Register"));
const Search = lazy(() => import("../pages/Search/Search"));
const AdvanceSearch = lazy(() => import("../pages/Search/AdvanceSearch"));
const BookDetails = lazy(() => import("../pages/book-detail/bookDetails"));
const PDFViewer = lazy(() => import("../pages/PDFViewer/PDFViewer"));
const PDFFlipBook = lazy(() => import("../pages/flipBookViewer/PDFFlipBook"));
const Error400 = lazy(() => import("../pages/error/error400"));
const Error401 = lazy(() => import("../pages/error/error401"));
const Error403 = lazy(() => import("../pages/error/error403"));
const Error422 = lazy(() => import("../pages/error/error422"));
const Error404 = lazy(() => import("../pages/error/error404"));
const Error500 = lazy(() => import("../pages/error/error500"));
const EditCommunity = lazy(() => import("../pages/EditCommunityCollection/editCommunity"));
const CreatePolicy = lazy(() => import("../pages/collection/createPolicy"));
const Policies = lazy(() => import("../pages/collection/policy"));
const AssignRole = lazy(() => import("../pages/assignRole/AssignRole"));
const EditItem = lazy(() => import("../pages/Item/editItem"));
const AddBitstream = lazy(() => import("../pages/addBitstream/addBitstream"));
const CreateItem = lazy(() => import("../pages/Item/createItem"));
const Workflow = lazy(() => import("../pages/workflow/workflow"));
const WorkflowTaskManagement = lazy(() => import("../pages/workflow/workflowTask"));
const RemoveItem = lazy(() => import("../pages/workflow/removeItem"));
const ResourcePolicy = lazy(() => import("../pages/workflow/resourcePolicy"));
const SupervisionSelecter = lazy(() => import("../pages/workflow/supervisionSelecter"));
const CreateResourcePolicy = lazy(() => import("../pages/workflow/createResourcePolicy"));
const Processes = lazy(() => import("../pages/processes/processes"));
const ProcessDetail = lazy(() => import("../pages/processes/ProcessDetail"));
const UserManagement = lazy(() => import("../pages/access-control/userManagement"));
const AuditTrailLogs = lazy(() => import("../pages/AuditTrailLogs"));
const UserListTable = lazy(() => import("../pages/reports/UserListWithGroups"));
const ItemReportTable = lazy(() => import("../pages/reports/ItemListTable"));
const MetadataSchemas = lazy(() => import("../pages/Registries/MetadataSchemas"));
const Bitstream = lazy(() => import("../pages/Registries/Bitstream"));
const Groups = lazy(() => import("../pages/Group/Group"));
const EditGroup = lazy(() => import("../pages/Group/EditGroup"));
const BatchImport = lazy(() => import("../pages/BatchImport/BatchImport"));
const UserProfile = lazy(() => import("../pages/UserProfile/UserProfile"));
const MyCart = lazy(() => import("../pages/my-cart/MyCart"));
const SystemInformation = lazy(() => import("../pages/system-information/system-information"));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <div>Loading...</div>
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

const CreateItemWrapper = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  return collectionId ? <CreateItem collectionId={collectionId} /> : <div>Invalid Collection</div>;
};
const UserProfileWrapper = () => {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return null;

  return <UserProfile userId={userId} />;
};
const UserCartWrapper = () => {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return null;

  return <MyCart userId={userId} />;
};
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ToastProvider />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route path="/forgot/:token" element={<Forgot />} />
            <Route path="/register/:token" element={<Register />} />
            <Route path="/signUp" element={<SignUp />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/adminSearch" element={<Search />} />
            <Route path="/advanceSearch" element={<AdvanceSearch />} />
            <Route path="/items/:id" element={<BookDetails />} />
            <Route path="/error-400" element={<Error400 />} />
            <Route path="/error-401" element={<Error401 />} />
            <Route path="/error-403" element={<Error403 />} />
            <Route path="/error-404" element={<Error404 />} />
            <Route path="/error-422" element={<Error422 />} />
            <Route path="/error-500" element={<Error500 />} />
            <Route path="/pdf-viewer" element={<PDFViewer />} />
            <Route path="/flip-book-viewer" element={<PDFFlipBook />} />
            <Route path="/edit-Community-Collection" element={<EditCommunity />} />
            <Route path="/createPolicies/:uuid" element={<CreatePolicy />} />
            <Route path="/policies/:id" element={<Policies />} />
            <Route path="/assignRole/:id" element={<AssignRole />} />
            <Route path="/edit-item/:itemId" element={<EditItem />} />
            <Route path="/add-bitstream/:itemId" element={<AddBitstream />} />
            <Route path="/workflowSearch" element={<Workflow />} />
            <Route path="/workflowTask" element={<WorkflowTaskManagement />} />
            <Route path="/removeWorkflowItem/:id" element={<RemoveItem />} />
            <Route path="/resourcePolicy/:id" element={<ResourcePolicy />} />
            <Route path="/processes" element={<Processes />} />
            <Route path="/process/:id" element={<ProcessDetail />} />
            <Route path="/supervisionSelecter/:uuid" element={<SupervisionSelecter />} />
            <Route path="/createResourcePolicy/:uuid" element={<CreateResourcePolicy />} />
            <Route path="/usermanagement" element={<UserManagement />} />
            <Route path="/AuditTrailLogs" element={<AuditTrailLogs />} />
            <Route path="/report/user" element={<UserListTable />} />
            <Route path="/report/item" element={<ItemReportTable />} />
            <Route path="/userProfile/:userId" element={<UserProfileWrapper />} />
            <Route path="/userCart/:userId" element={<UserCartWrapper />} />
            <Route path="/metadataSchemas" element={<MetadataSchemas />} />
            <Route path="/bitstream/:schemaId/:schemaName" element={<Bitstream />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/edit-group" element={<EditGroup />} />
            <Route path="/batchImport" element={<BatchImport />} />
            <Route path="/collections/:collectionId/create-item" element={<CreateItemWrapper />} />
            <Route path="/system-information" element={<SystemInformation />} />
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default AppRoutes;

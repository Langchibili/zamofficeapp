// // Index.tsx - Company Dashboard with Fixed Infinite Loops & Socket Issues
// import { useEffect, useState, useCallback, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { toast } from "sonner";
// import { cn } from "@/lib/utils";
// import { Printer, Clock, FileText, LogIn, UserPlus, RefreshCw, Bug } from "lucide-react";
// import { useCompany } from "@/hooks/use-company";
// import { logClick } from "@/lib/logger";
// import { formatCurrency } from "@/lib/currency";
// import { useUser } from "@/contexts/UserContext";
// import { useSocket } from "@/contexts/SocketContext";
// import { getPrints, updatePrint, updateQueue, getCompanyById } from "../../Functions";
// import { api_url, backEndUrl, debugMode } from "../../Constants";

// interface PrintJob {
//   id: string;
//   orderId?: string;
//   clientId: string;
//   clientName?: string;
//   fileName: string;
//   pages: number;
//   copies: number;
//   colored: boolean;
//   laminated?: boolean;
//   bound?: boolean;
//   cost: number;
//   pdf_file: any;
//   createdAt: string;
//   scheduledAt: string | null;
//   state: string;
//   scheduled: boolean;
// }

// // Helper for getting a document's name
// const getDocumentName = (pdf_file: any): string => {
//   if (debugMode) console.log('🔍 [getDocumentName] Input:', pdf_file);
//   try {
//     let name =
//       pdf_file?.data?.attributes?.name ||
//       pdf_file?.attributes?.name ||
//       pdf_file?.name ||
//       pdf_file?.data?.name ||
//       "unnamedDoc.pdf"

//     if (typeof name !== "string" || name.trim() === "") {
//       name = "unnamedDoc.pdf"
//     }

//     if (name.length > 40) {
//       const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
//       name = name.slice(0, 40 - ext.length - 3) + "..." + ext
//     }

//     if (debugMode) console.log('✅ [getDocumentName] Result:', name);
//     return name
//   } catch (error) {
//     if (debugMode) console.error('❌ [getDocumentName] Error:', error);
//     return "unnamedDoc.pdf"
//   }
// }

// export default function Index() {
//   const { user, isAuthenticated, isLoading } = useUser();
//   const { company } = useCompany();
//   const { socket, connected, joinCompany } = useSocket();
  
//   const [prints, setPrints] = useState<PrintJob[]>([]);
//   const [activeTab, setActiveTab] = useState<"on-site" | "scheduled">("on-site");
//   const [selectedId, setSelectedId] = useState<string | null>(null);
//   const [showMobileDetail, setShowMobileDetail] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState<string | null>(null);
//   const [companyData, setCompanyData] = useState(company);
//   const [debugLogs, setDebugLogs] = useState<string[]>([]);
//   const [showDebug, setShowDebug] = useState(false);

//   // Refs to prevent infinite loops
//   const hasJoinedRoom = useRef(false);
//   const fetchInProgress = useRef(false);
//   const listenersSetup = useRef(false);

//   // Debug logger (stores logs in state; only prints to console when debugMode is true)
//   const addDebugLog = useCallback((message: string) => {
//     const timestamp = new Date().toLocaleTimeString();
//     const log = `[${timestamp}] ${message}`;
//     if (debugMode) console.log('🐛', log);
//     setDebugLogs(prev => [...prev.slice(-49), log]);
//   }, []);

//   // Local helpers to gate console output based on Constants.debugMode
//   const dbg = (...args: any[]) => { if (debugMode) console.log(...args); };
//   const dwarn = (...args: any[]) => { if (debugMode) console.warn(...args); };

//   // Refresh company data - useCallback to prevent re-creation
//   const refreshCompany = useCallback(async () => {
//   dbg('💰 [refreshCompany] Starting...');
//     if (!company?.id) {
//       dwarn('⚠️ [refreshCompany] No company ID');
//       return;
//     }
    
//     try {
//       addDebugLog('Refreshing company data...');
//       const updated = await getCompanyById(company.id);
//   dbg('✅ [refreshCompany] Success:', updated);
//       setCompanyData(updated);
//       addDebugLog(`Company refreshed. Float: ${updated?.float_balance}`);
//     } catch (e: any) {
//       if (debugMode) console.error('❌ [refreshCompany] Error:', e);
//       addDebugLog(`Error refreshing company: ${e.message}`);
//     }
//   }, [company?.id, addDebugLog]);

//   // Fetch prints from API - useCallback to prevent re-creation
//   const fetchPrints = useCallback(async () => {
//     dbg('📥 [fetchPrints] Called. InProgress:', fetchInProgress.current);
    
//     if (fetchInProgress.current) {
//       dwarn('⚠️ [fetchPrints] Already fetching, skipping');
//       return;
//     }

//     if (!company?.id) {
//       dwarn('⚠️ [fetchPrints] No company ID');
//       addDebugLog('Cannot fetch - no company ID');
//       return;
//     }
    
//     fetchInProgress.current = true;
    
//     try {
//       setLoading(true);
//       addDebugLog('Fetching prints from API...');
      
//       const queryParts = [
//         `filters[company][id][$eq]=${company.id}`,
//         // Add more states to filter
//         `filters[state][$in][0]=queued`,
//         `filters[state][$in][1]=scheduled`,
//         `filters[state][$in][2]=printing`,
//         `filters[state][$in][3]=pending`,
//         `filters[state][$in][4]=processing`,
//         // Enhanced population
//         `populate=*`,
//         `fields[0]=id`,
//         `fields[1]=order_id`,
//         `fields[2]=file_pages_count`,
//         `fields[3]=copies_requested`,
//         `fields[4]=colored`,
//         `fields[5]=laminated`,
//         `fields[6]=bound`,
//         `fields[7]=final_cost_amount`,
//         `fields[8]=createdAt`,
//         `fields[9]=scheduled_time`,
//         `fields[10]=state`,
//         `fields[11]=scheduled`,
//         // Change sort order to show newest first
//         `sort[0]=createdAt:desc`
//       ];
      
//       const queryString = queryParts.join('&');
//       dbg('🔗 [fetchPrints] Query:', queryString);
      
//       const response = await getPrints(queryString);
//       console.log('response of prints',response)
//       dbg('📦 [fetchPrints] Response:', response);

//       if (!Array.isArray(response)) {
//         if (debugMode) console.error('❌ [fetchPrints] Response not array:', response);
//         addDebugLog('ERROR: Response is not an array');
//         setPrints([]);
//         return;
//       }

//       addDebugLog(`Received ${response.length} prints`);

//       const formatted = response.map((p: any, idx: number) => {
//         dbg(`📋 [fetchPrints] Processing print ${idx + 1}:`, {
//           id: p.id,
//           pdf_file: p.pdf_file,
//           state: p.state
//         });
        
//         // Improved client data extraction
//         const clientData = p.client?.data?.attributes || p.client;
//         const clientId = String(
//           clientData?.clientId || 
//           clientData?.id || 
//           p.clientId || 
//           'unknown'
//         );
//         const clientName = clientData?.clientFirstName 
//           ? `${clientData.clientFirstName} ${clientData.clientLastName || ''}`.trim()
//           : clientData?.name || `Client ${clientId.slice(0, 8)}`;

//         // Enhanced PDF file data extraction
//         const pdfData = p.pdf_file?.data?.attributes || p.pdf_file;
//         const fileName = getDocumentName(pdfData);

//         return {
//           id: String(p.id),
//           orderId: p.order_id || p.orderId,
//           clientId: clientId,
//           clientName: clientName,
//           fileName: fileName,
//           pages: p.file_pages_count || p.pages || 1,
//           copies: p.copies_requested || p.copies || 1,
//           colored: Boolean(p.colored),
//           laminated: Boolean(p.laminated),
//           bound: Boolean(p.bound),
//           cost: parseFloat(p.final_cost_amount || p.cost) || 0,
//           pdf_file: pdfData,
//           createdAt: p.createdAt,
//           scheduledAt: p.scheduled_time || p.scheduledAt || null,
//           state: p.state,
//           scheduled: Boolean(p.scheduled),
//         };
//       });

//       dbg('✅ [fetchPrints] Formatted:', formatted);
//       setPrints(formatted);
//       addDebugLog(`Loaded ${formatted.length} prints successfully`);
      
//       if (formatted.length === 0) {
//         toast.info('No prints in queue', {
//           description: 'Waiting for customers...',
//         });
//         addDebugLog('Queue is empty');
//       }
      
//     } catch (error: any) {
//       if (debugMode) console.error('❌ [fetchPrints] Error:', error);
//       addDebugLog(`ERROR: ${error.message}`);
//       toast.error('Failed to load queue', {
//         description: error.message,
//       });
//       setPrints([]);
//     } finally {
//       setLoading(false);
//       fetchInProgress.current = false;
//   dbg('🏁 [fetchPrints] Complete');
//     }
//   }, [company?.id, addDebugLog]);

//   // Initial fetch - only once when authenticated and company available
//   useEffect(() => {
//     dbg('🎬 [Effect: Initial Fetch] Triggered');
//     dbg('🔐 isAuthenticated:', isAuthenticated);
//     dbg('🏢 company?.id:', company?.id);
//     dbg('⏳ isLoading:', isLoading);
    
//     if (!isLoading && isAuthenticated && company?.id && !fetchInProgress.current) {
//       dbg('✅ [Effect: Initial Fetch] Conditions met, fetching...');
//       addDebugLog('Initial fetch triggered');
//       setCompanyData(company);
//       fetchPrints();
//     } else {
//       dbg('⏸️ [Effect: Initial Fetch] Conditions not met');
//     }
//   }, [isAuthenticated, company?.id, isLoading]); // FIXED: removed fetchPrints and addDebugLog

//   // Join company room - only once when conditions are met
//   useEffect(() => {
//     dbg('🔌 [Effect: Join Room] Triggered');
//     dbg('🔐 isAuthenticated:', isAuthenticated);
//     dbg('🏢 company?.id:', company?.id);
//     dbg('🔌 connected:', connected);
//     dbg('🔌 hasJoinedRoom:', hasJoinedRoom.current);
    
//     if (isAuthenticated && company?.id && connected && !hasJoinedRoom.current) {
//       dbg('✅ [Effect: Join Room] Joining company:', company.id);
//       addDebugLog(`Joining company room: ${company.id}`);
//       joinCompany(String(company.id));
//       hasJoinedRoom.current = true;
//     }

//     // Reset when disconnected
//     if (!connected) {
//       dbg('🔌 [Effect: Join Room] Disconnected, resetting flag');
//       hasJoinedRoom.current = false;
//     }
//   }, [isAuthenticated, company?.id, connected]); // FIXED: removed joinCompany and addDebugLog

//   // Socket event listeners - setup only once
//   useEffect(() => {
//   dbg('🎧 [Effect: Socket Listeners] Triggered');
//   dbg('🔌 socket:', !!socket);
//   dbg('🔌 connected:', connected);
//   dbg('🏢 company:', !!company);
//   dbg('🎧 listenersSetup:', listenersSetup.current);
    
//     if (!socket || !connected || !company) {
//   dbg('⏸️ [Effect: Socket Listeners] Not ready');
//       listenersSetup.current = false;
//       return;
//     }

//     if (listenersSetup.current) {
//   dbg('⏸️ [Effect: Socket Listeners] Already setup');
//       return;
//     }

//   dbg('✅ [Effect: Socket Listeners] Setting up...');
//   addDebugLog('Setting up socket listeners');
//     listenersSetup.current = true;

//     // Handler for new queued prints
//     const handlePrintQueued = (data: any) => {
//       try {
//         dbg('📨 [Socket: print:queued]', data);
        
//         if (String(data.companyId) !== String(company.id)) {
//           dbg('⏸️ Different company, ignoring');
//           return;
//         }

//         // Validate required data
//         if (!data.printId || !data.fileName) {
//           throw new Error('Invalid print data received');
//         }

//         addDebugLog(`New print: ${data.fileName}`);

//         const newPrint: PrintJob = {
//           id: String(data.printId),
//           orderId: data.orderId,
//           clientId: data.clientId || 'unknown',
//           clientName: data.clientName || `Client ${data.clientId?.slice(0, 8)}`,
//           fileName: data.fileName,
//           pages: Number(data.pages) || 1,
//           copies: Number(data.copies) || 1,
//           colored: Boolean(data.colored),
//           laminated: Boolean(data.laminated),
//           bound: Boolean(data.bound),
//           cost: Number(data.cost) || 0,
//           pdf_file: data.pdf_file || null,
//           createdAt: data.createdAt || new Date().toISOString(),
//           scheduledAt: null,
//           state: 'queued',
//           scheduled: false,
//         };

//         setPrints(prev => {
//           // Check if print already exists
//           const exists = prev.some(p => p.id === newPrint.id);
//           if (exists) {
//             dbg('🔄 Updating existing print');
//             return prev.map(p => p.id === newPrint.id ? newPrint : p);
//           }
//           dbg('➕ Adding new print');
//           return [newPrint, ...prev];
//         });

//         // Acknowledge receipt
//         socket.emit('print:received', { printId: data.printId });
        
//         toast.success('New print received!', {
//           description: `${data.fileName} - ${data.pages} pages`,
//         });

//         playNotificationSound();
//       } catch (error: any) {
//         dbg('❌ [Socket: print:queued] Error:', error);
//         addDebugLog(`Error handling print: ${error.message}`);
//       }
//     };

//     // Handler for scheduled prints
//     const handlePrintScheduled = (data: any) => {
//       dbg('📨 [Socket: print:scheduled]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;

//       addDebugLog(`Print scheduled: ${data.fileName}`);

//       const newPrint: PrintJob = {
//         id: String(data.printId),
//         clientId: data.clientId,
//         clientName: `Client ${data.clientId.slice(0, 8)}`,
//         fileName: data.fileName,
//         pages: data.pages || 1,
//         copies: 1,
//         colored: false,
//         cost: data.cost || 0,
//         pdf_file: data.pdf_file || null,
//         createdAt: new Date().toISOString(),
//         scheduledAt: data.scheduledTime,
//         state: 'scheduled',
//         scheduled: true,
//       };

//       setPrints((prev) => {
//         if (prev.some(p => p.id === newPrint.id)) {
//           return prev.map(p => p.id === newPrint.id ? newPrint : p);
//         }
//         return [...prev, newPrint];
//       });

//       toast.info('Print scheduled', {
//         description: `${data.fileName}`,
//       });
//     };

//     // Handler for print canceled
//     const handlePrintCanceled = (data: any) => {
//       dbg('📨 [Socket: print:canceled]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;
      
//       addDebugLog(`Print canceled: ${data.printId}`);
      
//       setPrints((prev) => prev.filter(p => p.id !== String(data.printId)));
      
//       toast.warning('Print canceled', {
//         description: data.reason || 'Canceled by client',
//       });
//     };

//     // Handler for float warnings
//     const handleFloatLow = (data: any) => {
//       dbg('📨 [Socket: float-low]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;
      
//       addDebugLog(`Float low: ${data.balance}`);
      
//       toast.warning('Float balance low', {
//         description: `Balance: ${formatCurrency(data.balance, company.currency || 'ZMW')}`,
//       });
//     };

//     const handleFloatDepleted = (data: any) => {
//       dbg('📨 [Socket: float-depleted]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;
      
//       addDebugLog('Float depleted!');
      
//       toast.error('Float depleted!', {
//         description: 'Cannot accept new jobs',
//         duration: 10000,
//       });
//     };

//     // Register all listeners
//     socket.on('print:queued', handlePrintQueued);
//     socket.on('print:scheduled', handlePrintScheduled);
//     socket.on('print:canceled', handlePrintCanceled);
//     socket.on('company:float-low', handleFloatLow);
//     socket.on('company:float-depleted', handleFloatDepleted);

//   dbg('✅ [Effect: Socket Listeners] Registered');

//     return () => {
//   dbg('🧹 [Effect: Socket Listeners] Cleanup');
//   addDebugLog('Removing socket listeners');
//       socket.off('print:queued', handlePrintQueued);
//       socket.off('print:scheduled', handlePrintScheduled);
//       socket.off('print:canceled', handlePrintCanceled);
//       socket.off('company:float-low', handleFloatLow);
//       socket.off('company:float-depleted', handleFloatDepleted);
//       listenersSetup.current = false;
//     };
//   }, [socket, connected, company?.id]); // FIXED: only essential deps

//   // Add socket connection monitoring
//   const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
//   // Monitor socket connection
//   useEffect(() => {
//     if (!socket) return;
    
//     dbg('🔌 [Socket Monitor] Setting up listeners');
    
//     const handleConnect = () => {
//       dbg('🔌 [Socket] Connected');
//       setSocketStatus('connected');
//       addDebugLog('Socket connected');
      
//       // Re-join company room on reconnect
//       if (company?.id) {
//         dbg('🔄 [Socket] Rejoining company room');
//         joinCompany(String(company.id));
//       }
//     };

//     const handleDisconnect = (reason: string) => {
//       dbg('🔌 [Socket] Disconnected:', reason);
//       setSocketStatus('disconnected');
//       addDebugLog(`Socket disconnected: ${reason}`);
//       hasJoinedRoom.current = false;
//       listenersSetup.current = false;
//     };

//     const handleConnectError = (error: Error) => {
//       dbg('❌ [Socket] Connection error:', error);
//       setSocketStatus('disconnected');
//       addDebugLog(`Socket error: ${error.message}`);
//     };

//     socket.on('connect', handleConnect);
//     socket.on('disconnect', handleDisconnect);
//     socket.on('connect_error', handleConnectError);
    
//     // Try to connect if not connected
//     if (!socket.connected) {
//       dbg('🔌 [Socket] Attempting connection...');
//       setSocketStatus('connecting');
//       socket.connect();
//     }

//     return () => {
//       socket.off('connect', handleConnect);
//       socket.off('disconnect', handleDisconnect);
//       socket.off('connect_error', handleConnectError);
//     };
//   }, [socket, company?.id]);

//   // Modified join company room effect
//   useEffect(() => {
//     dbg('🔌 [Effect: Join Room] Status:', socketStatus);
//     dbg('🏢 Company ID:', company?.id);
//     dbg('🔑 Authenticated:', isAuthenticated);
    
//     if (socketStatus !== 'connected' || !company?.id || !isAuthenticated || hasJoinedRoom.current) {
//       return;
//     }

//     const doJoin = async () => {
//       try {
//         dbg('🔌 [Join Room] Attempting to join:', company.id);
//         addDebugLog(`Joining company room: ${company.id}`);
        
//         // Add acknowledgment callback
//         await joinCompany(String(company.id));
        
//         hasJoinedRoom.current = true;
//         addDebugLog('Successfully joined company room');
        
//         // Fetch prints after joining room
//         fetchPrints();
//       } catch (error: any) {
//         dbg('❌ [Join Room] Failed:', error);
//         addDebugLog(`Failed to join room: ${error.message}`);
        
//         // Reset flag and retry after delay
//         hasJoinedRoom.current = false;
//         setTimeout(() => {
//           hasJoinedRoom.current = false;
//         }, 5000);
//       }
//     };

//     doJoin();
//   }, [socketStatus, company?.id, isAuthenticated]);

//   // Modified socket event listeners
//   useEffect(() => {
//     if (socketStatus !== 'connected' || !company?.id || listenersSetup.current) {
//       return;
//     }

//     dbg('🎧 [Socket Listeners] Setting up...');
//     addDebugLog('Setting up socket listeners');
    
//     const handlePrintQueued = (data: any) => {
//       try {
//         dbg('📨 [Socket: print:queued]', data);
        
//         if (String(data.companyId) !== String(company.id)) {
//           dbg('⏸️ Different company, ignoring');
//           return;
//         }

//         // Validate required data
//         if (!data.printId || !data.fileName) {
//           throw new Error('Invalid print data received');
//         }

//         addDebugLog(`New print: ${data.fileName}`);

//         const newPrint: PrintJob = {
//           id: String(data.printId),
//           orderId: data.orderId,
//           clientId: data.clientId || 'unknown',
//           clientName: data.clientName || `Client ${data.clientId?.slice(0, 8)}`,
//           fileName: data.fileName,
//           pages: Number(data.pages) || 1,
//           copies: Number(data.copies) || 1,
//           colored: Boolean(data.colored),
//           laminated: Boolean(data.laminated),
//           bound: Boolean(data.bound),
//           cost: Number(data.cost) || 0,
//           pdf_file: data.pdf_file || null,
//           createdAt: data.createdAt || new Date().toISOString(),
//           scheduledAt: null,
//           state: 'queued',
//           scheduled: false,
//         };

//         setPrints(prev => {
//           // Check if print already exists
//           const exists = prev.some(p => p.id === newPrint.id);
//           if (exists) {
//             dbg('🔄 Updating existing print');
//             return prev.map(p => p.id === newPrint.id ? newPrint : p);
//           }
//           dbg('➕ Adding new print');
//           return [newPrint, ...prev];
//         });

//         // Acknowledge receipt
//         socket.emit('print:received', { printId: data.printId });
        
//         toast.success('New print received!', {
//           description: `${data.fileName} - ${data.pages} pages`,
//         });

//         playNotificationSound();
//       } catch (error: any) {
//         dbg('❌ [Socket: print:queued] Error:', error);
//         addDebugLog(`Error handling print: ${error.message}`);
//       }
//     };

//     // Handler for scheduled prints
//     const handlePrintScheduled = (data: any) => {
//       dbg('📨 [Socket: print:scheduled]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;

//       addDebugLog(`Print scheduled: ${data.fileName}`);

//       const newPrint: PrintJob = {
//         id: String(data.printId),
//         clientId: data.clientId,
//         clientName: `Client ${data.clientId.slice(0, 8)}`,
//         fileName: data.fileName,
//         pages: data.pages || 1,
//         copies: 1,
//         colored: false,
//         cost: data.cost || 0,
//         pdf_file: data.pdf_file || null,
//         createdAt: new Date().toISOString(),
//         scheduledAt: data.scheduledTime,
//         state: 'scheduled',
//         scheduled: true,
//       };

//       setPrints((prev) => {
//         if (prev.some(p => p.id === newPrint.id)) {
//           return prev.map(p => p.id === newPrint.id ? newPrint : p);
//         }
//         return [...prev, newPrint];
//       });

//       toast.info('Print scheduled', {
//         description: `${data.fileName}`,
//       });
//     };

//     // Handler for print canceled
//     const handlePrintCanceled = (data: any) => {
//       dbg('📨 [Socket: print:canceled]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;
      
//       addDebugLog(`Print canceled: ${data.printId}`);
      
//       setPrints((prev) => prev.filter(p => p.id !== String(data.printId)));
      
//       toast.warning('Print canceled', {
//         description: data.reason || 'Canceled by client',
//       });
//     };

//     // Handler for float warnings
//     const handleFloatLow = (data: any) => {
//       dbg('📨 [Socket: float-low]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;
      
//       addDebugLog(`Float low: ${data.balance}`);
      
//       toast.warning('Float balance low', {
//         description: `Balance: ${formatCurrency(data.balance, company.currency || 'ZMW')}`,
//       });
//     };

//     const handleFloatDepleted = (data: any) => {
//       dbg('📨 [Socket: float-depleted]', data);
      
//       if (String(data.companyId) !== String(company.id)) return;
      
//       addDebugLog('Float depleted!');
      
//       toast.error('Float depleted!', {
//         description: 'Cannot accept new jobs',
//         duration: 10000,
//       });
//     };

//     // Register all listeners
//     socket.on('print:queued', handlePrintQueued);
//     socket.on('print:scheduled', handlePrintScheduled);
//     socket.on('print:canceled', handlePrintCanceled);
//     socket.on('company:float-low', handleFloatLow);
//     socket.on('company:float-depleted', handleFloatDepleted);

//   dbg('✅ [Effect: Socket Listeners] Registered');

//     return () => {
//   dbg('🧹 [Effect: Socket Listeners] Cleanup');
//   addDebugLog('Removing socket listeners');
//       socket.off('print:queued', handlePrintQueued);
//       socket.off('print:scheduled', handlePrintScheduled);
//       socket.off('print:canceled', handlePrintCanceled);
//       socket.off('company:float-low', handleFloatLow);
//       socket.off('company:float-depleted', handleFloatDepleted);
//       listenersSetup.current = false;
//     };
//   }, [socketStatus, company?.id]);

//   // Filter prints by tab
//   const onSite = prints.filter(p => !p.scheduled && 
//     ['queued', 'printing', 'pending', 'processing'].includes(p.state));
//   const scheduled = prints.filter(p => p.scheduled && 
//     ['scheduled', 'pending'].includes(p.state));

//   const selected = prints.find((p) => p.id === selectedId) ?? null;

//   // Clear selection if print disappears
//   useEffect(() => {
//     if (selectedId && !prints.some((p) => p.id === selectedId)) {
//       dbg('⚠️ [Effect: Clear Selection] Print disappeared');
//       setSelectedId(null);
//     }
//   }, [prints, selectedId]);

//   // Print action handler
//   const printAction = useCallback(async (job: PrintJob) => {
//     dbg('🖨️ [printAction] Starting:', job.id);
    
//     if (processing) {
//       dwarn('⚠️ [printAction] Already processing');
//       return;
//     }

//     try {
//       setProcessing(job.id);
//       addDebugLog(`Processing print: ${job.id}`);
//       logClick("Print button", "client/pages/Index.tsx", 140);

//       await updatePrint(Number(job.id), { state: 'printing' });
//   dbg('✅ [printAction] State -> printing');
      
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       await updatePrint(Number(job.id), { state: 'printed' });
//   dbg('✅ [printAction] State -> printed');
      
//       setPrints((prev) => prev.filter((p) => p.id !== job.id));
//   dbg('✅ [printAction] Removed from queue');
      
//       await refreshCompany();

//       addDebugLog(`Print completed: ${job.id}`);
//       toast.success("Print completed", {
//         description: `${job.fileName}`,
//       });

//     } catch (error: any) {
//       if (debugMode) console.error('❌ [printAction] Error:', error);
//       addDebugLog(`ERROR: ${error.message}`);
//       toast.error('Failed to process print', {
//         description: error.message,
//       });
//     } finally {
//       setProcessing(null);
//     }
//   }, [processing, addDebugLog, refreshCompany]);

//   // Show loading state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-accent to-background flex items-center justify-center">
//         <Card className="p-8">
//           <div className="text-center text-muted-foreground">Loading...</div>
//         </Card>
//       </div>
//     );
//   }

//   // Show login prompt
//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-accent to-background flex items-center justify-center">
//         <main className="container py-6">
//           <Card className="p-8 shadow-xl border-border/60 max-w-md mx-auto text-center">
//             <div className="space-y-6">
//               <div>
//                 <h1 className="text-2xl font-bold mb-2">Access Required</h1>
//                 <p className="text-muted-foreground">
//                   Please log in to view your dashboard.
//                 </p>
//               </div>
              
//               <div className="space-y-4">
//                 <Button asChild className="w-full h-11 text-base">
//                   <a href="/login">
//                     <LogIn className="h-4 w-4 mr-2" />
//                     Log In
//                   </a>
//                 </Button>
                
//                 <div className="text-sm text-muted-foreground">
//                   Don't have an account?
//                 </div>
                
//                 <Button asChild variant="outline" className="w-full h-11 text-base">
//                   <a href="/register">
//                     <UserPlus className="h-4 w-4 mr-2" />
//                     Create Account
//                   </a>
//                 </Button>
//               </div>
//             </div>
//           </Card>
//         </main>
//       </div>
//     );
//   }

//   // Show dashboard
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-accent to-background">
//       <main className="container py-6">
//         <div className="space-y-4">
//           <DashboardHeader 
//             connected={socketStatus === 'connected'} 
//             connecting={socketStatus === 'connecting'}
//             company={companyData}  
//             onRefresh={fetchPrints}
//             loading={loading}
//           />
          
//           {/* Debug Console Toggle */}
//           {debugMode && (
//             <div className="flex justify-end">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setShowDebug(!showDebug)}
//               >
//                 <Bug className="h-4 w-4 mr-2" />
//                 {showDebug ? 'Hide' : 'Show'} Debug
//               </Button>
//             </div>
//           )}

//           {/* Debug Console */}
//           {debugMode && showDebug && (
//             <Card className="p-4 bg-black text-green-400 font-mono text-xs max-h-64 overflow-auto">
//               <div className="flex justify-between items-center mb-2">
//                 <div className="font-bold">Debug Console ({debugLogs.length})</div>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => {
//                     setDebugLogs([]);
//                     addDebugLog('Console cleared');
//                   }}
//                   className="text-green-400 hover:text-green-300"
//                 >
//                   Clear
//                 </Button>
//               </div>
//               <div className="space-y-1">
//                 {debugLogs.length === 0 ? (
//                   <div className="text-gray-500">No logs yet...</div>
//                 ) : (
//                   debugLogs.map((log, i) => (
//                     <div key={i}>{log}</div>
//                   ))
//                 )}
//               </div>
//             </Card>
//           )}
          
//           <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
//             <div className="flex items-center justify-between">
//               <TabsList className="bg-muted">
//                 <TabsTrigger value="on-site">
//                   On site ({onSite.length})
//                 </TabsTrigger>
//                 <TabsTrigger value="scheduled">
//                   Scheduled ({scheduled.length})
//                 </TabsTrigger>
//               </TabsList>
//               {company && (
//                 <div className="text-sm text-muted-foreground hidden md:block">
//                   {company.name}
//                 </div>
//               )}
//             </div>

//             <TabsContent value="on-site" className="mt-4">
//               {loading ? (
//                 <Card className="p-8 text-center text-muted-foreground">
//                   <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
//                   Loading...
//                 </Card>
//               ) : (
//                 <SplitView
//                   items={onSite}
//                   selectedId={selectedId}
//                   onSelect={(id) => {
//                     setSelectedId(id);
//                     setShowMobileDetail(true);
//                   }}
//                   onPrint={printAction}
//                   showDetail={!!selected}
//                   processing={processing}
//                   detail={
//                     <JobDetail
//                       job={selected}
//                       onPrint={printAction}
//                       processing={processing}
//                     />
//                   }
//                   mobileSheetOpen={showMobileDetail}
//                   onMobileSheetOpenChange={setShowMobileDetail}
//                 />
//               )}
//             </TabsContent>

//             <TabsContent value="scheduled" className="mt-4">
//               {loading ? (
//                 <Card className="p-8 text-center text-muted-foreground">
//                   <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
//                   Loading...
//                 </Card>
//               ) : (
//                 <SplitView
//                   items={scheduled}
//                   selectedId={selectedId}
//                   onSelect={(id) => {
//                     setSelectedId(id);
//                     setShowMobileDetail(true);
//                   }}
//                   onPrint={printAction}
//                   showDetail={!!selected}
//                   processing={processing}
//                   detail={
//                     <JobDetail
//                       job={selected}
//                       onPrint={printAction}
//                       processing={processing}
//                     />
//                   }
//                   mobileSheetOpen={showMobileDetail}
//                   onMobileSheetOpenChange={setShowMobileDetail}
//                 />
//               )}
//             </TabsContent>
//           </Tabs>
//         </div>
//       </main>
//     </div>
//   );
// }

// function SplitView({
//   items,
//   selectedId,
//   onSelect,
//   onPrint,
//   showDetail,
//   processing,
//   detail,
//   mobileSheetOpen,
//   onMobileSheetOpenChange,
// }: {
//   items: PrintJob[];
//   selectedId: string | null;
//   onSelect: (id: string) => void;
//   onPrint: (job: PrintJob) => void;
//   showDetail: boolean;
//   processing: string | null;
//   detail: React.ReactNode;
//   mobileSheetOpen: boolean;
//   onMobileSheetOpenChange: (open: boolean) => void;
// }) {
//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [previewJob, setPreviewJob] = useState<PrintJob | null>(null);

//   const getPdfUrl = (job: PrintJob): string | null => {
//     try {
//       if (job.pdf_file?.data?.attributes?.url) {
//         const url = job.pdf_file.data.attributes.url;
//         return url.startsWith('http') ? url : `${backEndUrl}${url}`;
//       }
//       if (job.pdf_file?.url) {
//         const url = job.pdf_file.url;
//         return url.startsWith('http') ? url : `${backEndUrl}${url}`;
//       }
//       return null;
//     } catch {
//       return null;
//     }
//   };

//   return (
//     <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
//       <Card className="md:col-span-5 border-border/60 overflow-hidden">
//         <div className="p-4 pb-2 flex items-center justify-between">
//           <h2 className="font-semibold">Queue</h2>
//           {items.length > 0 && (
//             <Badge variant="secondary">{items.length} {items.length === 1 ? 'job' : 'jobs'}</Badge>
//           )}
//         </div>
//         <Separator />
//         <ScrollArea className="h-[calc(70vh)]">
//           <ul className="p-2">
//             {items.length === 0 && (
//               <li className="text-sm text-muted-foreground p-8 text-center">
//                 <div className="mb-2">No prints in queue</div>
//                 <div className="text-xs">Waiting for customers...</div>
//               </li>
//             )}
//             {items.map((item) => {
//               const documentName = getDocumentName(item.pdf_file);
//               const pdfUrl = getPdfUrl(item);
//               return (
//                 <li key={item.id}>
//                   <div
//                     role="button"
//                     tabIndex={0}
//                     className={cn(
//                       "w-full text-left rounded-lg p-3 hover:bg-accent/60 transition focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
//                       selectedId === item.id && "bg-accent",
//                     )}
//                     onClick={() => onSelect(item.id)}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter" || e.key === " ") onSelect(item.id);
//                     }}
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="font-medium truncate flex items-center gap-2">
//                         <FileText className="h-4 w-4 text-primary" />
//                         {documentName}
//                       </div>
//                       <div className="text-xs text-muted-foreground ml-2">
//                         {new Date(item.createdAt).toLocaleTimeString([], {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}
//                       </div>
//                     </div>
//                     <div className="mt-2 flex items-center justify-between text-sm flex-wrap gap-2">
//                       <div className="flex items-center gap-2">
//                         {item.orderId && (
//                           <Badge variant="outline" className="font-mono text-xs">
//                             {item.orderId}
//                           </Badge>
//                         )}
//                         <Badge variant={item.scheduledAt ? "default" : "secondary"}>
//                           {item.scheduledAt ? "Scheduled" : "Available"}
//                         </Badge>
//                       </div>
//                       <Button
//                         size="sm"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setPreviewJob(item);
//                           setPreviewOpen(true);
//                         }}
//                         disabled={!pdfUrl}
//                         className="h-8"
//                       >
//                         <Printer className="h-4 w-4 mr-2" />
//                         Print
//                       </Button>
//                     </div>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//         </ScrollArea>
//         <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
//           <DialogContent className="max-w-3xl">
//             <DialogHeader>
//               <DialogTitle>Document Preview</DialogTitle>
//             </DialogHeader>
//             {previewJob && getPdfUrl(previewJob) ? (
//               <iframe
//                 src={getPdfUrl(previewJob)!}
//                 className="w-full h-[80vh] border rounded"
//                 title="PDF Preview Modal"
//               />
//             ) : (
//               <div className="text-center text-muted-foreground">
//                 PDF file not available
//               </div>
//             )}
//           </DialogContent>
//         </Dialog>
//       </Card>

//       <div className="hidden md:block md:col-span-7">
//         {showDetail ? (
//           <Card className="h-full p-6 border-border/60 overflow-auto max-h-[calc(70vh+4rem)]">{detail}</Card>
//         ) : (
//           <Card className="h-full p-6 grid place-content-center text-center text-muted-foreground border-dashed border-2">
//             <div>
//               <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
//               <div>Select a print to view details</div>
//             </div>
//           </Card>
//         )}
//       </div>

//       <Sheet open={mobileSheetOpen} onOpenChange={onMobileSheetOpenChange}>
//         <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-auto">
//           <SheetTitle className="sr-only">Print details</SheetTitle>
//           <div className="p-6">{detail}</div>
//         </SheetContent>
//       </Sheet>
//     </div>
//   );
// }

// function JobDetail({
//   job,
//   onPrint,
//   processing,
// }: {
//   job: PrintJob | null;
//   onPrint: (job: PrintJob) => void;
//   processing: string | null;
// }) {
//   const [pdfError, setPdfError] = useState(false);
//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);

//   if (!job) return null;

//   const getPdfUrl = (): string | null => {
//     try {
//       if (job.pdf_file?.data?.attributes?.url) {
//         const url = job.pdf_file.data.attributes.url;
//         return url.startsWith('http') ? url : `${backEndUrl}${url}`;
//       }
//       if (job.pdf_file?.url) {
//         const url = job.pdf_file.url;
//         return url.startsWith('http') ? url : `${backEndUrl}${url}`;
//       }
//       return null;
//     } catch (error) {
//       return null;
//     }
//   };

//   const pdfUrl = getPdfUrl();
//   const documentName = getDocumentName(job.pdf_file);

//   return (
//     <div className="space-y-6">
//       <div>
//         <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
//           Print Job
//         </div>
//         <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
//           <FileText className="h-5 w-5 text-primary" />
//           <span className="break-all">
//             {documentName}
//             <Button
//               variant="ghost"
//               size="icon"
//               className="ml-2"
//               onClick={() => setPreviewOpen(true)}
//               disabled={!pdfUrl}
//               title="Preview & Print"
//             >
//               <Printer className="h-5 w-5 text-primary" />
//             </Button>
//           </span>
//         </h3>
//         <div className="mt-1 text-muted-foreground text-sm">
//           {job.clientName}
//         </div>
//         {job.orderId && (
//           <div className="mt-2">
//             <Badge variant="outline" className="font-mono text-base">
//               Order: {job.orderId}
//             </Badge>
//           </div>
//         )}
//       </div>
//       <Separator />

//       <div className="grid grid-cols-2 gap-4">
//         <Info label="Pages" value={String(job.pages)} />
//         <Info label="Copies" value={String(job.copies)} />
//         <Info label="Color" value={job.colored ? "Color" : "Mono"} />
//         <Info label="Cost" value={`K${job.cost.toFixed(2)}`} />
//         {job.laminated && (
//           <Info label="Laminated" value="Yes" />
//         )}
//         {job.bound && (
//           <Info label="Bound" value="Yes" />
//         )}
//         {job.scheduledAt && (
//           <div className="col-span-2">
//             <Info
//               label="Scheduled for"
//               value={new Date(job.scheduledAt).toLocaleString([], {
//                 dateStyle: "medium",
//                 timeStyle: "short",
//               })}
//               icon={<Clock className="h-4 w-4" />}
//             />
//           </div>
//         )}
//       </div>

//       <div className="mb-4">
//         <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
//           To print, click the icon above <Printer className="h-5 w-5 text-primary" />
//         </div>
//         <div className="text-xs text-muted-foreground mt-1">
//           When done, mark as printed below.
//         </div>
//       </div>

//       {pdfUrl ? (
//         <div>
//           <div className="text-sm font-medium mb-2 flex items-center justify-between">
//             <span>Document Preview</span>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => window.open(pdfUrl, '_blank')}
//             >
//               Open Full
//             </Button>
//           </div>
//           {!pdfError ? (
//             <div className="border rounded-lg overflow-hidden bg-gray-100">
//               <iframe
//                 src={pdfUrl}
//                 className="w-full h-96"
//                 title="PDF Preview"
//                 onError={(e) => {
//                   setPdfError(true);
//                   toast.error('Failed to load PDF');
//                 }}
//               />
//             </div>
//           ) : (
//             <div className="border rounded-lg p-8 text-center bg-gray-50">
//               <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
//               <div className="text-sm text-muted-foreground mb-3">
//                 Preview unavailable. Open full file.
//               </div>
//               <Button
//                 variant="outline"
//                 onClick={() => window.open(pdfUrl, '_blank')}
//               >
//                 Open PDF
//               </Button>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="border rounded-lg p-8 text-center bg-gray-50">
//           <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
//           <div className="text-sm text-red-600 mb-3">
//             PDF file not available
//           </div>
//           <details className="text-xs text-left">
//             <summary className="cursor-pointer text-muted-foreground mb-2">
//               Debug info (click to expand)
//             </summary>
//             <pre className="font-mono bg-black text-green-400 p-4 rounded overflow-auto max-h-64">
//               {JSON.stringify(job.pdf_file, null, 2)}
//             </pre>
//           </details>
//         </div>
//       )}

//       <div className="flex items-center gap-3">
//         <Button
//           onClick={() => setConfirmOpen(true)}
//           disabled={processing === job.id}
//           className="h-11 text-base flex-1"
//         >
//           {processing === job.id ? "Completing..." : "Mark as Printed"}
//         </Button>
//       </div>

//       <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>Complete Print</DialogTitle>
//           </DialogHeader>
//           <div className="py-4 text-center">
//             <div className="mb-4 text-lg font-semibold">
//               Confirm print completion?
//             </div>
//             <div className="flex justify-center gap-4 mt-6">
//               <Button variant="outline" onClick={() => setConfirmOpen(false)}>
//                 No
//               </Button>
//               <Button
//                 onClick={() => {
//                   setConfirmOpen(false);
//                   onPrint(job);
//                 }}
//                 disabled={processing === job.id}
//               >
//                 Yes
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
//         <DialogContent className="max-w-3xl">
//           <DialogHeader>
//             <DialogTitle>Document Preview</DialogTitle>
//           </DialogHeader>
//           {pdfUrl ? (
//             <iframe
//               src={pdfUrl}
//               className="w-full h-[80vh] border rounded"
//               title="PDF Preview Modal"
//             />
//           ) : (
//             <div className="text-center text-muted-foreground">
//               PDF file not available
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// function Info({
//   label,
//   value,
//   icon,
// }: {
//   label: string;
//   value: string;
//   icon?: React.ReactNode;
// }) {
//   return (
//     <div className="rounded-lg border p-3 bg-card/50">
//       <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
//         {icon}
//         {label}
//       </div>
//       <div className="font-medium break-words">{value}</div>
//     </div>
//   );
// }

// function DashboardHeader({ 
//   connected, 
//   connecting,
//   company,
//   onRefresh,
//   loading 
// }: { 
//   connected?: boolean;
//   connecting?: boolean;
//   company: any;
//   onRefresh: () => void;
//   loading: boolean;
// }) {
//   if (!company) return null;
  
//   const currency = company.settings?.currency || company.currency || "ZMW";
//   const floatBalance = company.float_balance || 0;
  
//   const connectionStatus = connecting ? (
//     <>
//       <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
//       <span className="text-sm text-muted-foreground">Connecting...</span>
//     </>
//   ) : connected ? (
//     <>
//       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//       <span className="text-sm text-muted-foreground">Connected</span>
//     </>
//   ) : (
//     <>
//       <div className="w-2 h-2 rounded-full bg-red-500" />
//       <span className="text-sm text-muted-foreground">Disconnected</span>
//     </>
//   );

//   return (
//     <Card className="p-4 border-border/60">
//       <div className="flex items-center justify-between flex-wrap gap-4">
//         <div>
//           <div className="text-sm text-muted-foreground">Float available</div>
//           <div className="text-2xl font-bold">
//             {formatCurrency(floatBalance, currency)} ({currency})
//           </div>
//         </div>
//         <div className="flex items-center gap-3 flex-wrap">
//           <Button 
//             variant="outline" 
//             size="sm"
//             onClick={onRefresh}
//             disabled={loading}
//           >
//             <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
//             Refresh
//           </Button>
//           <div className="flex items-center gap-2">
//             <div className={cn(
//               "w-2 h-2 rounded-full",
//               connected ? "bg-green-500 animate-pulse" : "bg-red-500"
//             )} />
//             <span className="text-sm text-muted-foreground">
//               {connected ? "Connected" : "Disconnected"}
//             </span>
//           </div>
//           <div className="text-sm text-muted-foreground">
//             {floatBalance > 0 ? "Ready" : "Depleted"}
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// }

// function playNotificationSound() {
//   try {
//     const audio = new Audio('/notification.wav');
//     audio.volume = 0.3;
//     audio.play().catch(e => dbg('Sound failed:', e));
//   } catch (e) {
//     dbg('Audio not supported');
//   }
// }
// Index.tsx - Company Dashboard with Fixed Infinite Loops
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Printer, Clock, FileText, LogIn, UserPlus, RefreshCw, Bug } from "lucide-react";
import { useCompany } from "@/hooks/use-company";
import { logClick } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency";
import { useUser } from "@/contexts/UserContext";
import { useSocket } from "@/contexts/SocketContext";
import { getPrints, updatePrint, updateQueue, getCompanyById } from "../../Functions";
import { api_url, backEndUrl, debugMode } from "../../Constants";

interface PrintJob {
  id: string;
  orderId?: string;
  clientId: string;
  clientName?: string;
  fileName: string;
  pages: number;
  copies: number;
  colored: boolean;
  laminated?: boolean;
  bound?: boolean;
  cost: number;
  pdf_file: any;
  createdAt: string;
  scheduledAt: string | null;
  state: string;
  scheduled: boolean;
}

// SIMPLE UTILITY FUNCTION - NO HOOKS, NO RE-RENDERS
const getDocumentName = (pdf_file: any): string => {
  // REMOVED ALL DEBUG LOGS FROM HERE - THIS WAS THE MAIN CULPRIT
  try {
    let name =
      pdf_file?.data?.attributes?.name ||
      pdf_file?.attributes?.name ||
      pdf_file?.name ||
      pdf_file?.data?.name ||
      "unnamedDoc.pdf"

    if (typeof name !== "string" || name.trim() === "") {
      name = "unnamedDoc.pdf"
    }

    if (name.length > 40) {
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
      name = name.slice(0, 40 - ext.length - 3) + "..." + ext
    }

    return name
  } catch (error) {
    return "unnamedDoc.pdf"
  }
}

export default function Index() {
  const { user, isAuthenticated, isLoading } = useUser();
  const { company } = useCompany();
  const { socket, connected, joinCompany } = useSocket();
  
  const [prints, setPrints] = useState<PrintJob[]>([]);
  const [activeTab, setActiveTab] = useState<"on-site" | "scheduled">("on-site");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState(company);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Refs to prevent infinite loops
  const hasJoinedRoom = useRef(false);
  const fetchInProgress = useRef(false);
  const listenersSetup = useRef(false);

  // Debug logger
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    if (debugMode) console.log('🐛', log);
    setDebugLogs(prev => [...prev.slice(-49), log]);
  }, []);

  // Local helpers
  const dbg = (...args: any[]) => { if (debugMode) console.log(...args); };
  const dwarn = (...args: any[]) => { if (debugMode) console.warn(...args); };

  // Refresh company data
  const refreshCompany = useCallback(async () => {
    if (!company?.id) return;
    
    try {
      const updated = await getCompanyById(company.id);
      setCompanyData(updated);
    } catch (e: any) {
      if (debugMode) console.error('❌ [refreshCompany] Error:', e);
    }
  }, [company?.id]);

  // Fetch prints from API
  const fetchPrints = useCallback(async () => {
    if (fetchInProgress.current || !company?.id) return;
    
    fetchInProgress.current = true;
    
    try {
      setLoading(true);
      
      const queryParts = [
        `filters[company][id][$eq]=${company.id}`,
        `filters[state][$in][0]=queued`,
        `filters[state][$in][1]=scheduled`,
        `filters[state][$in][2]=printing`,
        `filters[state][$in][3]=pending`,
        `filters[state][$in][4]=processing`,
        `populate=*`,
        `sort[0]=createdAt:desc`
      ];
      
      const queryString = queryParts.join('&');
      const response = await getPrints(queryString);
      console.log('queryString',queryString)
      if (!Array.isArray(response)) {
        setPrints([]);
        return;
      }

      const formatted = response.map((p: any) => {
        const clientData = p.client?.data?.attributes || p.client;
        const clientId = String(clientData?.clientId || clientData?.id || p.clientId || 'unknown');
        const clientName = clientData?.clientFirstName 
          ? `${clientData.clientFirstName} ${clientData.clientLastName || ''}`.trim()
          : clientData?.name || `Client ${clientId.slice(0, 8)}`;

        const pdfData = p.pdf_file?.data?.attributes || p.pdf_file;
        
        return {
          id: String(p.id),
          orderId: p.order_id || p.orderId,
          clientId: clientId,
          clientName: clientName,
          fileName: getDocumentName(pdfData), // CALLED ONLY ONCE HERE
          pages: p.file_pages_count || p.pages || 1,
          copies: p.copies_requested || p.copies || 1,
          colored: Boolean(p.colored),
          laminated: Boolean(p.laminated),
          bound: Boolean(p.bound),
          cost: parseFloat(p.final_cost_amount || p.cost) || 0,
          pdf_file: pdfData,
          createdAt: p.createdAt,
          scheduledAt: p.scheduled_time || p.scheduledAt || null,
          state: p.state,
          scheduled: Boolean(p.scheduled),
        };
      });

      setPrints(formatted);
      
    } catch (error: any) {
      if (debugMode) console.error('❌ [fetchPrints] Error:', error);
      setPrints([]);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [company?.id]);

  // Initial fetch
  useEffect(() => {
    if (!isLoading && isAuthenticated && company?.id && !fetchInProgress.current) {
      fetchPrints();
    }
  }, [isAuthenticated, company?.id, isLoading, fetchPrints]);

  // Join company room
  useEffect(() => {
    if (isAuthenticated && company?.id && connected && !hasJoinedRoom.current) {
      joinCompany(String(company.id));
      hasJoinedRoom.current = true;
    }

    if (!connected) {
      hasJoinedRoom.current = false;
    }
  }, [isAuthenticated, company?.id, connected, joinCompany]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !connected || !company || listenersSetup.current) return;

    listenersSetup.current = true;

    const handlePrintQueued = (data: any) => {
      try {
        if (String(data.companyId) !== String(company.id)) return;

        const newPrint: PrintJob = {
          id: String(data.printId),
          orderId: data.orderId,
          clientId: data.clientId || 'unknown',
          clientName: data.clientName || `Client ${data.clientId?.slice(0, 8)}`,
          fileName: data.fileName, // Use the fileName from socket data directly
          pages: Number(data.pages) || 1,
          copies: Number(data.copies) || 1,
          colored: Boolean(data.colored),
          laminated: Boolean(data.laminated),
          bound: Boolean(data.bound),
          cost: Number(data.cost) || 0,
          pdf_file: data.pdf_file || null,
          createdAt: data.createdAt || new Date().toISOString(),
          scheduledAt: null,
          state: 'queued',
          scheduled: false,
        };

        setPrints(prev => {
          const exists = prev.some(p => p.id === newPrint.id);
          if (exists) {
            return prev.map(p => p.id === newPrint.id ? newPrint : p);
          }
          return [newPrint, ...prev];
        });

        socket.emit('print:received', { printId: data.printId });
        toast.success('New print received!');
        playNotificationSound();
      } catch (error: any) {
        if (debugMode) console.error('❌ [Socket: print:queued] Error:', error);
      }
    };

    const handlePrintScheduled = (data: any) => {
      if (String(data.companyId) !== String(company.id)) return;

      const newPrint: PrintJob = {
        id: String(data.printId),
        clientId: data.clientId,
        clientName: `Client ${data.clientId.slice(0, 8)}`,
        fileName: data.fileName, // Use socket data directly
        pages: data.pages || 1,
        copies: 1,
        colored: false,
        cost: data.cost || 0,
        pdf_file: data.pdf_file || null,
        createdAt: new Date().toISOString(),
        scheduledAt: data.scheduledTime,
        state: 'scheduled',
        scheduled: true,
      };

      setPrints((prev) => {
        if (prev.some(p => p.id === newPrint.id)) {
          return prev.map(p => p.id === newPrint.id ? newPrint : p);
        }
        return [...prev, newPrint];
      });
    };

    const handlePrintCanceled = (data: any) => {
      if (String(data.companyId) !== String(company.id)) return;
      setPrints((prev) => prev.filter(p => p.id !== String(data.printId)));
    };

    socket.on('print:queued', handlePrintQueued);
    socket.on('print:scheduled', handlePrintScheduled);
    socket.on('print:canceled', handlePrintCanceled);

    return () => {
      socket.off('print:queued', handlePrintQueued);
      socket.off('print:scheduled', handlePrintScheduled);
      socket.off('print:canceled', handlePrintCanceled);
      listenersSetup.current = false;
    };
  }, [socket, connected, company]);

  // Filter prints by tab
  const onSite = prints.filter(p => !p.scheduled && 
    ['queued', 'printing', 'pending', 'processing'].includes(p.state));
  const scheduled = prints.filter(p => p.scheduled && 
    ['scheduled', 'pending'].includes(p.state));

  const selected = prints.find((p) => p.id === selectedId) ?? null;

  // Clear selection if print disappears
  useEffect(() => {
    if (selectedId && !prints.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [prints, selectedId]);

  // Print action handler
  const printAction = useCallback(async (job: PrintJob) => {
    if (processing) return;

    try {
      setProcessing(job.id);
      await updatePrint(Number(job.id), { state: 'printing' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await updatePrint(Number(job.id), { state: 'printed' });
      setPrints((prev) => prev.filter((p) => p.id !== job.id));
      await refreshCompany();
      toast.success("Print completed");
    } catch (error: any) {
      toast.error('Failed to process print');
    } finally {
      setProcessing(null);
    }
  }, [processing, refreshCompany]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-accent to-background flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </Card>
      </div>
    );
  }

  // Show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-accent to-background flex items-center justify-center">
        <main className="container py-6">
          <Card className="p-8 shadow-xl border-border/60 max-w-md mx-auto text-center">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">Access Required</h1>
                <p className="text-muted-foreground">
                  Please log in to view your dashboard.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button asChild className="w-full h-11 text-base">
                  <a href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In
                  </a>
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Don't have an account?
                </div>
                
                <Button asChild variant="outline" className="w-full h-11 text-base">
                  <a href="/register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background">
      <main className="container py-6">
        <div className="space-y-4">
          <DashboardHeader 
            connected={connected} 
            company={companyData}  
            onRefresh={fetchPrints}
            loading={loading}
          />
          
          {/* Debug Console Toggle */}
          {debugMode && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
              >
                <Bug className="h-4 w-4 mr-2" />
                {showDebug ? 'Hide' : 'Show'} Debug
              </Button>
            </div>
          )}

          {/* Debug Console */}
          {debugMode && showDebug && (
            <Card className="p-4 bg-black text-green-400 font-mono text-xs max-h-64 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">Debug Console ({debugLogs.length})</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDebugLogs([])}
                  className="text-green-400 hover:text-green-300"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {debugLogs.length === 0 ? (
                  <div className="text-gray-500">No logs yet...</div>
                ) : (
                  debugLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))
                )}
              </div>
            </Card>
          )}
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted">
                <TabsTrigger value="on-site">
                  On site ({onSite.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled">
                  Scheduled ({scheduled.length})
                </TabsTrigger>
              </TabsList>
              {company && (
                <div className="text-sm text-muted-foreground hidden md:block">
                  {company.name}
                </div>
              )}
            </div>

            <TabsContent value="on-site" className="mt-4">
              {loading ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading...
                </Card>
              ) : (
                <SplitView
                  items={onSite}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setShowMobileDetail(true);
                  }}
                  onPrint={printAction}
                  showDetail={!!selected}
                  processing={processing}
                  detail={
                    <JobDetail
                      job={selected}
                      onPrint={printAction}
                      processing={processing}
                    />
                  }
                  mobileSheetOpen={showMobileDetail}
                  onMobileSheetOpenChange={setShowMobileDetail}
                />
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="mt-4">
              {loading ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading...
                </Card>
              ) : (
                <SplitView
                  items={scheduled}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setShowMobileDetail(true);
                  }}
                  onPrint={printAction}
                  showDetail={!!selected}
                  processing={processing}
                  detail={
                    <JobDetail
                      job={selected}
                      onPrint={printAction}
                      processing={processing}
                    />
                  }
                  mobileSheetOpen={showMobileDetail}
                  onMobileSheetOpenChange={setShowMobileDetail}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function SplitView({
  items,
  selectedId,
  onSelect,
  onPrint,
  showDetail,
  processing,
  detail,
  mobileSheetOpen,
  onMobileSheetOpenChange,
}: {
  items: PrintJob[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPrint: (job: PrintJob) => void;
  showDetail: boolean;
  processing: string | null;
  detail: React.ReactNode;
  mobileSheetOpen: boolean;
  onMobileSheetOpenChange: (open: boolean) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewJob, setPreviewJob] = useState<PrintJob | null>(null);

  const getPdfUrl = (job: PrintJob): string | null => {
    try {
      if (job.pdf_file?.data?.attributes?.url) {
        const url = job.pdf_file.data.attributes.url;
        return url.startsWith('http') ? url : `${backEndUrl}${url}`;
      }
      if (job.pdf_file?.url) {
        const url = job.pdf_file.url;
        return url.startsWith('http') ? url : `${backEndUrl}${url}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <Card className="md:col-span-5 border-border/60 overflow-hidden">
        <div className="p-4 pb-2 flex items-center justify-between">
          <h2 className="font-semibold">Queue</h2>
          {items.length > 0 && (
            <Badge variant="secondary">{items.length} {items.length === 1 ? 'job' : 'jobs'}</Badge>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[calc(70vh)]">
          <ul className="p-2">
            {items.length === 0 && (
              <li className="text-sm text-muted-foreground p-8 text-center">
                <div className="mb-2">No prints in queue</div>
                <div className="text-xs">Waiting for customers...</div>
              </li>
            )}
            {items.map((item) => {
              const pdfUrl = getPdfUrl(item);
              return (
                <li key={item.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "w-full text-left rounded-lg p-3 hover:bg-accent/60 transition focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
                      selectedId === item.id && "bg-accent",
                    )}
                    onClick={() => onSelect(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelect(item.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {item.fileName} {/* USE PRE-COMPUTED FILENAME */}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {item.orderId && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.orderId}
                          </Badge>
                        )}
                        <Badge variant={item.scheduledAt ? "default" : "secondary"}>
                          {item.scheduledAt ? "Scheduled" : "Available"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewJob(item);
                          setPreviewOpen(true);
                        }}
                        disabled={!pdfUrl}
                        className="h-8"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            {previewJob && getPdfUrl(previewJob) ? (
              <iframe
                src={getPdfUrl(previewJob)!}
                className="w-full h-[80vh] border rounded"
                title="PDF Preview Modal"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                PDF file not available
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>

      <div className="hidden md:block md:col-span-7">
        {showDetail ? (
          <Card className="h-full p-6 border-border/60 overflow-auto max-h-[calc(70vh+4rem)]">{detail}</Card>
        ) : (
          <Card className="h-full p-6 grid place-content-center text-center text-muted-foreground border-dashed border-2">
            <div>
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <div>Select a print to view details</div>
            </div>
          </Card>
        )}
      </div>

      <Sheet open={mobileSheetOpen} onOpenChange={onMobileSheetOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-auto">
          <SheetTitle className="sr-only">Print details</SheetTitle>
          <div className="p-6">{detail}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function JobDetail({
  job,
  onPrint,
  processing,
}: {
  job: PrintJob | null;
  onPrint: (job: PrintJob) => void;
  processing: string | null;
}) {
  const [pdfError, setPdfError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!job) return null;

  const getPdfUrl = (): string | null => {
    try {
      if (job.pdf_file?.data?.attributes?.url) {
        const url = job.pdf_file.data.attributes.url;
        return url.startsWith('http') ? url : `${backEndUrl}${url}`;
      }
      if (job.pdf_file?.url) {
        const url = job.pdf_file.url;
        return url.startsWith('http') ? url : `${backEndUrl}${url}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const pdfUrl = getPdfUrl();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Print Job
        </div>
        <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
          <FileText className="h-5 w-5 text-primary" />
          <span className="break-all">
            {job.fileName} {/* USE PRE-COMPUTED FILENAME */}
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => setPreviewOpen(true)}
              disabled={!pdfUrl}
              title="Preview & Print"
            >
              <Printer className="h-5 w-5 text-primary" />
            </Button>
          </span>
        </h3>
        <div className="mt-1 text-muted-foreground text-sm">
          {job.clientName}
        </div>
        {job.orderId && (
          <div className="mt-2">
            <Badge variant="outline" className="font-mono text-base">
              Order: {job.orderId}
            </Badge>
          </div>
        )}
      </div>
      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <Info label="Pages" value={String(job.pages)} />
        <Info label="Copies" value={String(job.copies)} />
        <Info label="Color" value={job.colored ? "Color" : "Mono"} />
        <Info label="Cost" value={`K${job.cost.toFixed(2)}`} />
        {job.laminated && (
          <Info label="Laminated" value="Yes" />
        )}
        {job.bound && (
          <Info label="Bound" value="Yes" />
        )}
        {job.scheduledAt && (
          <div className="col-span-2">
            <Info
              label="Scheduled for"
              value={new Date(job.scheduledAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          To print, click the icon above <Printer className="h-5 w-5 text-primary" />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          When done, mark as printed below.
        </div>
      </div>

      {pdfUrl ? (
        <div>
          <div className="text-sm font-medium mb-2 flex items-center justify-between">
            <span>Document Preview</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pdfUrl, '_blank')}
            >
              Open Full
            </Button>
          </div>
          {!pdfError ? (
            <div className="border rounded-lg overflow-hidden bg-gray-100">
              <iframe
                src={pdfUrl}
                className="w-full h-96"
                title="PDF Preview"
                onError={(e) => {
                  setPdfError(true);
                  toast.error('Failed to load PDF');
                }}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center bg-gray-50">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <div className="text-sm text-muted-foreground mb-3">
                Preview unavailable. Open full file.
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                Open PDF
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center bg-gray-50">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <div className="text-sm text-red-600 mb-3">
            PDF file not available
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={processing === job.id}
          className="h-11 text-base flex-1"
        >
          {processing === job.id ? "Completing..." : "Mark as Printed"}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Print</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mb-4 text-lg font-semibold">
              Confirm print completion?
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                No
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  onPrint(job);
                }}
                disabled={processing === job.id}
              >
                Yes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[80vh] border rounded"
              title="PDF Preview Modal"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              PDF file not available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3 bg-card/50">
      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}

function DashboardHeader({ 
  connected, 
  company,
  onRefresh,
  loading 
}: { 
  connected?: boolean;
  company: any;
  onRefresh: () => void;
  loading: boolean;
}) {
  if (!company) return null;
  
  const currency = company.settings?.currency || company.currency || "ZMW";
  const floatBalance = company.float_balance || 0;

  return (
    <Card className="p-4 border-border/60">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Float available</div>
          <div className="text-2xl font-bold">
            {formatCurrency(floatBalance, currency)} ({currency})
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              connected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-sm text-muted-foreground">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {floatBalance > 0 ? "Ready" : "Depleted"}
          </div>
        </div>
      </div>
    </Card>
  );
}

function playNotificationSound() {
  try {
    const audio = new Audio('/notification.wav');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Sound failed:', e));
  } catch (e) {
    console.log('Audio not supported');
  }
}
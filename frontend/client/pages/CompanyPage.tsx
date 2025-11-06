// // import { useEffect, useState } from "react";
// // import { useNavigate, useParams, useLocation } from "react-router-dom";
// // import { Button } from "@/components/ui/button";
// // import {
// //   Card,
// //   CardContent,
// //   CardDescription,
// //   CardHeader,
// //   CardTitle,
// // } from "@/components/ui/card";
// // import { Badge } from "@/components/ui/badge";
// // import { Printer, Info, MapPin, Clock } from "lucide-react";
// // import { haversineKm } from "@/data/shops";
// // import {
// //   getCompanyByName,
// //   createPrint,
// //   getClientId,
// //   getClientByClientId,
// //   createClient,
// //   updateClient,
// //   updatePrint,
// //   createHistory,
// //   getPrintById,
// //   updateQueue,
// //   getQueueForCompany,
// // } from "../../Functions.js";
// // import Uploader from "@/components/ui/uploader";
// // import { toast } from "sonner";
// // import PrintInformation from "@/components/Includes/PrintInformation";
// // import { useSocket } from "@/contexts/SocketContext";
// // import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// // export default function CompanyPage() {
// //   const { name } = useParams();
// //   const navigate = useNavigate();
// //   const { socket, connected } = useSocket();
  
// //   const [company, setCompany] = useState<any | null>(null);
// //   const [client, setClient] = useState<any | null>(null);
// //   const [print, setPrint] = useState<any | null>(null);
// //   const [creating, setCreating] = useState(false);
// //   const [showPrintInformation, setShowPrintInformation] = useState(false);
// //   const [printPreferences, setPrintPreferences] = useState<any | null>(null);
// //   const [codeInput, setCodeInput] = useState("");
// //   const [onSiteByCode, setOnSiteByCode] = useState(false);
// //   const [isNearShop, setIsNearShop] = useState(false);
// //   const [nearbyAndFloat, setNearbyAndFloat] = useState(false);
// //   const [km, setKm] = useState<number | null>(null);
// //   const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
// //   const [hasJob, setHasJob] = useState(false);
// //   const [submitting, setSubmitting] = useState(false);
// //   const [scheduling, setScheduling] = useState(false);
// //   const [submitted, setSubmitted] = useState(false);
// //   const [scheduled, setScheduled] = useState(false);
// //   const [floatOK, setFloatOK] = useState(true);
  
// //   // Socket-related state
// //   const [queuePosition, setQueuePosition] = useState<number | null>(null);
// //   const [queueTotal, setQueueTotal] = useState<number>(0);
// //   const [printStatus, setPrintStatus] = useState<string | null>(null);

// //   const [tab, setTab] = useState<"activity" | "print" | "about">("activity");
// //   const location = useLocation();

// //   const [submitModalOpen, setSubmitModalOpen] = useState(false);
// //   const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
// //   const [scheduleTime, setScheduleTime] = useState<string>("");
// //   const [modalCodeInput, setModalCodeInput] = useState("");
// //   const [checkingLocation, setCheckingLocation] = useState(false);
// //   const [isModalOnSite, setIsModalOnSite] = useState(isNearShop);

// //   // Add state for queue and queue clients
// //   const [queue, setQueue] = useState<any | null>(null);
// //   const [queueClients, setQueueClients] = useState<any[]>([]);
// //   const [queueSize, setQueueSize] = useState(0);

// //   useEffect(() => {
// //     const h = (location.hash || "#activity").replace("#", "");
// //     if (h === "print" || h === "activity" || h === "about") setTab(h);
// //   }, [location.hash]);

// //   // Fetch company and queue with clients
// //   useEffect(() => {
// //     (async () => {
// //       try {
// //         const c = await getCompanyByName(String(name), { params: 'populate=queue,queue.clients' });
// //         setCompany(c);
// //         setFloatOK((typeof c.float_balance === "number" ? c.float_balance : 0) > 0);
// //         if (c.queue && c.queue.clients) {
// //           setQueue(c.queue);
// //           setQueueClients(c.queue.clients);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching company:', error);
// //         toast.error('Company not found');
// //       }
// //     })();
// //   }, [name]);

// //   // Fetch queue for company and set queue size
// //   useEffect(() => {
// //     if (!company?.id) return;
// //     const fetchQueue = async () => {
// //       try {
// //         const queueData = await getQueueForCompany(company.id, { params: 'populate=clients' });
// //         if (queueData && queueData.clients) {
// //           setQueue(queueData);
// //           setQueueClients(queueData.clients);
// //           setQueueSize(Array.isArray(queueData.clients) ? queueData.clients.length : 0);
// //         } else {
// //           setQueue(null);
// //           setQueueClients([]);
// //           setQueueSize(0);
// //         }
// //       } catch (error) {
// //         setQueue(null);
// //         setQueueClients([]);
// //         setQueueSize(0);
// //       }
// //     };
// //     fetchQueue();
// //   }, [company?.id]);

// //   // Compute queue position for this client
// //   useEffect(() => {
// //     if (!client?.id || !queueClients.length) {
// //       setQueuePosition(null);
// //       return;
// //     }
// //     // Find the index of the client in the queue by id
// //     const idx = queueClients.findIndex((qc) => qc.id === client.id);
// //     setQueuePosition(idx >= 0 ? idx + 1 : null);
// //   }, [client?.id, queueClients]);

// //   // Calculate proximity and nearbyAndFloat
// //   useEffect(() => {
// //     if (!company) return;

// //     const calculateProximity = async () => {
// //       // Check code first - CODE VALIDATION HAS PRIORITY
// //       let codeValid = false;
// //       if (codeInput.length === 4 && company?.id) {
// //         try {
// //           const refreshed = await getCompanyByName(String(company.name));
// //           codeValid = parseInt(String(refreshed?.printCode)) === parseInt(codeInput);
// //         } catch {
// //           codeValid = false;
// //         }
// //       }
// //       setOnSiteByCode(codeValid);

// //       // Calculate distance
// //       let kmValue: number | null = null;
// //       if (coords && company.location) {
// //         kmValue = haversineKm(coords, { 
// //           lat: company.location.lat, 
// //           lon: company.location.lng 
// //         });
// //       }
// //       setKm(kmValue);
      
// //       const radiusKm = (company.radiusConsideredNearInMeters || 500) / 1000;
// //       const nearByDistance = kmValue !== null && kmValue <= radiusKm;
      
// //       // User is considered "near" if EITHER code is valid OR within radius
// //       const nearCheck = codeValid || nearByDistance;
// //       setIsNearShop(nearCheck);
      
// //       // Can submit if near (by code OR distance) AND float is OK
// //       setNearbyAndFloat(floatOK && nearCheck);
// //     };

// //     calculateProximity();
// //   }, [coords, company, codeInput, floatOK]);

// //   // Get user coordinates
// //   useEffect(() => {
// //     if (navigator.geolocation) {
// //       navigator.geolocation.getCurrentPosition(
// //         (pos) =>
// //           setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
// //         () => setCoords(null),
// //         { enableHighAccuracy: true, timeout: 8000 },
// //       );
// //     }
// //   }, []);

// //   // Ensure client exists and keep location updated
// //   useEffect(() => {
// //     (async () => {
// //       if (!company) return;
// //       try {
// //         const cid = getClientId();
// //         if (!cid) return;
        
// //         let existing = await getClientByClientId(cid);
// //         if (!existing) {
// //           existing = await createClient({
// //             clientId: cid,
// //             currentLocation: coords
// //               ? { lat: coords.lat, lng: coords.lon }
// //               : undefined,
// //           });
// //         } else if (coords) {
// //           // Update client location
// //           await updateClient(existing.id, {
// //             currentLocation: { lat: coords.lat, lng: coords.lon }
// //           });
// //         }
// //         setClient(existing);
// //       } catch (error) {
// //         console.error('Error managing client:', error);
// //       }
// //     })();
// //   }, [company?.id, coords]);

// //   // Create draft print
// //   useEffect(() => {
// //     (async () => {
// //       if (!company || !client || print || creating) return;

// //       try {
// //         setCreating(true);
// //         const printId = localStorage.getItem("printId");
// //         if (printId) {
// //           const currentPrint = await getPrintById(printId, "populate=pdf_file");
// //           if (currentPrint?.pdf_file?.data) {
// //             setShowPrintInformation(true);
// //           }
// //           setPrint(currentPrint);
          
// //           // Check if already submitted/scheduled
// //           if (currentPrint?.state === "queued" || currentPrint?.state === "scheduled") {
// //             setHasJob(true);
// //             if (currentPrint?.state === "queued") setSubmitted(true);
// //             if (currentPrint?.state === "scheduled") setScheduled(true);
// //           }
// //         } else {
// //           const draft = await createPrint({
// //             dataFields: {
// //               cost_per_page: company.cost_per_page,
// //               cost_per_copy: company.cost_per_copy,
// //               client: Number(client.id),
// //               company: Number(company.id),
// //             },
// //           });
// //           localStorage.setItem("printId", String(draft.id));
// //           setPrint(await getPrintById(draft.id, "populate=pdf_file"));
// //         }
// //       } catch (error) {
// //         console.error('Error creating print:', error);
// //       } finally {
// //         setCreating(false);
// //       }
// //     })();
// //   }, [client?.id, company?.id, print]);

// //   // ============ SOCKET INTEGRATION ============
  
// //   // Join client room and watch company queue
// //   useEffect(() => {
// //     if (!socket || !connected || !client?.clientId || !company?.id) return;

// //     const clientId = client.clientId;
// //     const companyId = company.id;

// //     // Join client room
// //     socket.emit('client:join', { clientId });
// //     console.log('[CompanyPage] Joined client room:', clientId);

// //     // Watch company queue
// //     socket.emit('queue:watch', { companyId });
// //     console.log('[CompanyPage] Watching queue for company:', companyId);

// //     return () => {
// //       if (socket && connected) {
// //         socket.emit('queue:unwatch', { companyId });
// //         console.log('[CompanyPage] Stopped watching queue');
// //       }
// //     };
// //   }, [socket, connected, client?.clientId, company?.id]);

// //   // Complete replacement for the socket event listeners useEffect in CompanyPage
// // // Replace the entire "Listen for socket events" useEffect with this:

// // useEffect(() => {
// //   if (!socket || !connected) return;

// //   // Shared queue refetch function
// //   const fetchQueue = async () => {
// //     if (!company?.id) return;
// //     try {
// //       const queueData = await getQueueForCompany(company.id, { params: 'populate=clients' });
// //       if (queueData && queueData.clients) {
// //         setQueue(queueData);
// //         setQueueClients(queueData.clients);
// //         setQueueSize(Array.isArray(queueData.clients) ? queueData.clients.length : 0);
        
// //         console.log('[CompanyPage] Queue fetched:', {
// //           total: queueData.clients.length,
// //           clients: queueData.clients.map((c: any) => c.id)
// //         });
// //       } else {
// //         setQueue(null);
// //         setQueueClients([]);
// //         setQueueSize(0);
// //       }
// //     } catch (error) {
// //       console.error('[CompanyPage] Error fetching queue:', error);
// //       setQueue(null);
// //       setQueueClients([]);
// //       setQueueSize(0);
// //     }
// //   };

// //   const handleClientConnected = (data: any) => {
// //     console.log('[CompanyPage] Client connected:', data);
// //   };

// //   const handleQueuePosition = (data: any) => {
// //     console.log('[CompanyPage] Queue position update:', data);
// //     setQueuePosition(data.position);
// //     setQueueTotal(data.total);
    
// //     toast.info(`Queue Position: ${data.position} of ${data.total}`, {
// //       description: `Estimated wait: ~${data.position * 5} minutes`,
// //     });
// //   };

// //   const handleQueueUpdated = async (data: any) => {
// //     console.log('[CompanyPage] Queue updated:', data);
    
// //     // Update queue size immediately from the event
// //     if (data.queue?.total !== undefined) {
// //       setQueueSize(data.queue.total);
// //     }
    
// //     // Refetch full queue data with all client details
// //     await fetchQueue();
// //   };

// //   const handlePrintQueued = async (data: any) => {
// //     console.log('[CompanyPage] Print queued event:', data);
    
// //     // Show notification for own print
// //     if (data.printId === print?.id) {
// //       setPrintStatus('queued');
      
// //       toast.success('Print submitted successfully!', {
// //         description: data.orderId ? `Order ID: ${data.orderId}` : 'Added to queue',
// //       });
      
// //       if ('Notification' in window && Notification.permission === 'granted') {
// //         new Notification('Print Queued', {
// //           body: `Your print job has been added to the queue`,
// //           icon: '/logo.png',
// //         });
// //       }
// //     }
    
// //     // CRITICAL: Refetch queue for ALL clients when ANY print is queued
// //     await fetchQueue();
// //   };

// //   const handlePrintScheduled = (data: any) => {
// //     if (data.printId === print?.id) {
// //       console.log('[CompanyPage] Your print was scheduled!');
// //       setPrintStatus('scheduled');
      
// //       toast.success('Print scheduled successfully!', {
// //         description: data.scheduledTime 
// //           ? `Scheduled for ${new Date(data.scheduledTime).toLocaleString()}`
// //           : 'Print has been scheduled',
// //       });
// //     }
// //   };

// //   const handlePrintPrinting = async (data: any) => {
// //     console.log('[CompanyPage] Print printing event:', data);
    
// //     if (data.printId === print?.id) {
// //       setPrintStatus('printing');
      
// //       toast.info('Printing started', {
// //         description: 'Your document is now being printed',
// //         duration: 5000,
// //       });
      
// //       if ('Notification' in window && Notification.permission === 'granted') {
// //         new Notification('Printing Started', {
// //           body: `${data.fileName} is now being printed`,
// //           icon: '/logo.png',
// //         });
// //       }
// //     }
    
// //     // Refetch queue as client may have been removed
// //     await fetchQueue();
// //   };

// //   const handlePrintCompleted = async (data: any) => {
// //     console.log('[CompanyPage] Print completed event:', data);
    
// //     if (data.printId === print?.id) {
// //       setPrintStatus('completed');
      
// //       toast.success('Print completed!', {
// //         description: 'Your document is ready for pickup',
// //         duration: 10000,
// //       });
      
// //       if ('Notification' in window && Notification.permission === 'granted') {
// //         new Notification('Print Ready!', {
// //           body: `${data.fileName} is ready for pickup`,
// //           icon: '/logo.png',
// //           requireInteraction: true,
// //         });
// //       }
      
// //       // Clear local print data
// //       localStorage.removeItem('printId');
// //       setHasJob(false);
// //       setSubmitted(false);
// //       setScheduled(false);
// //       setPrint(null);
// //       setQueuePosition(null);
// //       setQueueTotal(0);
// //       setShowPrintInformation(false);
// //     }
    
// //     // Refetch queue as client was removed
// //     await fetchQueue();
// //   };

// //   const handlePrintCanceled = async (data: any) => {
// //     console.log('[CompanyPage] Print canceled event:', data);
    
// //     if (data.printId === print?.id) {
// //       setPrintStatus('canceled');
      
// //       toast.error('Print canceled', {
// //         description: data.reason || 'The print job was canceled',
// //       });
      
// //       // Clear local print data
// //       localStorage.removeItem('printId');
// //       setHasJob(false);
// //       setSubmitted(false);
// //       setScheduled(false);
// //       setPrint(null);
// //       setQueuePosition(null);
// //       setQueueTotal(0);
// //       setShowPrintInformation(false);
// //     }
    
// //     // Refetch queue as client may have been removed
// //     await fetchQueue();
// //   };

// //   const handleCompanyUnavailable = (data: any) => {
// //     if (data.companyId === company?.id) {
// //       console.log('[CompanyPage] Company became unavailable');
// //       toast.warning('Company unavailable', {
// //         description: data.reason === 'float_depleted' 
// //           ? 'Company has run out of float balance'
// //           : 'Company is currently unavailable',
// //       });
      
// //       setFloatOK(false);
// //     }
// //   };

// //   const handleCompanyFloatToppedUp = (data: any) => {
// //     if (data.companyId === company?.id) {
// //       console.log('[CompanyPage] Company float topped up');
// //       toast.success('Company float replenished', {
// //         description: 'You can now submit prints immediately',
// //       });
      
// //       setFloatOK(true);
// //     }
// //   };

// //   // Register all event listeners
// //   socket.on('client:connected', handleClientConnected);
// //   socket.on('queue:position', handleQueuePosition);
// //   socket.on('queue:updated', handleQueueUpdated);
// //   socket.on('print:queued', handlePrintQueued);
// //   socket.on('print:scheduled', handlePrintScheduled);
// //   socket.on('print:printing', handlePrintPrinting);
// //   socket.on('print:completed', handlePrintCompleted);
// //   socket.on('print:canceled', handlePrintCanceled);
// //   socket.on('company:unavailable', handleCompanyUnavailable);
// //   socket.on('company:float-topped-up', handleCompanyFloatToppedUp);

// //   // Cleanup
// //   return () => {
// //     socket.off('client:connected', handleClientConnected);
// //     socket.off('queue:position', handleQueuePosition);
// //     socket.off('queue:updated', handleQueueUpdated);
// //     socket.off('print:queued', handlePrintQueued);
// //     socket.off('print:scheduled', handlePrintScheduled);
// //     socket.off('print:printing', handlePrintPrinting);
// //     socket.off('print:completed', handlePrintCompleted);
// //     socket.off('print:canceled', handlePrintCanceled);
// //     socket.off('company:unavailable', handleCompanyUnavailable);
// //     socket.off('company:float-topped-up', handleCompanyFloatToppedUp);
// //   };
// // }, [socket, connected, print?.id, company?.id, client?.id]);
// //   // ============ HANDLERS ============

// //   const handleCheckLocation = () => {
// //     setCheckingLocation(true);
// //     if (navigator.geolocation) {
// //       navigator.geolocation.getCurrentPosition(
// //         (pos) => {
// //           setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
// //           // Recalculate proximity
// //           if (company && pos.coords) {
// //             const kmValue = haversineKm(
// //               { lat: pos.coords.latitude, lon: pos.coords.longitude },
// //               { lat: company.location.lat, lon: company.location.lng }
// //             );
// //             const radiusKm = (company.radiusConsideredNearInMeters || 500) / 1000;
// //             setIsModalOnSite(kmValue <= radiusKm);
// //           }
// //           setCheckingLocation(false);
// //         },
// //         () => setCheckingLocation(false),
// //         { enableHighAccuracy: true, timeout: 8000 },
// //       );
// //     }
// //   };

// //   const handleSubmit = async () => {
// //     if (!print || !printPreferences) return;
// //     // Only allow if onsite or code is valid
// //     if (!isModalOnSite && (!modalCodeInput || modalCodeInput.length !== 4)) return;
// //     const updateObject = {
// //       file_pages_count: printPreferences.pages,
// //       copies_requested: printPreferences.copies,
// //       cost_per_page: printPreferences.perPageRate,
// //       cost_per_copy: printPreferences.costPerCopy,
// //       final_cost_amount: printPreferences.totalCost,
// //       laminated: printPreferences.laminated,
// //       colored: printPreferences.colored,
// //       bound: printPreferences.bound,
// //       state: "queued",
// //       printCode: modalCodeInput || undefined,
// //     };
// //     setSubmitting(true);
// //     try {
// //       await updatePrint(Number(print.id), updateObject);
// //       setHasJob(true);
// //       setSubmitted(true);
// //       toast.success("Submitted for immediate printing");
// //       createHistory({
// //         activity: "submitted print",
// //         activityBody: `You submitted a print #${print.id}`,
// //         client: client ? Number(client.id) : undefined,
// //         user: null,
// //       });
// //       localStorage.removeItem("printId");
// //       setTab("activity");
// //       setSubmitModalOpen(false);
// //     } catch (error) {
// //       console.error('Error submitting print:', error);
// //       toast.error('Failed to submit print');
// //       setSubmitted(false);
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };
  
// //   const handleSchedulePrint = async () => {
// //     if (!print || !printPreferences || !scheduleTime) return;
// //     const updateObject = {
// //       file_pages_count: printPreferences.pages,
// //       copies_requested: printPreferences.copies,
// //       cost_per_page: printPreferences.perPageRate,
// //       cost_per_copy: printPreferences.costPerCopy,
// //       final_cost_amount: printPreferences.totalCost,
// //       laminated: printPreferences.laminated,
// //       colored: printPreferences.colored,
// //       bound: printPreferences.bound,
// //       state: "scheduled",
// //       scheduled: true,
// //       scheduled_time: scheduleTime,
// //     };
// //     setScheduling(true);
// //     try {
// //       await updatePrint(Number(print.id), updateObject);
// //       setHasJob(true);
// //       setScheduled(true);
// //       toast("Scheduled successfully");
// //       createHistory({
// //         activity: "scheduled print",
// //         activityBody: `You scheduled a print #${print.id}`,
// //         client: client ? Number(client.id) : undefined,
// //         user: null,
// //       });
// //       localStorage.removeItem("printId");
// //       setTab("activity");
// //       setScheduleModalOpen(false);
// //     } catch (error) {
// //       console.error('Error scheduling print:', error);
// //       toast.error('Failed to schedule print');
// //       setScheduled(false);
// //     } finally {
// //       setScheduling(false);
// //     }
// //   };

// //   // Helper to render queue status
// //   const renderQueuePosition = () => {
// //     // Always show queue size and position, even if user has no job
// //     let position = null;
// //     if (client?.id && queueClients.length) {
// //       // Find the index of the client in the queue by id
// //       let idx = queueClients.findIndex((qc) => qc.id === client.id)
// //       position = idx >= 0? idx + 1 : null;
// //     }
// //     return (
// //           <div className="mt-4 text-sm">
// //                 Your Position: {" "}
// //                 <span className="font-semibold">{position ?? 'N/A'}</span>
// //             </div>
// //     )
// //   };

// //   if (!company) {
// //     return (
// //       <section className="container py-10">
// //         <Button onClick={() => navigate(-1)} className="mb-4">
// //           Back
// //         </Button>
// //         <Card>
// //           <CardHeader>
// //             <CardTitle>Company not found</CardTitle>
// //             <CardDescription>It may have been removed.</CardDescription>
// //           </CardHeader>
// //         </Card>
// //       </section>
// //     );
// //   }
  
// //   const estWait = Math.max(0, (queueSize - (hasJob ? 1 : 0)) * 2);
// //   console.log('company',company)
// //   return (
// //     <div className="pb-20">
// //       <header className="border-b bg-background">
// //         <div className="container flex h-14 items-center justify-between">
// //           <div className="font-semibold truncate">{company.name}</div>
// //           <div className="flex items-center gap-2">
// //             <Badge variant="secondary">Queue {queueSize}</Badge>
// //             {connected && (
// //               <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
// //             )}
// //           </div>
// //         </div>
// //       </header>

// //       {tab === "activity" && (
// //         <section className="container py-6">
// //           <Card>
// //             <CardHeader>
// //               <CardTitle>Activity</CardTitle>
// //               <CardDescription>
// //                 Live queue and your jobs with this company.
// //               </CardDescription>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="flex items-center justify-between text-sm">
// //                 <span>Queue size</span>
// //                 <span>{queueSize}</span>
// //               </div>
// //               <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
// //                 <div
// //                   className="h-full rounded-full bg-primary"
// //                   style={{ width: `${(1 / Math.max(queueSize, 1)) * 100}%` }}
// //                 />
// //               </div>
// //               <div className="mt-4 text-sm">
// //                 Estimated wait time:{" "}
// //                 <span className="font-semibold">~{estWait} min</span>
// //               </div>
// //               {renderQueuePosition()}
// //               {hasJob ? (
// //                 <div className="mt-4 text-sm text-green-600">
// //                   You have a job in queue.
// //                 </div>
// //               ) : (
// //                 <div className="mt-4 text-sm text-muted-foreground">
// //                   No active jobs.
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>
// //         </section>
// //       )}

// //       {tab === "print" && (
// //         <section className="container py-6">
// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="flex items-center gap-2">
// //                 <Printer className="h-5 w-5" /> Print
// //               </CardTitle>
// //               <CardDescription>
// //                 Upload files and submit. Enter the 4-digit code or be within {company.radiusConsideredNearInMeters || 500}m 
// //                 to submit immediately; otherwise schedule.
// //               </CardDescription>
// //             </CardHeader>
// //             <CardContent>
// //               {print ? (
// //                 <Uploader
// //                   refId={print.id}
// //                   refName="api::print.print"
// //                   fieldName="file"
// //                   allowedTypes={[
// //                     "image/jpeg",
// //                     "image/png",
// //                     "image/gif",
// //                     "application/pdf",
// //                     "application/msword",
// //                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// //                     "application/vnd.ms-excel",
// //                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// //                     "application/vnd.ms-powerpoint",
// //                     "application/vnd.openxmlformats-officedocument.presentationml.presentation",
// //                     "application/vnd.oasis.opendocument.text",
// //                     "application/vnd.oasis.opendocument.spreadsheet",
// //                     "application/vnd.oasis.opendocument.presentation",
// //                     "text/plain",
// //                     "application/rtf",
// //                     "text/html",
// //                     "application/xml",
// //                     "text/xml",
// //                     "text/csv",
// //                   ]}
// //                   onUploaded={async (res) => {
// //                     setHasJob(true);
// //                     toast("File uploaded");
// //                     const printWithNewFile = await getPrintById(print.id, "populate=pdf_file");
// //                     setPrint(printWithNewFile);
// //                     setShowPrintInformation(true);
// //                     const fileName =
// //                       Array.isArray(res) && res[0]?.name ? res[0].name : "file";
// //                     try {
// //                       createHistory({
// //                         activity: "uploaded file",
// //                         activityBody: `You uploaded ${fileName}`,
// //                         client: client ? Number(client.id) : undefined,
// //                         user: null,
// //                       });
// //                     } catch {}
// //                     if (Notification?.permission === "granted") {
// //                       new Notification("Upload completed", {
// //                         body: `${fileName} ready`,
// //                       });
// //                     }
// //                   }}
// //                 />
// //               ) : (
// //                 <div className="flex h-44 w-full items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
// //                   Preparing uploader...
// //                 </div>
// //               )}

// //               {print && showPrintInformation ? (
// //                 <PrintInformation
// //                   setPrintPreferences={setPrintPreferences}
// //                   draftPrint={print}
// //                   company={company}
// //                 />
// //               ) : null}

// //               <div className="mt-4 flex flex-col gap-2">
// //                 {print?.state === "queued" || print?.state === "scheduled" ? (
// //                   <div className="flex flex-wrap gap-2">
// //                     <Button disabled={true}>
// //                       {print?.state === "queued" ? "Submitted" : "Scheduled"}
// //                     </Button>
// //                   </div>
// //                 ) : (
// //                   <div className="flex flex-wrap gap-2">
// //                     <Button
// //                       disabled={submitted || submitting || !print || !printPreferences}
// //                       onClick={() => setSubmitModalOpen(true)}
// //                     >
// //                       {submitted ? "Submitted" : submitting ? "Submitting..." : "Submit now"}
// //                     </Button>
// //                     {company.allowsPrintScheduling ? (
// //                       <Button 
// //                         disabled={scheduled || scheduling || !print || !printPreferences} 
// //                         variant="secondary" 
// //                         onClick={() => setScheduleModalOpen(true)}
// //                       >
// //                         {scheduled ? "Scheduled" : scheduling ? "Scheduling..." : "Schedule print"}
// //                       </Button>
// //                     ) : null}
// //                   </div>
// //                 )}
// //               </div>
// //             </CardContent>
// //           </Card>
// //           {/* Submit Modal */}
// //           <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
// //             <DialogContent className="max-w-md">
// //               <DialogHeader>
// //                 <DialogTitle>Confirm Print Submission</DialogTitle>
// //               </DialogHeader>
// //               {!isModalOnSite && (
// //                 <div className="mb-4 text-red-600 font-semibold">You seem to be far from the shop</div>
// //               )}
// //               {!isModalOnSite && (
// //                 <Button
// //                   variant="outline"
// //                   className="mb-2"
// //                   onClick={handleCheckLocation}
// //                   disabled={checkingLocation}
// //                 >
// //                   {checkingLocation ? "Checking..." : "Check my current location"}
// //                 </Button>
// //               )}
// //               {!isModalOnSite && (
// //                 <input
// //                   type="text"
// //                   maxLength={4}
// //                   value={modalCodeInput}
// //                   onChange={(e) => setModalCodeInput(e.target.value.replace(/\D/g, ''))}
// //                   placeholder="Enter 4-digit code from shop"
// //                   className="w-full rounded border px-3 py-2 text-center text-sm font-mono mb-2"
// //                 />
// //               )}
// //               {!isModalOnSite && (
// //                 <div className="text-xs text-muted-foreground mb-2">
// //                   Get a code from the shop and use it to print now or schedule if you are not onsite
// //                 </div>
// //               )}
// //               <div className="flex justify-center gap-4 mt-6">
// //                 <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>
// //                   Cancel
// //                 </Button>
// //                 <Button
// //                   onClick={handleSubmit}
// //                   disabled={submitting || (!isModalOnSite && (!modalCodeInput || modalCodeInput.length !== 4))}
// //                 >
// //                   Confirm
// //                 </Button>
// //               </div>
// //             </DialogContent>
// //           </Dialog>
// //           {/* Schedule Modal with Time Picker */}
// //           <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
// //             <DialogContent className="max-w-md">
// //               <DialogHeader>
// //                 <DialogTitle>Schedule Print Pickup</DialogTitle>
// //               </DialogHeader>
// //               <div className="mb-4">
// //                 <input
// //                   type="time"
// //                   value={scheduleTime}
// //                   onChange={e => setScheduleTime(e.target.value)}
// //                   className="w-full rounded border px-3 py-2 text-center text-sm font-mono mb-2"
// //                 />
// //               </div>
// //               <div className="flex justify-center gap-4 mt-6">
// //                 <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
// //                   Cancel
// //                 </Button>
// //                 <Button
// //                   onClick={handleSchedulePrint}
// //                   disabled={scheduling || !scheduleTime}
// //                 >
// //                   Confirm
// //                 </Button>
// //               </div>
// //             </DialogContent>
// //           </Dialog>
// //         </section>
// //       )}

// //       {tab === "about" && (
// //         <section className="container py-6">
// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="flex items-center gap-2">
// //                 <Info className="h-5 w-5" /> About
// //               </CardTitle>
// //               <CardDescription>
// //                 Location and details for this company.
// //               </CardDescription>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-2 text-sm">
// //                 <div className="flex items-center gap-2">
// //                   <MapPin className="h-4 w-4" /> 
// //                   <span>
// //                     lat {company.location?.lat?.toFixed(5)}, lon {company.location?.lng?.toFixed(5)}
// //                   </span>
// //                 </div>
// //                 <div>
// //                   <strong>Proximity radius:</strong> {company.radiusConsideredNearInMeters || 500}m
// //                 </div>
// //                 <div>
// //                   <strong>Company code:</strong> Available on-site
// //                 </div>
// //               </div>
              
// //               {company.location && (
// //                 <>
// //                   <iframe
// //                     className="mt-4 h-56 w-full rounded-md border"
// //                     title="map"
// //                     src={`https://www.openstreetmap.org/export/embed.html?bbox=${company.location.lng - 0.01}%2C${company.location.lat - 0.01}%2C${company.location.lng + 0.01}%2C${company.location.lat + 0.01}&layer=mapnik&marker=${company.location.lat}%2C${company.location.lng}`}
// //                   />
// //                   <a
// //                     className="mt-2 block text-xs text-primary hover:underline"
// //                     href={`https://www.openstreetmap.org/?mlat=${company.location.lat}&mlon=${company.location.lng}#map=16/${company.location.lat}/${company.location.lng}`}
// //                     target="_blank"
// //                     rel="noreferrer"
// //                   >
// //                     Open in map
// //                   </a>
// //                 </>
// //               )}
// //             </CardContent>
// //           </Card>
// //         </section>
// //       )}
// //     </div>
// //   );
// // }
// import { useEffect, useState } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Printer, Info, MapPin, Clock } from "lucide-react";
// import { haversineKm } from "@/data/shops";
// import {
//   getCompanyByName,
//   createPrint,
//   getClientId,
//   getClientByClientId,
//   createClient,
//   updateClient,
//   updatePrint,
//   createHistory,
//   getPrintById,
//   updateQueue,
//   getQueueForCompany,
//   getClientQueuedPrints,
// } from "../../Functions.js";
// import Uploader from "@/components/ui/uploader";
// import { toast } from "sonner";
// import PrintInformation from "@/components/Includes/PrintInformation";
// import { useSocket } from "@/contexts/SocketContext";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { debugMode } from "../../Constants";

// export default function CompanyPage() {
//   const { name } = useParams();
//   const navigate = useNavigate();
//   const { socket, connected } = useSocket();
//   // gate verbose logs using debugMode from Constants
//   // require used to avoid top-level ESM/TS import issues in this file
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
  
//   const [company, setCompany] = useState<any | null>(null);
//   const [client, setClient] = useState<any | null>(null);
//   const [print, setPrint] = useState<any | null>(null);
//   const [creating, setCreating] = useState(false);
//   const [showPrintInformation, setShowPrintInformation] = useState(false);
//   const [printPreferences, setPrintPreferences] = useState<any | null>(null);
//   const [codeInput, setCodeInput] = useState("");
//   const [onSiteByCode, setOnSiteByCode] = useState(false);
//   const [isNearShop, setIsNearShop] = useState(false);
//   const [nearbyAndFloat, setNearbyAndFloat] = useState(false);
//   const [km, setKm] = useState<number | null>(null);
//   const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
//   const [hasJob, setHasJob] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [scheduling, setScheduling] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [scheduled, setScheduled] = useState(false);
//   const [floatOK, setFloatOK] = useState(true);
//   const [queueTotal, setQueueTotal] = useState<number>(0);
//   // Socket-related state - UPDATED for print-based queue
//   const [printStatus, setPrintStatus] = useState<string | null>(null);
//   const [queueSize, setQueueSize] = useState<number>(0);
//   const [clientPrints, setClientPrints] = useState<any[]>([]);
  
//   // NEW: Track multiple print positions
//   const [myPrintPositions, setMyPrintPositions] = useState<Array<{
//     printId: number;
//     position: number;
//     orderId: string;
//   }>>([]);
//   const [myQueuedPrints, setMyQueuedPrints] = useState<any[]>([]);

//   const [tab, setTab] = useState<"activity" | "print" | "about">("activity");
//   const location = useLocation();

//   const [submitModalOpen, setSubmitModalOpen] = useState(false);
//   const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
//   const [scheduleTime, setScheduleTime] = useState<string>("");
//   const [modalCodeInput, setModalCodeInput] = useState("");
//   const [checkingLocation, setCheckingLocation] = useState(false);
//   const [isModalOnSite, setIsModalOnSite] = useState(isNearShop);

//   // UPDATED: Queue now tracks prints instead of clients
//   const [queue, setQueue] = useState<any | null>(null);

//   useEffect(() => {
//     const h = (location.hash || "#activity").replace("#", "");
//     if (h === "print" || h === "activity" || h === "about") setTab(h);
//   }, [location.hash]);

//   // Fetch company and queue with PRINTS (not clients)
//   useEffect(() => {
//     (async () => {
//       try {
//         const c = await getCompanyByName(String(name), { 
//           params: 'populate=queue,queue.prints,queue.prints.client' 
//         });
//         setCompany(c);
//         setFloatOK((typeof c.float_balance === "number" ? c.float_balance : 0) > 0);
        
//         if (c.queue && c.queue.prints) {
//           setQueue(c.queue);
//           const printsArray = Array.isArray(c.queue.prints) ? c.queue.prints : [];
//           setQueueSize(printsArray.length);
//         }
//       } catch (error) {
//         console.error('Error fetching company:', error);
//         toast.error('Company not found');
//       }
//     })();
//   }, [name]);

//   // Fetch queue for company - NOW FETCHES PRINTS
//   // useEffect(() => {
//   //   if (!company?.id) return;
//   //   const fetchQueue = async () => {
//   //     try {
//   //       const queueData = await getQueueForCompany(company.id, { 
//   //         params: 'populate=prints,prints.client' 
//   //       });
        
//   //       if (queueData && queueData.prints) {
//   //         setQueue(queueData);
//   //         const printsArray = Array.isArray(queueData.prints) ? queueData.prints : [];
//   //         setQueueSize(printsArray.length);
          
//   //         if (debugMode) console.log('[CompanyPage] Queue fetched:', {
//   //           totalPrints: printsArray.length,
//   //           prints: printsArray
//   //         });
//   //       } else {
//   //         setQueue(null);
//   //         setQueueSize(0);
//   //       }
//   //     } catch (error) {
//   //       console.error('[CompanyPage] Error fetching queue:', error);
//   //       setQueue(null);
//   //       setQueueSize(0);
//   //     }
//   //   };
//   //   fetchQueue();
//   // }, [company?.id]);

//   // Fetch queue for company - CONSISTENT PRINT-BASED QUEUE
// useEffect(() => {
//   if (!company?.id) return;
  
//   const fetchQueue = async () => {
//     try {
//       const queueData = await getQueueForCompany(company.id, { 
//         params: 'populate=prints,prints.client,prints.pdf_file' 
//       });
      
//       if (queueData && queueData.prints) {
//         const printsArray = Array.isArray(queueData.prints) ? queueData.prints : [];
//         setQueueSize(printsArray.length);
        
//         console.log('[CompanyPage] Queue fetched:', {
//           totalPrints: printsArray.length,
//           prints: printsArray.map(p => ({ id: p.id, client: p.client?.id }))
//         });
//       } else {
//         setQueueSize(0);
//       }
//     } catch (error) {
//       console.error('[CompanyPage] Error fetching queue:', error);
//       setQueueSize(0);
//     }
//   };
  
//   fetchQueue();
// }, [company?.id]);

//   // NEW: Fetch all queued prints for this client
//   useEffect(() => {
//     const fetchMyQueuedPrints = async () => {
//       if (!client?.id || !company?.id) return;
      
//       try {
//         const prints = await getClientQueuedPrints(client.id, company.id);
//         setMyQueuedPrints(prints || []);
//         setHasJob(prints && prints.length > 0);
        
//         console.log('[CompanyPage] My queued prints:', prints);
//       } catch (error) {
//         console.error('[CompanyPage] Error fetching queued prints:', error);
//         setMyQueuedPrints([]);
//       }
//     };

//     fetchMyQueuedPrints();
//   }, [client?.id, company?.id]);

//   // Calculate proximity and nearbyAndFloat
//   useEffect(() => {
//     if (!company) return;

//     const calculateProximity = async () => {
//       // Check code first - CODE VALIDATION HAS PRIORITY
//       let codeValid = false;
//       if (codeInput.length === 4 && company?.id) {
//         try {
//           const refreshed = await getCompanyByName(String(company.name));
//           codeValid = parseInt(String(refreshed?.printCode)) === parseInt(codeInput);
//         } catch {
//           codeValid = false;
//         }
//       }
//       setOnSiteByCode(codeValid);

//       // Calculate distance
//       let kmValue: number | null = null;
//       if (coords && company.location) {
//         kmValue = haversineKm(coords, { 
//           lat: company.location.lat, 
//           lon: company.location.lng 
//         });
//       }
//       setKm(kmValue);
      
//       const radiusKm = (company.radiusConsideredNearInMeters || 500) / 1000;
//       const nearByDistance = kmValue !== null && kmValue <= radiusKm;
      
//       // User is considered "near" if EITHER code is valid OR within radius
//       const nearCheck = codeValid || nearByDistance;
//       setIsNearShop(nearCheck);
      
//       // Can submit if near (by code OR distance) AND float is OK
//       setNearbyAndFloat(floatOK && nearCheck);
//     };

//     calculateProximity();
//   }, [coords, company, codeInput, floatOK]);

//   // Get user coordinates
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) =>
//           setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
//         () => setCoords(null),
//         { enableHighAccuracy: true, timeout: 8000 },
//       );
//     }
//   }, []);

//   // Ensure client exists and keep location updated
//   useEffect(() => {
//     (async () => {
//       if (!company) return;
//       try {
//         const cid = getClientId();
//         if (!cid) return;
        
//         let existing = await getClientByClientId(cid);
//         if (!existing) {
//           existing = await createClient({
//             clientId: cid,
//             currentLocation: coords
//               ? { lat: coords.lat, lng: coords.lon }
//               : undefined,
//           });
//         } else if (coords) {
//           // Update client location
//           await updateClient(existing.id, {
//             currentLocation: { lat: coords.lat, lng: coords.lon }
//           });
//         }
//         setClient(existing);
//       } catch (error) {
//         console.error('Error managing client:', error);
//       }
//     })();
//   }, [company?.id, coords]);

//   // Create draft print
//   useEffect(() => {
//     (async () => {
//       if (!company || !client || print || creating) return;

//       try {
//         setCreating(true);
//         const printId = localStorage.getItem("printId");
//         if (printId) {
//           const currentPrint = await getPrintById(printId, "populate=pdf_file");
//           if (currentPrint?.pdf_file?.data) {
//             setShowPrintInformation(true);
//           }
//           setPrint(currentPrint);
          
//           // Check if already submitted/scheduled
//           if (currentPrint?.state === "queued" || currentPrint?.state === "scheduled") {
//             setHasJob(true);
//             if (currentPrint?.state === "queued") setSubmitted(true);
//             if (currentPrint?.state === "scheduled") setScheduled(true);
//           }
//         } else {
//           const draft = await createPrint({
//             dataFields: {
//               cost_per_page: company.cost_per_page,
//               cost_per_copy: company.cost_per_copy,
//               client: Number(client.id),
//               company: Number(company.id),
//             },
//           });
//           localStorage.setItem("printId", String(draft.id));
//           setPrint(await getPrintById(draft.id, "populate=pdf_file"));
//         }
//       } catch (error) {
//         console.error('Error creating print:', error);
//       } finally {
//         setCreating(false);
//       }
//     })();
//   }, [client?.id, company?.id, print]);

//   // ============ SOCKET INTEGRATION ============
  
//   // Join client room and watch company queue
//   useEffect(() => {
//     if (!socket || !connected || !client?.clientId || !company?.id) return;

//     const clientId = client.clientId;
//     const companyId = company.id;

//     // Join client room
//     socket.emit('client:join', { clientId });
//     console.log('[CompanyPage] Joined client room:', clientId);

//     // Watch company queue
//     socket.emit('queue:watch', { companyId });
//     console.log('[CompanyPage] Watching queue for company:', companyId);

//     // Handle queue updates
//     const handleQueueUpdate = (data: any) => {
//       if (String(data.companyId) !== String(companyId)) return;
//       setQueueSize(data.queue?.total || 0);

//       // Update client's prints positions
//       if (data.queue?.prints) {
//         const clientPrints = data.queue.prints.filter((p: any) => 
//           String(p.clientId) === String(clientId)
//         );
//         setClientPrints(clientPrints);

//         // Update current print's position if it exists
//         if (print?.id) {
//           const currentPrint = data.queue.prints.find((p: any) => 
//             String(p.id) === String(print.id)
//           );
//           if (currentPrint) {
//             setPrint(prev => ({
//               ...prev,
//               queue_position: currentPrint.position
//             }));
//           }
//         }
//       }
//     };

//     // Handle client-specific positions
//     const handleQueuePosition = (data: any) => {
//       if (String(data.companyId) !== String(companyId)) return;
//       if (String(data.clientId) !== String(clientId)) return;
      
//       // Update positions for all client's prints
//       setClientPrints(data.prints || []);
      
//       // Update current print if it exists
//       if (print?.id) {
//         const currentPrint = data.prints?.find((p: any) => 
//           String(p.printId) === String(print.id)
//         );
//         if (currentPrint) {
//           setPrint(prev => ({
//             ...prev,
//             queue_position: currentPrint.position
//           }));
//         }
//       }
//     };

//     socket.on('queue:updated', handleQueueUpdate);
//     socket.on('queue:position', handleQueuePosition);

//     // Initial queue fetch
//     const fetchQueue = async () => {
//       try {
//         const queueData = await getQueueForCompany(companyId, { params: 'populate=prints,clients' });
//         if (queueData) {
//           setQueueSize(queueData.prints?.length || 0);
          
//           const clientPrints = queueData.prints?.filter((p: any) => 
//             String(p.client?.clientId) === String(clientId)
//           ) || [];
//           setClientPrints(clientPrints);
//         }
//       } catch (error) {
//         console.error('[CompanyPage] Error fetching queue:', error);
//       }
//     };

//     fetchQueue();

//     return () => {
//       if (socket && connected) {
//         socket.off('queue:updated', handleQueueUpdate);
//         socket.off('queue:position', handleQueuePosition);
//         socket.emit('queue:unwatch', { companyId });
//         console.log('[CompanyPage] Stopped watching queue');
//       }
//     };
//   }, [socket, connected, client?.clientId, company?.id, print?.id]);

//   // UPDATED: Socket event listeners for print-based queue
//   useEffect(() => {
//     if (!socket || !connected) return;

//     // Shared queue refetch function - NOW FETCHES PRINTS
//     const fetchQueue = async () => {
//       if (!company?.id) return;
//       try {
//         const queueData = await getQueueForCompany(company.id, { 
//           params: 'populate=prints,prints.client' 
//         });
        
//         if (queueData && queueData.prints) {
//           setQueue(queueData);
//           const printsArray = Array.isArray(queueData.prints) ? queueData.prints : [];
//           setQueueSize(printsArray.length);
          
//           console.log('[CompanyPage] Queue fetched:', {
//             totalPrints: printsArray.length,
//             prints: printsArray
//           });
//         } else {
//           setQueue(null);
//           setQueueSize(0);
//         }
//       } catch (error) {
//         console.error('[CompanyPage] Error fetching queue:', error);
//         setQueue(null);
//         setQueueSize(0);
//       }
//     };

//     // Refetch client's queued prints
//     const fetchMyPrints = async () => {
//       if (!client?.id || !company?.id) return;
//       try {
//         const prints = await getClientQueuedPrints(client.id, company.id);
//         setMyQueuedPrints(prints || []);
//         setHasJob(prints && prints.length > 0);
//       } catch (error) {
//         console.error('[CompanyPage] Error refetching client prints:', error);
//       }
//     };

//     const handleClientConnected = (data: any) => {
//       console.log('[CompanyPage] Client connected:', data);
//     };

//     // UPDATED: Handle multiple print positions
//     const handleQueuePosition = (data: any) => {
//       console.log('[CompanyPage] Queue position update:', data);
      
//       // data.prints is now an array of {printId, position, orderId}
//       if (data.prints && Array.isArray(data.prints)) {
//         setMyPrintPositions(data.prints);
        
//         // Show toast with position info
//         if (data.prints.length === 1) {
//           toast.info(`Queue Position: ${data.prints[0].position} of ${data.total}`, {
//             description: `Order ${data.prints[0].orderId} - Est. wait: ~${data.prints[0].position * 5} min`,
//           });
//         } else {
//           const positions = data.prints.map((p: any) => p.position).join(', ');
//           toast.info(`Your prints at positions: ${positions}`, {
//             description: `${data.prints.length} prints in queue`,
//           });
//         }
//       }
      
//       setQueueTotal(data.total);
//     };

//     const handleQueueUpdated = async (data: any) => {
//       console.log('[CompanyPage] Queue updated:', data);
      
//       // Update queue size immediately from the event
//       if (data.queue?.total !== undefined) {
//         setQueueSize(data.queue.total);
//       }
      
//       // Refetch full queue data with all print details
//       await fetchQueue();
//       await fetchMyPrints();
//     };

//     const handlePrintQueued = async (data: any) => {
//       console.log('[CompanyPage] Print queued event:', data);
      
//       // Show notification for own print
//       if (data.printId === print?.id) {
//         setPrintStatus('queued');
        
//         toast.success('Print submitted successfully!', {
//           description: data.orderId ? `Order ID: ${data.orderId}` : 'Added to queue',
//         });
        
//         if ('Notification' in window && Notification.permission === 'granted') {
//           new Notification('Print Queued', {
//             body: `Your print job has been added to the queue`,
//             icon: '/logo.png',
//           });
//         }
//       }
      
//       // CRITICAL: Refetch queue for ALL clients when ANY print is queued
//       await fetchQueue();
//       await fetchMyPrints();
//     };

//     const handlePrintScheduled = (data: any) => {
//       if (data.printId === print?.id) {
//         console.log('[CompanyPage] Your print was scheduled!');
//         setPrintStatus('scheduled');
        
//         toast.success('Print scheduled successfully!', {
//           description: data.scheduledTime 
//             ? `Scheduled for ${new Date(data.scheduledTime).toLocaleString()}`
//             : 'Print has been scheduled',
//         });
//       }
//     };

//     const handlePrintPrinting = async (data: any) => {
//       console.log('[CompanyPage] Print printing event:', data);
      
//       if (data.printId === print?.id) {
//         setPrintStatus('printing');
        
//         toast.info('Printing started', {
//           description: 'Your document is now being printed',
//           duration: 5000,
//         });
        
//         if ('Notification' in window && Notification.permission === 'granted') {
//           new Notification('Printing Started', {
//             body: `${data.fileName} is now being printed`,
//             icon: '/logo.png',
//           });
//         }
//       }
      
//       // Refetch queue as print may have been removed
//       await fetchQueue();
//     };

//     const handlePrintCompleted = async (data: any) => {
//       console.log('[CompanyPage] Print completed event:', data);
      
//       if (data.printId === print?.id) {
//         setPrintStatus('completed');
        
//         toast.success('Print completed!', {
//           description: 'Your document is ready for pickup',
//           duration: 10000,
//         });
        
//         if ('Notification' in window && Notification.permission === 'granted') {
//           new Notification('Print Ready!', {
//             body: `${data.fileName} is ready for pickup`,
//             icon: '/logo.png',
//             requireInteraction: true,
//           });
//         }
        
//         // Clear local print data
//         localStorage.removeItem('printId');
//         setHasJob(false);
//         setSubmitted(false);
//         setScheduled(false);
//         setPrint(null);
//         setShowPrintInformation(false);
//       }
      
//       // Remove completed print from myPrintPositions
//       setMyPrintPositions(prev => prev.filter(p => p.printId !== data.printId));
      
//       // Refetch queue and client's prints
//       await fetchQueue();
//       await fetchMyPrints();
//     };

//     const handlePrintCanceled = async (data: any) => {
//       console.log('[CompanyPage] Print canceled event:', data);
      
//       if (data.printId === print?.id) {
//         setPrintStatus('canceled');
        
//         toast.error('Print canceled', {
//           description: data.reason || 'The print job was canceled',
//         });
        
//         // Clear local print data
//         localStorage.removeItem('printId');
//         setHasJob(false);
//         setSubmitted(false);
//         setScheduled(false);
//         setPrint(null);
//         setShowPrintInformation(false);
//       }
      
//       // Remove from myPrintPositions
//       setMyPrintPositions(prev => prev.filter(p => p.printId !== data.printId));
      
//       // Refetch queue and client's prints
//       await fetchQueue();
//       await fetchMyPrints();
//     };

//     const handleCompanyUnavailable = (data: any) => {
//       if (data.companyId === company?.id) {
//         console.log('[CompanyPage] Company became unavailable');
//         toast.warning('Company unavailable', {
//           description: data.reason === 'float_depleted' 
//             ? 'Company has run out of float balance'
//             : 'Company is currently unavailable',
//         });
        
//         setFloatOK(false);
//       }
//     };

//     const handleCompanyFloatToppedUp = (data: any) => {
//       if (data.companyId === company?.id) {
//         console.log('[CompanyPage] Company float topped up');
//         toast.success('Company float replenished', {
//           description: 'You can now submit prints immediately',
//         });
        
//         setFloatOK(true);
//       }
//     };

//     // Register all event listeners
//     socket.on('client:connected', handleClientConnected);
//     socket.on('queue:position', handleQueuePosition);
//     socket.on('queue:updated', handleQueueUpdated);
//     socket.on('print:queued', handlePrintQueued);
//     socket.on('print:scheduled', handlePrintScheduled);
//     socket.on('print:printing', handlePrintPrinting);
//     socket.on('print:completed', handlePrintCompleted);
//     socket.on('print:canceled', handlePrintCanceled);
//     socket.on('company:unavailable', handleCompanyUnavailable);
//     socket.on('company:float-topped-up', handleCompanyFloatToppedUp);

//     // Cleanup
//     return () => {
//       socket.off('client:connected', handleClientConnected);
//       socket.off('queue:position', handleQueuePosition);
//       socket.off('queue:updated', handleQueueUpdated);
//       socket.off('print:queued', handlePrintQueued);
//       socket.off('print:scheduled', handlePrintScheduled);
//       socket.off('print:printing', handlePrintPrinting);
//       socket.off('print:completed', handlePrintCompleted);
//       socket.off('print:canceled', handlePrintCanceled);
//       socket.off('company:unavailable', handleCompanyUnavailable);
//       socket.off('company:float-topped-up', handleCompanyFloatToppedUp);
//     };
//   }, [socket, connected, print?.id, company?.id, client?.id]);

//   // POLLING BACKUP - Remove once sockets work reliably
// useEffect(() => {
//   if(socket && connected){
//     return
//   }
//   if (!company?.id || !client?.id) return;
  
//   console.log('[CompanyPage] Starting polling backup...');
  
//   const pollInterval = setInterval(async () => {
//       try {
//       // Poll queue data
//       const queueData = await getQueueForCompany(company.id, { 
//         params: 'populate=prints,prints.client' 
//       });
      
//       if (queueData && queueData.prints) {
//         if (debugMode) console.log('[POLLING] Queue has', queueData.prints.length, 'prints');
//         setQueue(queueData);
//         const printsArray = Array.isArray(queueData.prints) ? queueData.prints : [];
//         setQueueSize(printsArray.length);
//       } else {
//         if (debugMode) console.log('[POLLING] No queue data');
//         setQueue(null);
//         setQueueSize(0);
//       }
      
//       // Poll client's prints
//       const myPrints = await getClientQueuedPrints(client.id, company.id);
//   if (debugMode) console.log('[POLLING] My prints:', myPrints.length);
//       setMyQueuedPrints(myPrints || []);
//       setHasJob(myPrints && myPrints.length > 0);
      
//       // Calculate positions
//       if (queueData && queueData.prints && myPrints.length > 0) {
//         const positions = myPrints.map(myPrint => {
//           const position = queueData.prints.findIndex((p: any) => p.id === myPrint.id) + 1;
//           return {
//             printId: myPrint.id,
//             position: position > 0 ? position : 999,
//             orderId: myPrint.order_id || `#${myPrint.id}`
//           };
//         }).filter(p => p.position < 999);
        
//         if (debugMode) console.log('[POLLING] Calculated positions:', positions);
//         setMyPrintPositions(positions);
//       }
      
//     } catch (error) {
//       if (debugMode) console.error('[POLLING] Error:', error);
//     }
//   }, 3000); // Poll every 3 seconds
  
//   return () => {
//     console.log('[CompanyPage] Stopping polling backup');
//     clearInterval(pollInterval);
//   };
// }, [company?.id, client?.id]);

//   // ============ HANDLERS ============

//   const handleCheckLocation = () => {
//     setCheckingLocation(true);
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//           // Recalculate proximity
//           if (company && pos.coords) {
//             const kmValue = haversineKm(
//               { lat: pos.coords.latitude, lon: pos.coords.longitude },
//               { lat: company.location.lat, lon: company.location.lng }
//             );
//             const radiusKm = (company.radiusConsideredNearInMeters || 500) / 1000;
//             setIsModalOnSite(kmValue <= radiusKm);
//           }
//           setCheckingLocation(false);
//         },
//         () => setCheckingLocation(false),
//         { enableHighAccuracy: true, timeout: 8000 },
//       );
//     }
//   };

//   const handleSubmit = async () => {
//     if (!print || !printPreferences) return;
//     // Only allow if onsite or code is valid
//     if (!isModalOnSite && (!modalCodeInput || modalCodeInput.length !== 4)) return;
//     const updateObject = {
//       file_pages_count: printPreferences.pages,
//       copies_requested: printPreferences.copies,
//       cost_per_page: printPreferences.perPageRate,
//       cost_per_copy: printPreferences.costPerCopy,
//       final_cost_amount: printPreferences.totalCost,
//       laminated: printPreferences.laminated,
//       colored: printPreferences.colored,
//       bound: printPreferences.bound,
//       state: "queued",
//       printCode: modalCodeInput || undefined,
//     };
//     setSubmitting(true);
//     try {
//       await updatePrint(Number(print.id), updateObject);
//       setHasJob(true);
//       setSubmitted(true);
//       toast.success("Submitted for immediate printing");
//       createHistory({
//         activity: "submitted print",
//         activityBody: `You submitted a print #${print.id}`,
//         client: client ? Number(client.id) : undefined,
//         user: null,
//       });
//       localStorage.removeItem("printId");
//       setTab("activity");
//       setSubmitModalOpen(false);
//     } catch (error) {
//       console.error('Error submitting print:', error);
//       toast.error('Failed to submit print');
//       setSubmitted(false);
//     } finally {
//       setSubmitting(false);
//     }
//   };
  
//   const handleSchedulePrint = async () => {
//     if (!print || !printPreferences || !scheduleTime) return;
//     const updateObject = {
//       file_pages_count: printPreferences.pages,
//       copies_requested: printPreferences.copies,
//       cost_per_page: printPreferences.perPageRate,
//       cost_per_copy: printPreferences.costPerCopy,
//       final_cost_amount: printPreferences.totalCost,
//       laminated: printPreferences.laminated,
//       colored: printPreferences.colored,
//       bound: printPreferences.bound,
//       state: "scheduled",
//       scheduled: true,
//       scheduled_time: scheduleTime,
//     };
//     setScheduling(true);
//     try {
//       await updatePrint(Number(print.id), updateObject);
//       setHasJob(true);
//       setScheduled(true);
//       toast("Scheduled successfully");
//       createHistory({
//         activity: "scheduled print",
//         activityBody: `You scheduled a print #${print.id}`,
//         client: client ? Number(client.id) : undefined,
//         user: null,
//       });
//       localStorage.removeItem("printId");
//       setTab("activity");
//       setScheduleModalOpen(false);
//     } catch (error) {
//       console.error('Error scheduling print:', error);
//       toast.error('Failed to schedule print');
//       setScheduled(false);
//     } finally {
//       setScheduling(false);
//     }
//   };

//   // UPDATED: Render multiple print positions
//   const renderQueuePositions = () => {
//     if (!myPrintPositions || myPrintPositions.length === 0) {
//       return (
//         <div className="mt-4 text-sm text-muted-foreground">
//           You have no prints in the queue
//         </div>
//       );
//     }

//     // Single print - simple display
//     if (myPrintPositions.length === 1) {
//       const print = myPrintPositions[0];
//       return (
//         <div className="mt-4 text-sm">
//           Your Position:{" "}
//           <span className="font-semibold">{print.position}</span>
//           {print.orderId && (
//             <span className="ml-2 text-xs text-muted-foreground">
//               (Order {print.orderId})
//             </span>
//           )}
//         </div>
//       );
//     }

//     // Multiple prints - detailed list
//     return (
//       <div className="mt-4">
//         <div className="text-sm font-medium mb-2">Your Positions:</div>
//         <div className="space-y-2">
//           {myPrintPositions.map((print) => (
//             <div 
//               key={print.printId} 
//               className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
//             >
//               <div className="flex items-center gap-2">
//                 <Badge variant="outline" className="font-mono text-xs">
//                   {print.orderId || `#${print.printId}`}
//                 </Badge>
//               </div>
//               <div className="flex items-center gap-2 text-sm">
//                 <span className="text-muted-foreground">Position:</span>
//                 <span className="font-semibold">{print.position}</span>
//                 <span className="text-xs text-muted-foreground">
//                   (~{print.position * 5} min)
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   if (!company) {
//     return (
//       <section className="container py-10">
//         <Button onClick={() => navigate(-1)} className="mb-4">
//           Back
//         </Button>
//         <Card>
//           <CardHeader>
//             <CardTitle>Company not found</CardTitle>
//             <CardDescription>It may have been removed.</CardDescription>
//           </CardHeader>
//         </Card>
//       </section>
//     );
//   }
  
//   // UPDATED: Calculate estimated wait from print positions
//   const estWait = myPrintPositions.length > 0
//     ? Math.min(...myPrintPositions.map(p => p.position)) * 5
//     : queueSize * 2;

//   return (
//     <div className="pb-20">
//       <header className="border-b bg-background">
//         <div className="container flex h-14 items-center justify-between">
//           <div className="font-semibold truncate">{company.name}</div>
//           <div className="flex items-center gap-2">
//             <Badge variant="secondary">Queue {queueSize} prints</Badge>
//             {connected && (
//               <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
//             )}
//           </div>
//         </div>
//       </header>

//       {tab === "activity" && (
//         <section className="container py-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Activity</CardTitle>
//               <CardDescription>
//                 Live queue and your jobs with this company.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center justify-between text-sm">
//                 <span>Queue size</span>
//                 <span>{queueSize} prints</span>
//               </div>
//               <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
//                 <div
//                   className="h-full rounded-full bg-primary transition-all duration-500"
//                   style={{ 
//                     width: `${Math.min(100, (myPrintPositions.length / Math.max(queueSize, 1)) * 100)}%` 
//                   }}
//                 />
//               </div>
//               <div className="mt-4 text-sm">
//                 Estimated wait time:{" "}
//                 <span className="font-semibold">~{estWait} min</span>
//               </div>
              
//               {renderQueuePositions()}
              
//               {myPrintPositions.length > 0 ? (
//                 <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
//                   <div className="text-sm text-green-900 dark:text-green-100 font-medium">
//                     {myPrintPositions.length} {myPrintPositions.length === 1 ? 'job' : 'jobs'} in queue
//                   </div>
//                 </div>
//               ) : (
//                 <div className="mt-4 text-sm text-muted-foreground">
//                   No active jobs.
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </section>
//       )}

//       {tab === "print" && (
//         <section className="container py-6">
//           <Card>
//             <CardHeader>
//               <div className="flex flex-col space-y-4">
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="flex items-center gap-2">
//                     <Printer className="h-5 w-5" /> Print
//                   </CardTitle>
//                   <div className="flex items-center gap-4">
//                     <Badge variant="secondary">Queue: {queueSize}</Badge>
//                     {print?.queue_position && (
//                       <Badge variant="outline" className="font-mono">Position #{print.queue_position}</Badge>
//                     )}
//                   </div>
//                 </div>
//                 <CardDescription>
//                   Upload files and submit. Enter the 4-digit code or be within {company.radiusConsideredNearInMeters || 500}m 
//                   to submit immediately; otherwise schedule.
//                 </CardDescription>
//                 <div className="text-sm text-muted-foreground">
//                   You can submit multiple prints and each will have its own position in the queue.
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {print ? (
//                 <Uploader
//                   refId={print.id}
//                   refName="api::print.print"
//                   fieldName="file"
//                   allowedTypes={[
//                     "image/jpeg",
//                     "image/png",
//                     "image/gif",
//                     "application/pdf",
//                     "application/msword",
//                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//                     "application/vnd.ms-excel",
//                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//                     "application/vnd.ms-powerpoint",
//                     "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//                     "application/vnd.oasis.opendocument.text",
//                     "application/vnd.oasis.opendocument.spreadsheet",
//                     "application/vnd.oasis.opendocument.presentation",
//                     "text/plain",
//                     "application/rtf",
//                     "text/html",
//                     "application/xml",
//                     "text/xml",
//                     "text/csv",
//                   ]}
//                   onUploaded={async (res) => {
//                     setHasJob(true);
//                     toast("File uploaded");
//                     const printWithNewFile = await getPrintById(print.id, "populate=pdf_file");
//                     setPrint(printWithNewFile);
//                     setShowPrintInformation(true);
//                     const fileName =
//                       Array.isArray(res) && res[0]?.name ? res[0].name : "file";
//                     try {
//                       createHistory({
//                         activity: "uploaded file",
//                         activityBody: `You uploaded ${fileName}`,
//                         client: client ? Number(client.id) : undefined,
//                         user: null,
//                       });
//                     } catch {}
//                     if (Notification?.permission === "granted") {
//                       new Notification("Upload completed", {
//                         body: `${fileName} ready`,
//                       });
//                     }
//                   }}
//                 />
//               ) : (
//                 <div className="flex h-44 w-full items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
//                   Preparing uploader...
//                 </div>
//               )}

//               {print && showPrintInformation ? (
//                 <PrintInformation
//                   setPrintPreferences={setPrintPreferences}
//                   draftPrint={print}
//                   company={company}
//                 />
//               ) : null}

//               <div className="mt-4 flex flex-col gap-2">
//                 {print?.state === "queued" || print?.state === "scheduled" ? (
//                   <div className="flex flex-wrap gap-2">
//                     <Button disabled={true}>
//                       {print?.state === "queued" ? "Submitted" : "Scheduled"}
//                     </Button>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     <div className="flex flex-wrap gap-2">
//                       <Button
//                         disabled={submitted || submitting || !print || !printPreferences}
//                         onClick={() => setSubmitModalOpen(true)}
//                       >
//                         {submitted ? "Submitted" : submitting ? "Submitting..." : "Submit now"}
//                       </Button>
//                       {company.allowsPrintScheduling ? (
//                         <Button 
//                           disabled={scheduled || scheduling || !print || !printPreferences} 
//                           variant="secondary" 
//                           onClick={() => setScheduleModalOpen(true)}
//                         >
//                           {scheduled ? "Scheduled" : scheduling ? "Scheduling..." : "Schedule print"}
//                         </Button>
//                       ) : null}
//                     </div>
                    
//                     {clientPrints.length > 0 && (
//                       <div className="border rounded p-3 space-y-2">
//                         <h3 className="text-sm font-medium">Your Prints in Queue:</h3>
//                         <div className="flex flex-wrap gap-2">
//                           {clientPrints.map((p) => (
//                             <Badge key={p.printId} variant="outline" className="font-mono">
//                               {p.orderId ? `${p.orderId} - ` : ''}Position #{p.position}
//                             </Badge>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//           {/* Submit Modal */}
//           <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
//             <DialogContent className="max-w-md">
//               <DialogHeader>
//                 <DialogTitle>Confirm Print Submission</DialogTitle>
//               </DialogHeader>
//               {!isModalOnSite && (
//                 <div className="mb-4 text-red-600 font-semibold">You seem to be far from the shop</div>
//               )}
//               {!isModalOnSite && (
//                 <Button
//                   variant="outline"
//                   className="mb-2"
//                   onClick={handleCheckLocation}
//                   disabled={checkingLocation}
//                 >
//                   {checkingLocation ? "Checking..." : "Check my current location"}
//                 </Button>
//               )}
//               {!isModalOnSite && (
//                 <input
//                   type="text"
//                   maxLength={4}
//                   value={modalCodeInput}
//                   onChange={(e) => setModalCodeInput(e.target.value.replace(/\D/g, ''))}
//                   placeholder="Enter 4-digit code from shop"
//                   className="w-full rounded border px-3 py-2 text-center text-sm font-mono mb-2"
//                 />
//               )}
//               {!isModalOnSite && (
//                 <div className="text-xs text-muted-foreground mb-2">
//                   Get a code from the shop and use it to print now or schedule if you are not onsite
//                 </div>
//               )}
//               <div className="flex justify-center gap-4 mt-6">
//                 <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button
//                   onClick={handleSubmit}
//                   disabled={submitting || (!isModalOnSite && (!modalCodeInput || modalCodeInput.length !== 4))}
//                 >
//                   Confirm
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//           {/* Schedule Modal with Time Picker */}
//           <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
//             <DialogContent className="max-w-md">
//               <DialogHeader>
//                 <DialogTitle>Schedule Print Pickup</DialogTitle>
//               </DialogHeader>
//               <div className="mb-4">
//                 <input
//                   type="time"
//                   value={scheduleTime}
//                   onChange={e => setScheduleTime(e.target.value)}
//                   className="w-full rounded border px-3 py-2 text-center text-sm font-mono mb-2"
//                 />
//               </div>
//               <div className="flex justify-center gap-4 mt-6">
//                 <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button
//                   onClick={handleSchedulePrint}
//                   disabled={scheduling || !scheduleTime}
//                 >
//                   Confirm
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </section>
//       )}

//       {tab === "about" && (
//         <section className="container py-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Info className="h-5 w-5" /> About
//               </CardTitle>
//               <CardDescription>
//                 Location and details for this company.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   <MapPin className="h-4 w-4" /> 
//                   <span>
//                     lat {company.location?.lat?.toFixed(5)}, lon {company.location?.lng?.toFixed(5)}
//                   </span>
//                 </div>
//                 <div>
//                   <strong>Proximity radius:</strong> {company.radiusConsideredNearInMeters || 500}m
//                 </div>
//                 <div>
//                   <strong>Company code:</strong> Available on-site
//                 </div>
//                 <div className="pt-3 mt-3 border-t">
//                   <div className="text-xs text-muted-foreground">
//                     <strong>Queue System:</strong> Each print job is tracked individually. 
//                     You can submit multiple prints and each will have its own position in the queue.
//                   </div>
//                 </div>
//               </div>
              
//               {company.location && (
//                 <>
//                   <iframe
//                     className="mt-4 h-56 w-full rounded-md border"
//                     title="map"
//                     src={`https://www.openstreetmap.org/export/embed.html?bbox=${company.location.lng - 0.01}%2C${company.location.lat - 0.01}%2C${company.location.lng + 0.01}%2C${company.location.lat + 0.01}&layer=mapnik&marker=${company.location.lat}%2C${company.location.lng}`}
//                   />
//                   <a
//                     className="mt-2 block text-xs text-primary hover:underline"
//                     href={`https://www.openstreetmap.org/?mlat=${company.location.lat}&mlon=${company.location.lng}#map=16/${company.location.lat}/${company.location.lng}`}
//                     target="_blank"
//                     rel="noreferrer"
//                   >
//                     Open in map
//                   </a>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         </section>
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, Info, MapPin, Clock } from "lucide-react";
import { haversineKm } from "@/data/shops";
import {
  getCompanyByName,
  createPrint,
  getClientId,
  getClientByClientId,
  createClient,
  updateClient,
  updatePrint,
  createHistory,
  getPrintById,
  updateQueue,
  getQueueForCompany,
  getClientQueuedPrints,
} from "../../Functions.js";
import Uploader from "@/components/ui/uploader";
import { toast } from "sonner";
import PrintInformation from "@/components/Includes/PrintInformation";
import { useSocket } from "@/contexts/SocketContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { debugMode } from "../../Constants";

export default function CompanyPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  
  const [company, setCompany] = useState<any | null>(null);
  const [client, setClient] = useState<any | null>(null);
  const [print, setPrint] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [showPrintInformation, setShowPrintInformation] = useState(false);
  const [printPreferences, setPrintPreferences] = useState<any | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [onSiteByCode, setOnSiteByCode] = useState(false);
  const [isNearShop, setIsNearShop] = useState(false);
  const [nearbyAndFloat, setNearbyAndFloat] = useState(false);
  const [km, setKm] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [hasJob, setHasJob] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [floatOK, setFloatOK] = useState(true);
  const [queueTotal, setQueueTotal] = useState<number>(0);
  
  // Socket-related state - UPDATED for print-based queue
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState<number>(0);
  const [clientPrints, setClientPrints] = useState<any[]>([]);
  
  // Track multiple print positions
  const [myPrintPositions, setMyPrintPositions] = useState<Array<{
    printId: number;
    position: number;
    orderId: string;
    fileName: string;
  }>>([]);
  const [myQueuedPrints, setMyQueuedPrints] = useState<any[]>([]);

  const [tab, setTab] = useState<"activity" | "print" | "about">("activity");
  const location = useLocation();

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [modalCodeInput, setModalCodeInput] = useState("");
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [isModalOnSite, setIsModalOnSite] = useState(isNearShop);

  // Queue state
  const [queue, setQueue] = useState<any | null>(null);

  useEffect(() => {
    const h = (location.hash || "#activity").replace("#", "");
    if (h === "print" || h === "activity" || h === "about") setTab(h);
  }, [location.hash]);

  // Fetch company data
  useEffect(() => {
    (async () => {
      try {
        const c = await getCompanyByName(String(name), { 
          params: 'populate=queue,queue.prints,queue.prints.client' 
        });
        setCompany(c);
        setFloatOK((typeof c.float_balance === "number" ? c.float_balance : 0) > 0);
        
        if (c.queue && c.queue.prints) {
          setQueue(c.queue);
          const printsArray = Array.isArray(c.queue.prints) ? c.queue.prints : [];
          setQueueSize(printsArray.length);
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        toast.error('Company not found');
      }
    })();
  }, [name]);

  // Fetch queue for company - CONSISTENT PRINT-BASED QUEUE
  useEffect(() => {
    if (!company?.id) return;
    
    const fetchQueue = async () => {
      try {
        const queueData = await getQueueForCompany(company.id, { 
          params: 'populate=prints,prints.client,prints.pdf_file' 
        });
        console.log('queueData',queueData)
        if (queueData && queueData.prints) {
          const printsArray = Array.isArray(queueData.prints) ? queueData.prints : [];
          setQueueSize(printsArray.length);
          
          if (debugMode) console.log('[CompanyPage] Queue fetched:', {
            totalPrints: printsArray.length,
            prints: printsArray.map(p => ({ id: p.id, client: p.client?.id }))
          });
        } else {
          setQueueSize(0);
        }
      } catch (error) {
        console.error('[CompanyPage] Error fetching queue:', error);
        setQueueSize(0);
      }
    };
    
    fetchQueue();
  }, [company?.id]);

  // Fetch all queued prints for this client and calculate positions
  useEffect(() => {
    const fetchMyQueuedPrints = async () => {
      if (!client?.id || !company?.id) return;
      
      try {
        const prints = await getClientQueuedPrints(client.id, company.id);
        setMyQueuedPrints(prints || []);
        setHasJob(prints && prints.length > 0);
        
        if (debugMode) console.log('[CompanyPage] My queued prints:', prints);
        
        // Calculate positions based on queue order
        console.log('queue.prints',queue.prints)
        if (queue && queue.prints && prints.length > 0) {
          const positions = prints.map(print => {
            const position = queue.prints.findIndex((p: any) => p.id === print.id) + 1;
            return {
              printId: print.id,
              position: position > 0 ? position : 999,
              orderId: print.order_id || `#${print.id}`,
              fileName: print.fileName || 'Document'
            };
          }).filter(p => p.position < 999);
          
          setMyPrintPositions(positions);
        }
      } catch (error) {
        console.error('[CompanyPage] Error fetching queued prints:', error);
        setMyQueuedPrints([]);
      }
    };

    fetchMyQueuedPrints();
  }, [client?.id, company?.id, queue]);

  // Calculate proximity and nearbyAndFloat
  useEffect(() => {
    if (!company) return;

    const calculateProximity = async () => {
      // Check code first - CODE VALIDATION HAS PRIORITY
      let codeValid = false;
      if (codeInput.length === 4 && company?.id) {
        try {
          const refreshed = await getCompanyByName(String(company.name));
          codeValid = parseInt(String(refreshed?.printCode)) === parseInt(codeInput);
        } catch {
          codeValid = false;
        }
      }
      setOnSiteByCode(codeValid);

      // Calculate distance
      let kmValue: number | null = null;
      if (coords && company.location) {
        kmValue = haversineKm(coords, { 
          lat: company.location.lat, 
          lon: company.location.lng 
        });
      }
      setKm(kmValue);
      
      const radiusKm = (company.radiusConsideredNearInMeters || 500) / 1000;
      const nearByDistance = kmValue !== null && kmValue <= radiusKm;
      
      // User is considered "near" if EITHER code is valid OR within radius
      const nearCheck = codeValid || nearByDistance;
      setIsNearShop(nearCheck);
      
      // Can submit if near (by code OR distance) AND float is OK
      setNearbyAndFloat(floatOK && nearCheck);
    };

    calculateProximity();
  }, [coords, company, codeInput, floatOK]);

  // Get user coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  }, []);

  // Ensure client exists and keep location updated
  useEffect(() => {
    (async () => {
      if (!company) return;
      try {
        const cid = getClientId();
        if (!cid) return;
        
        let existing = await getClientByClientId(cid);
        if (!existing) {
          existing = await createClient({
            clientId: cid,
            currentLocation: coords
              ? { lat: coords.lat, lng: coords.lon }
              : undefined,
          });
        } else if (coords) {
          // Update client location
          await updateClient(existing.id, {
            currentLocation: { lat: coords.lat, lng: coords.lon }
          });
        }
        setClient(existing);
      } catch (error) {
        console.error('Error managing client:', error);
      }
    })();
  }, [company?.id, coords]);

  // Create draft print
  useEffect(() => {
    (async () => {
      if (!company || !client || print || creating) return;

      try {
        setCreating(true);
        const printId = localStorage.getItem("printId");
        if (printId) {
          const currentPrint = await getPrintById(printId, "populate=pdf_file");
          if (currentPrint?.pdf_file?.data) {
            setShowPrintInformation(true);
          }
          setPrint(currentPrint);
          
          // Check if already submitted/scheduled
          if (currentPrint?.state === "queued" || currentPrint?.state === "scheduled") {
            setHasJob(true);
            if (currentPrint?.state === "queued") setSubmitted(true);
            if (currentPrint?.state === "scheduled") setScheduled(true);
          }
        } else {
          const draft = await createPrint({
            dataFields: {
              cost_per_page: company.cost_per_page,
              cost_per_copy: company.cost_per_copy,
              client: Number(client.id),
              company: Number(company.id),
            },
          });
          localStorage.setItem("printId", String(draft.id));
          setPrint(await getPrintById(draft.id, "populate=pdf_file"));
        }
      } catch (error) {
        console.error('Error creating print:', error);
      } finally {
        setCreating(false);
      }
    })();
  }, [client?.id, company?.id, print]);

  // ============ SOCKET INTEGRATION ============
  
  // Join client room and watch company queue
  useEffect(() => {
    if (!socket || !connected || !client?.clientId || !company?.id) return;

    const clientId = client.clientId;
    const companyId = company.id;

    // Join client room
    socket.emit('client:join', { clientId });
    if (debugMode) console.log('[CompanyPage] Joined client room:', clientId);

    // Watch company queue
    socket.emit('queue:watch', { companyId });
    if (debugMode) console.log('[CompanyPage] Watching queue for company:', companyId);

    return () => {
      if (socket && connected) {
        socket.emit('queue:unwatch', { companyId });
        if (debugMode) console.log('[CompanyPage] Stopped watching queue');
      }
    };
  }, [socket, connected, client?.clientId, company?.id]);

  // UPDATED: Socket event listeners for print-based queue
  useEffect(() => {
    if (!socket || !connected) return;

    // Shared queue refetch function
    const fetchQueue = async () => {
      if (!company?.id) return;
      try {
        const queueData = await getQueueForCompany(company.id, { 
          params: 'populate=prints,prints.client,prints.pdf_file' 
        });
        
        if (queueData && queueData.prints) {
          setQueue(queueData);
          const printsArray = Array.isArray(queueData.prints) ? queueData.prints : [];
          setQueueSize(printsArray.length);
          
          if (debugMode) console.log('[CompanyPage] Queue fetched:', {
            totalPrints: printsArray.length,
            prints: printsArray
          });
        } else {
          setQueue(null);
          setQueueSize(0);
        }
      } catch (error) {
        console.error('[CompanyPage] Error fetching queue:', error);
        setQueue(null);
        setQueueSize(0);
      }
    };

    // Refetch client's queued prints and calculate positions
    const fetchMyPrints = async () => {
      if (!client?.id || !company?.id) return;
      try {
        const prints = await getClientQueuedPrints(client.id, company.id);
        setMyQueuedPrints(prints || []);
        setHasJob(prints && prints.length > 0);
        
        // Recalculate positions whenever queue or prints change
        if (queue && queue.prints && prints.length > 0) {
          const positions = prints.map(print => {
            const position = queue.prints.findIndex((p: any) => p.id === print.id) + 1;
            return {
              printId: print.id,
              position: position > 0 ? position : 999,
              orderId: print.order_id || `#${print.id}`,
              fileName: print.fileName || 'Document'
            };
          }).filter(p => p.position < 999);
          
          setMyPrintPositions(positions);
        }
      } catch (error) {
        console.error('[CompanyPage] Error refetching client prints:', error);
      }
    };

    const handleClientConnected = (data: any) => {
      if (debugMode) console.log('[CompanyPage] Client connected:', data);
    };

    // Handle queue position updates
    const handleQueuePosition = (data: any) => {
      if (debugMode) console.log('[CompanyPage] Queue position update:', data);
      
      // Update positions for this client's prints
      if (data.clientId === client?.clientId && data.prints && Array.isArray(data.prints)) {
        setMyPrintPositions(data.prints);
        
        // Show toast with position info
        if (data.prints.length === 1) {
          toast.info(`Queue Position: ${data.prints[0].position} of ${data.total}`, {
            description: `Order ${data.prints[0].orderId} - Est. wait: ~${data.prints[0].position * 5} min`,
          });
        } else {
          const positions = data.prints.map((p: any) => p.position).join(', ');
          toast.info(`Your prints at positions: ${positions}`, {
            description: `${data.prints.length} prints in queue`,
          });
        }
      }
      
      setQueueTotal(data.total);
    };

    const handleQueueUpdated = async (data: any) => {
      if (debugMode) console.log('[CompanyPage] Queue updated:', data);
      
      // Update queue size immediately from the event
      if (data.queue?.total !== undefined) {
        setQueueSize(data.queue.total);
      }
      
      // Refetch full queue data with all print details
      await fetchQueue();
      await fetchMyPrints();
    };

    const handlePrintQueued = async (data: any) => {
      if (debugMode) console.log('[CompanyPage] Print queued event:', data);
      
      // Show notification for own print
      if (data.printId === print?.id) {
        setPrintStatus('queued');
        
        toast.success('Print submitted successfully!', {
          description: data.orderId ? `Order ID: ${data.orderId}` : 'Added to queue',
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Print Queued', {
            body: `Your print job has been added to the queue`,
            icon: '/logo.png',
          });
        }
      }
      
      // CRITICAL: Refetch queue for ALL clients when ANY print is queued
      await fetchQueue();
      await fetchMyPrints();
    };

    const handlePrintScheduled = (data: any) => {
      if (data.printId === print?.id) {
        if (debugMode) console.log('[CompanyPage] Your print was scheduled!');
        setPrintStatus('scheduled');
        
        toast.success('Print scheduled successfully!', {
          description: data.scheduledTime 
            ? `Scheduled for ${new Date(data.scheduledTime).toLocaleString()}`
            : 'Print has been scheduled',
        });
      }
    };

    const handlePrintPrinting = async (data: any) => {
      if (debugMode) console.log('[CompanyPage] Print printing event:', data);
      
      if (data.printId === print?.id) {
        setPrintStatus('printing');
        
        toast.info('Printing started', {
          description: 'Your document is now being printed',
          duration: 5000,
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Printing Started', {
            body: `${data.fileName} is now being printed`,
            icon: '/logo.png',
          });
        }
      }
      
      // Refetch queue as print may have been removed
      await fetchQueue();
      await fetchMyPrints();
    };

    const handlePrintCompleted = async (data: any) => {
      if (debugMode) console.log('[CompanyPage] Print completed event:', data);
      
      if (data.printId === print?.id) {
        setPrintStatus('completed');
        
        toast.success('Print completed!', {
          description: 'Your document is ready for pickup',
          duration: 10000,
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Print Ready!', {
            body: `${data.fileName} is ready for pickup`,
            icon: '/logo.png',
            requireInteraction: true,
          });
        }
        
        // Clear local print data
        localStorage.removeItem('printId');
        setHasJob(false);
        setSubmitted(false);
        setScheduled(false);
        setPrint(null);
        setShowPrintInformation(false);
      }
      
      // Remove completed print from myPrintPositions
      setMyPrintPositions(prev => prev.filter(p => p.printId !== data.printId));
      
      // Refetch queue and client's prints
      await fetchQueue();
      await fetchMyPrints();
    };

    const handlePrintCanceled = async (data: any) => {
      if (debugMode) console.log('[CompanyPage] Print canceled event:', data);
      
      if (data.printId === print?.id) {
        setPrintStatus('canceled');
        
        toast.error('Print canceled', {
          description: data.reason || 'The print job was canceled',
        });
        
        // Clear local print data
        localStorage.removeItem('printId');
        setHasJob(false);
        setSubmitted(false);
        setScheduled(false);
        setPrint(null);
        setShowPrintInformation(false);
      }
      
      // Remove from myPrintPositions
      setMyPrintPositions(prev => prev.filter(p => p.printId !== data.printId));
      
      // Refetch queue and client's prints
      await fetchQueue();
      await fetchMyPrints();
    };

    const handleCompanyUnavailable = (data: any) => {
      if (data.companyId === company?.id) {
        if (debugMode) console.log('[CompanyPage] Company became unavailable');
        toast.warning('Company unavailable', {
          description: data.reason === 'float_depleted' 
            ? 'Company has run out of float balance'
            : 'Company is currently unavailable',
        });
        
        setFloatOK(false);
      }
    };

    const handleCompanyFloatToppedUp = (data: any) => {
      if (data.companyId === company?.id) {
        if (debugMode) console.log('[CompanyPage] Company float topped up');
        toast.success('Company float replenished', {
          description: 'You can now submit prints immediately',
        });
        
        setFloatOK(true);
      }
    };

    // Register all event listeners
    socket.on('client:connected', handleClientConnected);
    socket.on('queue:position', handleQueuePosition);
    socket.on('queue:updated', handleQueueUpdated);
    socket.on('print:queued', handlePrintQueued);
    socket.on('print:scheduled', handlePrintScheduled);
    socket.on('print:printing', handlePrintPrinting);
    socket.on('print:completed', handlePrintCompleted);
    socket.on('print:canceled', handlePrintCanceled);
    socket.on('company:unavailable', handleCompanyUnavailable);
    socket.on('company:float-topped-up', handleCompanyFloatToppedUp);

    // Cleanup
    return () => {
      socket.off('client:connected', handleClientConnected);
      socket.off('queue:position', handleQueuePosition);
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('print:queued', handlePrintQueued);
      socket.off('print:scheduled', handlePrintScheduled);
      socket.off('print:printing', handlePrintPrinting);
      socket.off('print:completed', handlePrintCompleted);
      socket.off('print:canceled', handlePrintCanceled);
      socket.off('company:unavailable', handleCompanyUnavailable);
      socket.off('company:float-topped-up', handleCompanyFloatToppedUp);
    };
  }, [socket, connected, print?.id, company?.id, client?.id, queue]);

  // POLLING BACKUP - Remove once sockets work reliably
  useEffect(() => {
    if(socket && connected){
      return
    }
    if (!company?.id || !client?.id) return;
    
    if (debugMode) console.log('[CompanyPage] Starting polling backup...');
    
    const pollInterval = setInterval(async () => {
      try {
        // Poll queue data
        const queueData = await getQueueForCompany(company.id, { 
          params: 'populate=prints,prints.client' 
        });
        
        if (queueData && queueData.prints) {
          if (debugMode) console.log('[POLLING] Queue has', queueData.prints.length, 'prints');
          setQueue(queueData);
          const printsArray = Array.isArray(queueData.prints) ? queueData.prints : [];
          setQueueSize(printsArray.length);
        } else {
          if (debugMode) console.log('[POLLING] No queue data');
          setQueue(null);
          setQueueSize(0);
        }
        
        // Poll client's prints
        const myPrints = await getClientQueuedPrints(client.id, company.id);
        if (debugMode) console.log('[POLLING] My prints:', myPrints.length);
        setMyQueuedPrints(myPrints || []);
        setHasJob(myPrints && myPrints.length > 0);
        
        // Calculate positions
        if (queueData && queueData.prints && myPrints.length > 0) {
          const positions = myPrints.map(myPrint => {
            const position = queueData.prints.findIndex((p: any) => p.id === myPrint.id) + 1;
            return {
              printId: myPrint.id,
              position: position > 0 ? position : 999,
              orderId: myPrint.order_id || `#${myPrint.id}`,
              fileName: myPrint.fileName || 'Document'
            };
          }).filter(p => p.position < 999);
          
          if (debugMode) console.log('[POLLING] Calculated positions:', positions);
          setMyPrintPositions(positions);
        }
        
      } catch (error) {
        if (debugMode) console.error('[POLLING] Error:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => {
      if (debugMode) console.log('[CompanyPage] Stopping polling backup');
      clearInterval(pollInterval);
    };
  }, [company?.id, client?.id]);

  // ============ HANDLERS ============

  const handleCheckLocation = () => {
    setCheckingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          // Recalculate proximity
          if (company && pos.coords) {
            const kmValue = haversineKm(
              { lat: pos.coords.latitude, lon: pos.coords.longitude },
              { lat: company.location.lat, lon: company.location.lng }
            );
            const radiusKm = (company.radiusConsideredNearInMeters || 500) / 1000;
            setIsModalOnSite(kmValue <= radiusKm);
          }
          setCheckingLocation(false);
        },
        () => setCheckingLocation(false),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  };

  const handleSubmit = async () => {
    if (!print || !printPreferences) return;
    // Only allow if onsite or code is valid
    if (!isModalOnSite && (!modalCodeInput || modalCodeInput.length !== 4)) return;
    const updateObject = {
      file_pages_count: printPreferences.pages,
      copies_requested: printPreferences.copies,
      cost_per_page: printPreferences.perPageRate,
      cost_per_copy: printPreferences.costPerCopy,
      final_cost_amount: printPreferences.totalCost,
      laminated: printPreferences.laminated,
      colored: printPreferences.colored,
      bound: printPreferences.bound,
      state: "queued",
      printCode: modalCodeInput || undefined,
    };
    setSubmitting(true);
    try {
      await updatePrint(Number(print.id), updateObject);
      setHasJob(true);
      setSubmitted(true);
      toast.success("Submitted for immediate printing");
      createHistory({
        activity: "submitted print",
        activityBody: `You submitted a print #${print.id}`,
        client: client ? Number(client.id) : undefined,
        user: null,
      });
      localStorage.removeItem("printId");
      setTab("activity");
      setSubmitModalOpen(false);
    } catch (error) {
      console.error('Error submitting print:', error);
      toast.error('Failed to submit print');
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSchedulePrint = async () => {
    if (!print || !printPreferences || !scheduleTime) return;
    const updateObject = {
      file_pages_count: printPreferences.pages,
      copies_requested: printPreferences.copies,
      cost_per_page: printPreferences.perPageRate,
      cost_per_copy: printPreferences.costPerCopy,
      final_cost_amount: printPreferences.totalCost,
      laminated: printPreferences.laminated,
      colored: printPreferences.colored,
      bound: printPreferences.bound,
      state: "scheduled",
      scheduled: true,
      scheduled_time: scheduleTime,
    };
    setScheduling(true);
    try {
      await updatePrint(Number(print.id), updateObject);
      setHasJob(true);
      setScheduled(true);
      toast("Scheduled successfully");
      createHistory({
        activity: "scheduled print",
        activityBody: `You scheduled a print #${print.id}`,
        client: client ? Number(client.id) : undefined,
        user: null,
      });
      localStorage.removeItem("printId");
      setTab("activity");
      setScheduleModalOpen(false);
    } catch (error) {
      console.error('Error scheduling print:', error);
      toast.error('Failed to schedule print');
      setScheduled(false);
    } finally {
      setScheduling(false);
    }
  };

  // UPDATED: Render multiple print positions
  const renderQueuePositions = () => {
    if (!myPrintPositions || myPrintPositions.length === 0) {
      return (
        <div className="mt-4 text-sm text-muted-foreground">
          You have no prints in the queue
        </div>
      );
    }

    // Single print - simple display
    if (myPrintPositions.length === 1) {
      const print = myPrintPositions[0];
      return (
        <div className="mt-4 text-sm">
          Your Position:{" "}
          <span className="font-semibold">{print.position}</span>
          {print.orderId && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Order {print.orderId})
            </span>
          )}
        </div>
      );
    }

    // Multiple prints - detailed list
    return (
      <div className="mt-4">
        <div className="text-sm font-medium mb-2">Your Prints in Queue:</div>
        <div className="space-y-2">
          {myPrintPositions.map((print) => (
            <div 
              key={print.printId} 
              className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {print.orderId || `#${print.printId}`}
                </Badge>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {print.fileName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Position:</span>
                <span className="font-semibold">{print.position}</span>
                <span className="text-xs text-muted-foreground">
                  (~{print.position * 5} min)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!company) {
    return (
      <section className="container py-10">
        <Button onClick={() => navigate(-1)} className="mb-4">
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Company not found</CardTitle>
            <CardDescription>It may have been removed.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }
  
  // UPDATED: Calculate estimated wait from print positions
  const estWait = myPrintPositions.length > 0
    ? Math.min(...myPrintPositions.map(p => p.position)) * 5
    : queueSize * 2;

  return (
    <div className="pb-20">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold truncate">{company.name}</div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Queue {queueSize} prints</Badge>
            {connected && (
              <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
            )}
          </div>
        </div>
      </header>

      {tab === "activity" && (
        <section className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>
                Live queue and your jobs with this company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span>Queue size</span>
                <span>{queueSize} prints</span>
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (myPrintPositions.length / Math.max(queueSize, 1)) * 100)}%` 
                  }}
                />
              </div>
              <div className="mt-4 text-sm">
                Estimated wait time:{" "}
                <span className="font-semibold">~{estWait} min</span>
              </div>
              
              {renderQueuePositions()}
              
              {myPrintPositions.length > 0 ? (
                <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <div className="text-sm text-green-900 dark:text-green-100 font-medium">
                    {myPrintPositions.length} {myPrintPositions.length === 1 ? 'job' : 'jobs'} in queue
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">
                  No active jobs.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {tab === "print" && (
        <section className="container py-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" /> Print
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">Queue: {queueSize}</Badge>
                    {myPrintPositions.length > 0 && (
                      <Badge variant="outline" className="font-mono">
                        {myPrintPositions.length} {myPrintPositions.length === 1 ? 'job' : 'jobs'} in queue
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Upload files and submit. Enter the 4-digit code or be within {company.radiusConsideredNearInMeters || 500}m 
                  to submit immediately; otherwise schedule.
                </CardDescription>
                <div className="text-sm text-muted-foreground">
                  You can submit multiple prints and each will have its own position in the queue.
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {print ? (
                <Uploader
                  refId={print.id}
                  refName="api::print.print"
                  fieldName="file"
                  allowedTypes={[
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-powerpoint",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    "application/vnd.oasis.opendocument.text",
                    "application/vnd.oasis.opendocument.spreadsheet",
                    "application/vnd.oasis.opendocument.presentation",
                    "text/plain",
                    "application/rtf",
                    "text/html",
                    "application/xml",
                    "text/xml",
                    "text/csv",
                  ]}
                  onUploaded={async (res) => {
                    setHasJob(true);
                    toast("File uploaded");
                    const printWithNewFile = await getPrintById(print.id, "populate=pdf_file");
                    setPrint(printWithNewFile);
                    setShowPrintInformation(true);
                    const fileName =
                      Array.isArray(res) && res[0]?.name ? res[0].name : "file";
                    try {
                      createHistory({
                        activity: "uploaded file",
                        activityBody: `You uploaded ${fileName}`,
                        client: client ? Number(client.id) : undefined,
                        user: null,
                      });
                    } catch {}
                    if (Notification?.permission === "granted") {
                      new Notification("Upload completed", {
                        body: `${fileName} ready`,
                      });
                    }
                  }}
                />
              ) : (
                <div className="flex h-44 w-full items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
                  Preparing uploader...
                </div>
              )}

              {print && showPrintInformation ? (
                <PrintInformation
                  setPrintPreferences={setPrintPreferences}
                  draftPrint={print}
                  company={company}
                />
              ) : null}

              <div className="mt-4 flex flex-col gap-2">
                {print?.state === "queued" || print?.state === "scheduled" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={true}>
                      {print?.state === "queued" ? "Submitted" : "Scheduled"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={submitted || submitting || !print || !printPreferences}
                        onClick={() => setSubmitModalOpen(true)}
                      >
                        {submitted ? "Submitted" : submitting ? "Submitting..." : "Submit now"}
                      </Button>
                      {company.allowsPrintScheduling ? (
                        <Button 
                          disabled={scheduled || scheduling || !print || !printPreferences} 
                          variant="secondary" 
                          onClick={() => setScheduleModalOpen(true)}
                        >
                          {scheduled ? "Scheduled" : scheduling ? "Scheduling..." : "Schedule print"}
                        </Button>
                      ) : null}
                    </div>
                    
                    {myPrintPositions.length > 0 && (
                      <div className="border rounded p-3 space-y-2">
                        <h3 className="text-sm font-medium">Your Prints in Queue:</h3>
                        <div className="space-y-2">
                          {myPrintPositions.map((p) => (
                            <div key={p.printId} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {p.orderId || `#${p.printId}`}
                                </Badge>
                                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                  {p.fileName}
                                </span>
                              </div>
                              <Badge variant="default" className="font-mono">
                                Position #{p.position}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Submit Modal */}
          <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Print Submission</DialogTitle>
              </DialogHeader>
              {!isModalOnSite && (
                <div className="mb-4 text-red-600 font-semibold">You seem to be far from the shop</div>
              )}
              {!isModalOnSite && (
                <Button
                  variant="outline"
                  className="mb-2"
                  onClick={handleCheckLocation}
                  disabled={checkingLocation}
                >
                  {checkingLocation ? "Checking..." : "Check my current location"}
                </Button>
              )}
              {!isModalOnSite && (
                <input
                  type="text"
                  maxLength={4}
                  value={modalCodeInput}
                  onChange={(e) => setModalCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit code from shop"
                  className="w-full rounded border px-3 py-2 text-center text-sm font-mono mb-2"
                />
              )}
              {!isModalOnSite && (
                <div className="text-xs text-muted-foreground mb-2">
                  Get a code from the shop and use it to print now or schedule if you are not onsite
                </div>
              )}
              <div className="flex justify-center gap-4 mt-6">
                <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (!isModalOnSite && (!modalCodeInput || modalCodeInput.length !== 4))}
                >
                  Confirm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {/* Schedule Modal with Time Picker */}
          <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Print Pickup</DialogTitle>
              </DialogHeader>
              <div className="mb-4">
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-center text-sm font-mono mb-2"
                />
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSchedulePrint}
                  disabled={scheduling || !scheduleTime}
                >
                  Confirm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>
      )}

      {tab === "about" && (
        <section className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" /> About
              </CardTitle>
              <CardDescription>
                Location and details for this company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> 
                  <span>
                    lat {company.location?.lat?.toFixed(5)}, lon {company.location?.lng?.toFixed(5)}
                  </span>
                </div>
                <div>
                  <strong>Proximity radius:</strong> {company.radiusConsideredNearInMeters || 500}m
                </div>
                <div>
                  <strong>Company code:</strong> Available on-site
                </div>
                <div className="pt-3 mt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    <strong>Queue System:</strong> Each print job is tracked individually. 
                    You can submit multiple prints and each will have its own position in the queue.
                  </div>
                </div>
              </div>
              
              {company.location && (
                <>
                  <iframe
                    className="mt-4 h-56 w-full rounded-md border"
                    title="map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${company.location.lng - 0.01}%2C${company.location.lat - 0.01}%2C${company.location.lng + 0.01}%2C${company.location.lat + 0.01}&layer=mapnik&marker=${company.location.lat}%2C${company.location.lng}`}
                  />
                  <a
                    className="mt-2 block text-xs text-primary hover:underline"
                    href={`https://www.openstreetmap.org/?mlat=${company.location.lat}&mlon=${company.location.lng}#map=16/${company.location.lat}/${company.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in map
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
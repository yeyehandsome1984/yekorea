import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Filter, Trash2, Image as ImageIcon, X, Pencil, FileText, Download } from "lucide-react";
import { PdfThumbnail } from "@/components/study-tracker/PdfThumbnail";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  fetchAllStudySessions,
  createStudySession,
  updateStudySession,
  deleteStudySession,
  uploadStudyImage,
  StudySession,
} from "@/lib/studySessions";
import {
  fetchAllCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  uploadCertificateFile,
  Certificate,
} from "@/lib/certificates";

const PRESET_TOPICS = ["Data", "Web/App", "Korean"];

export default function StudyTracker() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const { toast } = useToast();

  // Form states
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState("");
  const [studyDate, setStudyDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState("");
  const [hours, setHours] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Filter states
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [showSummary, setShowSummary] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 20;

  // Certificate states
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [certName, setCertName] = useState("");
  const [certDate, setCertDate] = useState<Date>(new Date());
  const [certDescription, setCertDescription] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certUploading, setCertUploading] = useState(false);

  // Get all unique topics
  const allTopics = Array.from(new Set(sessions.map(s => s.topic)));

  useEffect(() => {
    loadSessions();
    loadCertificates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filterTopic, filterDateFrom, filterDateTo]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchAllStudySessions();
      setSessions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load study sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      const data = await fetchAllCertificates();
      setCertificates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load certificates",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    if (filterTopic !== "all") {
      filtered = filtered.filter(s => s.topic === filterTopic);
    }

    if (filterDateFrom) {
      filtered = filtered.filter(s => new Date(s.study_date) >= filterDateFrom);
    }

    if (filterDateTo) {
      filtered = filtered.filter(s => new Date(s.study_date) <= filterDateTo);
    }

    setFilteredSessions(filtered);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadStudyImage(file));
      const urls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...urls]);
      toast({
        title: "Success",
        description: `${files.length} image(s) uploaded`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      setUploading(true);
      try {
        const uploadPromises = imageFiles.map(file => uploadStudyImage(file));
        const urls = await Promise.all(uploadPromises);
        setUploadedImages([...uploadedImages, ...urls]);
        toast({
          title: "Success",
          description: `${imageFiles.length} image(s) pasted`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload pasted images",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleEdit = (session: StudySession) => {
    setEditingSession(session);
    setSelectedTopic(PRESET_TOPICS.includes(session.topic) ? session.topic : "custom");
    if (!PRESET_TOPICS.includes(session.topic)) {
      setCustomTopic(session.topic);
    }
    setStudyDate(new Date(session.study_date));
    setSummary(session.summary || "");
    setHours(session.hours.toString());
    setUploadedImages(session.image_urls || []);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const finalTopic = selectedTopic === "custom" ? customTopic : selectedTopic;

    if (!finalTopic || !hours) {
      toast({
        title: "Error",
        description: "Please fill in topic and hours",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingSession) {
        await updateStudySession(editingSession.id, {
          topic: finalTopic,
          study_date: format(studyDate, "yyyy-MM-dd"),
          summary: summary || null,
          hours: parseFloat(hours),
          image_urls: uploadedImages,
        });

        toast({
          title: "Success",
          description: "Study session updated",
        });
      } else {
        await createStudySession({
          topic: finalTopic,
          study_date: format(studyDate, "yyyy-MM-dd"),
          summary: summary || null,
          hours: parseFloat(hours),
          image_urls: uploadedImages,
        });

        toast({
          title: "Success",
          description: "Study session added",
        });
      }

      // Reset form
      setSelectedTopic("");
      setCustomTopic("");
      setStudyDate(new Date());
      setSummary("");
      setHours("");
      setUploadedImages([]);
      setEditingSession(null);
      setDialogOpen(false);
      loadSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: editingSession ? "Failed to update study session" : "Failed to add study session",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this study session?")) return;

    try {
      await deleteStudySession(id);
      toast({
        title: "Success",
        description: "Study session deleted",
      });
      loadSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete study session",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleEditCertificate = (cert: Certificate) => {
    setEditingCertificate(cert);
    setCertName(cert.certificate_name);
    setCertDate(new Date(cert.issue_date));
    setCertDescription(cert.description || "");
    setCertFile(null);
    setCertDialogOpen(true);
  };

  const handleCertificateSubmit = async () => {
    if (!certName || (!certFile && !editingCertificate)) {
      toast({
        title: "Error",
        description: "Please provide certificate name and file",
        variant: "destructive",
      });
      return;
    }

    try {
      setCertUploading(true);
      
      if (editingCertificate) {
        // Update mode
        const updates: Partial<Certificate> = {
          certificate_name: certName,
          issue_date: format(certDate, "yyyy-MM-dd"),
          description: certDescription || null,
        };

        // Only upload new file if one was selected
        if (certFile) {
          const fileUrl = await uploadCertificateFile(certFile);
          updates.certificate_url = fileUrl;
        }

        await updateCertificate(editingCertificate.id, updates);

        toast({
          title: "Success",
          description: "Certificate updated",
        });
      } else {
        // Create mode
        const fileUrl = await uploadCertificateFile(certFile!);
        
        await createCertificate({
          certificate_name: certName,
          certificate_url: fileUrl,
          issue_date: format(certDate, "yyyy-MM-dd"),
          description: certDescription || null,
        });

        toast({
          title: "Success",
          description: "Certificate added",
        });
      }

      setCertName("");
      setCertDate(new Date());
      setCertDescription("");
      setCertFile(null);
      setEditingCertificate(null);
      setCertDialogOpen(false);
      loadCertificates();
    } catch (error) {
      toast({
        title: "Error",
        description: editingCertificate ? "Failed to update certificate" : "Failed to add certificate",
        variant: "destructive",
      });
    } finally {
      setCertUploading(false);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!confirm("Delete this certificate?")) return;

    try {
      await deleteCertificate(id);
      toast({
        title: "Success",
        description: "Certificate deleted",
      });
      loadCertificates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete certificate",
        variant: "destructive",
      });
    }
  };

  // Calculate total hours by topic
  const hoursByTopic = filteredSessions.reduce((acc, session) => {
    acc[session.topic] = (acc[session.topic] || 0) + Number(session.hours);
    return acc;
  }, {} as Record<string, number>);

  const totalHours = Object.values(hoursByTopic).reduce((sum, h) => sum + h, 0);

  // Pagination calculations
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstSession, indexOfLastSession);
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-start items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSummary(!showSummary)}
          >
            {showSummary ? "Hide" : "Show"} Total Hours
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingSession(null);
              setSelectedTopic("");
              setCustomTopic("");
              setStudyDate(new Date());
              setSummary("");
              setHours("");
              setUploadedImages([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Study Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSession ? "Edit Study Session" : "Add Study Session"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Topic</Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_TOPICS.map(topic => (
                        <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Topic...</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedTopic === "custom" && (
                    <Input
                      className="mt-2"
                      placeholder="Enter custom topic"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !studyDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {studyDate ? format(studyDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={studyDate}
                        onSelect={(date) => date && setStudyDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g., 2.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Summary</Label>
                  <Textarea
                    placeholder="What did you study? (You can also paste images here)"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    onPaste={handlePaste}
                    rows={6}
                  />
                </div>

                <div>
                  <Label>Images/Screenshots</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can also paste images directly into the summary field
                    </p>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img src={url} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover rounded border" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                  {uploading ? "Uploading..." : (editingSession ? "Update Session" : "Add Session")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={certDialogOpen} onOpenChange={(open) => {
            setCertDialogOpen(open);
            if (!open) {
              setCertName("");
              setCertDate(new Date());
              setCertDescription("");
              setCertFile(null);
              setEditingCertificate(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Add Certificates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCertificate ? "Edit Certificate" : "Add Certificate"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Certificate Name</Label>
                  <Input
                    placeholder="e.g., AWS Certified Developer"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Issue Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !certDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {certDate ? format(certDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={certDate}
                        onSelect={(date) => date && setCertDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Additional details about the certificate"
                    value={certDescription}
                    onChange={(e) => setCertDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Certificate File {editingCertificate && "(Optional - leave empty to keep current file)"}</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCertFile(e.target.files[0]);
                      }
                    }}
                    disabled={certUploading}
                    className="cursor-pointer"
                  />
                  {certFile ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {certFile.name}
                    </p>
                  ) : editingCertificate ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current file will be kept if no new file is selected
                    </p>
                  ) : null}
                </div>

                <Button onClick={handleCertificateSubmit} className="w-full" disabled={certUploading}>
                  {certUploading ? "Uploading..." : (editingCertificate ? "Update Certificate" : "Add Certificate")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
        {showSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
              </CardContent>
            </Card>
            {Object.entries(hoursByTopic).map(([topic, hrs]) => (
              <Card key={topic}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{topic}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hrs.toFixed(1)}h</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Topic</Label>
                <Select value={filterTopic} onValueChange={setFilterTopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {allTopics.map(topic => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateFrom ? format(filterDateFrom, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateFrom}
                      onSelect={setFilterDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateTo ? format(filterDateTo, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateTo}
                      onSelect={setFilterDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {(filterTopic !== "all" || filterDateFrom || filterDateTo) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setFilterTopic("all");
                  setFilterDateFrom(undefined);
                  setFilterDateTo(undefined);
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredSessions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No study sessions found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs py-2">Date</TableHead>
                      <TableHead className="text-xs py-2">Topic</TableHead>
                      <TableHead className="text-xs py-2">Hours</TableHead>
                      <TableHead className="text-xs py-2">Summary</TableHead>
                      <TableHead className="text-xs py-2">Images</TableHead>
                      <TableHead className="text-xs py-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSessions.map((session) => (
                      <TableRow key={session.id} className="h-10">
                        <TableCell className="whitespace-nowrap text-xs py-2">
                          {format(new Date(session.study_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          <span className="font-medium">{session.topic}</span>
                        </TableCell>
                        <TableCell className="text-xs py-2">{session.hours}h</TableCell>
                        <TableCell className="max-w-md text-xs py-2">
                          <div className="line-clamp-2">{session.summary || "-"}</div>
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          {session.image_urls && session.image_urls.length > 0 ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  {session.image_urls.length}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="grid grid-cols-2 gap-2">
                                  {session.image_urls.map((url, index) => (
                                    <img
                                      key={index}
                                      src={url}
                                      alt={`Session ${index + 1}`}
                                      className="w-full h-32 object-cover rounded border"
                                    />
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => handleEdit(session)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => handleDelete(session.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && filteredSessions.length > sessionsPerPage && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => paginate(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map((cert) => (
                  <Card key={cert.id} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-sm flex-1">{cert.certificate_name}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCertificate(cert)}
                            className="h-6 w-6 p-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCertificate(cert.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Certificate thumbnail preview */}
                      <div className="mb-3 w-full h-32 rounded border overflow-hidden bg-muted">
                        {cert.certificate_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img 
                            src={cert.certificate_url} 
                            alt={cert.certificate_name}
                            className="w-full h-full object-cover"
                          />
                        ) : cert.certificate_url.match(/\.pdf$/i) ? (
                          <PdfThumbnail url={cert.certificate_url} className="w-full h-full" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary/5 to-primary/10">
                            <FileText className="h-12 w-12 text-primary mb-2" />
                            <span className="text-xs text-muted-foreground">Document</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        Issued: {format(new Date(cert.issue_date), "MMM dd, yyyy")}
                      </p>
                      {cert.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {cert.description}
                        </p>
                      )}
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-primary hover:underline"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        View Certificate
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

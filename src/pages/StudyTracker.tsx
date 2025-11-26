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
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Filter, Trash2, Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  fetchAllStudySessions,
  createStudySession,
  deleteStudySession,
  uploadStudyImage,
  StudySession,
} from "@/lib/studySessions";

const PRESET_TOPICS = ["Data", "Web/App", "Korean"];

export default function StudyTracker() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // Get all unique topics
  const allTopics = Array.from(new Set(sessions.map(s => s.topic)));

  useEffect(() => {
    loadSessions();
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

      // Reset form
      setSelectedTopic("");
      setCustomTopic("");
      setStudyDate(new Date());
      setSummary("");
      setHours("");
      setUploadedImages([]);
      setDialogOpen(false);
      loadSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add study session",
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

  // Calculate total hours by topic
  const hoursByTopic = filteredSessions.reduce((acc, session) => {
    acc[session.topic] = (acc[session.topic] || 0) + Number(session.hours);
    return acc;
  }, {} as Record<string, number>);

  const totalHours = Object.values(hoursByTopic).reduce((sum, h) => sum + h, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Study Tracker</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Study Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Study Session</DialogTitle>
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
                  {uploading ? "Uploading..." : "Add Session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          <CardHeader>
            <CardTitle>Study Sessions ({filteredSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredSessions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No study sessions found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(session.study_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{session.topic}</span>
                        </TableCell>
                        <TableCell>{session.hours}h</TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-sm line-clamp-2">{session.summary || "-"}</div>
                        </TableCell>
                        <TableCell>
                          {session.image_urls && session.image_urls.length > 0 ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ImageIcon className="h-4 w-4 mr-1" />
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
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlanCard from '@/components/learning-plans/PlanCard';
import PlanDetail from '@/components/learning-plans/PlanDetail';
import CreatePlanModal from '@/components/learning-plans/CreatePlanModal';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  phonetic?: string;
  isBookmarked: boolean;
  isKnown?: boolean;
}
interface Plan {
  id: string;
  title: string;
  description: string;
  chapterId: string;
  chapterTitle: string;
  dailyWordGoal: number;
  totalWords: number;
  totalDays: number;
  createdAt: string;
  startedAt: string;
  currentSetIndex: number;
  isActive: boolean;
  sets: any[];
  completedSets: string[];
}
const LOCAL_STORAGE_KEY = 'learning_plans';
const LearningPlans = () => {
  const {
    toast
  } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    const savedPlans = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedPlans) {
      try {
        setPlans(JSON.parse(savedPlans));
      } catch (e) {
        console.error("Error parsing plans from localStorage:", e);
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);
  const handleCreatePlan = (newPlan: Plan) => {
    newPlan.isActive = true;
    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    toast({
      title: "Plan created",
      description: `"${newPlan.title}" has been created successfully with ${newPlan.totalWords} active words.`
    });
  };
  const handleUpdatePlan = (updatedPlan: Plan) => {
    const updatedPlans = plans.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan);
    setPlans(updatedPlans);
    toast({
      title: "Plan updated",
      description: `"${updatedPlan.title}" has been updated successfully.`
    });
  };
  const handleActivatePlan = (planId: string) => {
    const updatedPlans = plans.map(plan => ({
      ...plan,
      isActive: plan.id === planId ? !plan.isActive : plan.isActive
    }));
    setPlans(updatedPlans);
    const activatedPlan = updatedPlans.find(plan => plan.id === planId);
    toast({
      title: activatedPlan?.isActive ? "Plan activated" : "Plan deactivated",
      description: `"${activatedPlan?.title}" is ${activatedPlan?.isActive ? "now" : "no longer"} an active learning plan.`
    });
  };
  const handleDeletePlan = () => {
    if (!planToDelete) return;
    const updatedPlans = plans.filter(plan => plan.id !== planToDelete);
    setPlans(updatedPlans);
    toast({
      title: "Plan deleted",
      description: "The learning plan has been deleted."
    });
    if (selectedPlanId === planToDelete) {
      setSelectedPlanId(null);
    }
    setPlanToDelete(null);
    setShowDeleteConfirm(false);
  };
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
  const calculateDaysLeft = (plan: Plan) => {
    return Math.max(0, plan.totalDays - plan.completedSets.length);
  };
  return <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {selectedPlanId && selectedPlan ? <PlanDetail plan={selectedPlan} onBackClick={() => setSelectedPlanId(null)} onUpdatePlan={handleUpdatePlan} onDeletePlan={id => {
        setPlanToDelete(id);
        setShowDeleteConfirm(true);
      }} /> : <>
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="font-bold text-gray-900 text-2xl">Learning Plans</h1>
                
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Plan
              </Button>
            </div>

            {plans.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => <PlanCard key={plan.id} id={plan.id} title={plan.title} description={plan.description || `${plan.dailyWordGoal} words per day`} daysLeft={calculateDaysLeft(plan)} chaptersCompleted={plan.completedSets.length} totalChapters={plan.totalDays} active={plan.isActive} onViewClick={() => setSelectedPlanId(plan.id)} onActivateClick={() => handleActivatePlan(plan.id)} onDeleteClick={() => {
            setPlanToDelete(plan.id);
            setShowDeleteConfirm(true);
          }} />)}
              </div> : <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Plans Yet</h3>
                <p className="text-gray-500 mb-6">Create your first learning plan to get started.</p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Learning Plan
                </Button>
              </div>}
          </>}
      </main>

      <CreatePlanModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreatePlan={handleCreatePlan} />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Learning Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this learning plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default LearningPlans;